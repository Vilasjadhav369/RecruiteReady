import AptitudeAttempt from '../models/AptitudeAttempt.js';
import CodingSubmission from '../models/CodingSubmission.js';
import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import Company from '../models/Company.js';

/**
 * GET /api/dashboard/summary
 * Returns real, highly personalized student dashboard data aggregated from MongoDB.
 * Zero fabricated/fake metrics. Transparent calculations for readiness, streak,
 * weak areas, profile completion, and next-step recommendations.
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    const user = req.user;
    const userId = user._id;

    // 1. Parallel database queries for optimal performance with strict field projection
    const [
      allAptitudeAttempts,
      allCodingSubmissions,
      allMockAttempts,
      publishedMockTests,
      matchedCompanies,
    ] = await Promise.all([
      AptitudeAttempt.find({ user: userId })
        .select('topic category difficulty totalQuestions correctAnswers score percentage status startedAt submittedAt createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      CodingSubmission.find({ user: userId })
        .populate('problem', 'title difficulty')
        .select('problem language status submittedAt createdAt')
        .sort({ submittedAt: -1 })
        .lean(),
      MockTestAttempt.find({ user: userId })
        .populate('mockTest', 'title totalQuestions durationMinutes categories difficulty')
        .select('mockTest totalQuestions correctAnswers percentage status startedAt submittedAt createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      MockTest.find({ isPublished: true })
        .select('title durationMinutes totalQuestions categories difficulty')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      Array.isArray(user.targetCompanies) && user.targetCompanies.length > 0
        ? Company.find({ name: { $in: user.targetCompanies }, isActive: true })
            .select('name slug logoUrl industry roles description')
            .lean()
        : Promise.resolve([]),
    ]);

    // Derive completed/submitted sets in-memory from projected collections
    const completedAptitudeAttempts = allAptitudeAttempts.filter(
      (a) => a.status === 'submitted' || a.status === 'expired'
    );
    const submittedMockAttempts = allMockAttempts.filter((m) => m.status === 'submitted');

    // 2. Aptitude Metrics
    const aptitudeAttempted = allAptitudeAttempts.length;
    const aptitudeCompleted = completedAptitudeAttempts.length;
    const aptQuestionsAttempted = completedAptitudeAttempts.reduce((sum, a) => sum + (a.totalQuestions || 0), 0);
    const aptCorrectTotal = completedAptitudeAttempts.reduce((sum, a) => sum + (a.correctAnswers || 0), 0);
    const aptAvgScore = aptitudeCompleted > 0
      ? Math.round(completedAptitudeAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / aptitudeCompleted)
      : 0;

    // 3. Coding Metrics
    const codingAttemptedProblems = new Set(
      allCodingSubmissions.map((s) => s.problem?._id?.toString() || s.problem?.toString())
    ).size;
    const acceptedSubmissions = allCodingSubmissions.filter((s) => s.status === 'accepted');
    const codingSolvedProblems = new Set(
      acceptedSubmissions.map((s) => s.problem?._id?.toString() || s.problem?.toString())
    ).size;

    // 4. Mock Test Metrics
    const mockAttempted = allMockAttempts.length;
    const mockCompleted = submittedMockAttempts.length;
    const mockAvgScore = mockCompleted > 0
      ? Math.round(submittedMockAttempts.reduce((sum, m) => sum + (m.percentage || 0), 0) / mockCompleted)
      : 0;

    // 5. Activity Dates & Consecutive Streak Days
    const activeDatesSet = new Set();
    allAptitudeAttempts.forEach((a) => {
      const d = (a.submittedAt || a.createdAt)?.toISOString()?.split('T')?.[0];
      if (d) activeDatesSet.add(d);
    });
    allCodingSubmissions.forEach((c) => {
      const d = (c.submittedAt || c.createdAt)?.toISOString()?.split('T')?.[0];
      if (d) activeDatesSet.add(d);
    });
    allMockAttempts.forEach((m) => {
      const d = (m.submittedAt || m.createdAt)?.toISOString()?.split('T')?.[0];
      if (d) activeDatesSet.add(d);
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let streakDays = 0;
    let curr = null;

    if (activeDatesSet.has(todayStr)) {
      curr = new Date();
    } else if (activeDatesSet.has(yesterdayStr)) {
      curr = new Date(Date.now() - 86400000);
    }

    if (curr) {
      while (true) {
        const dStr = curr.toISOString().split('T')[0];
        if (activeDatesSet.has(dStr)) {
          streakDays += 1;
          curr = new Date(curr.getTime() - 86400000);
        } else {
          break;
        }
      }
    }

    // 6. Profile Completion Calculation (Transparent, Real Fields)
    const profileFields = [
      { key: 'firstName', label: 'First Name', weight: 10, check: typeof user.firstName === 'string' && user.firstName.trim().length > 0 },
      { key: 'lastName', label: 'Last Name', weight: 10, check: typeof user.lastName === 'string' && user.lastName.trim().length > 0 },
      { key: 'college', label: 'College', weight: 15, check: typeof user.college === 'string' && user.college.trim().length > 0 },
      { key: 'branch', label: 'Branch / Stream', weight: 15, check: typeof user.branch === 'string' && user.branch.trim().length > 0 },
      {
        key: 'graduationYear',
        label: 'Graduation Year',
        weight: 10,
        check: (() => {
          if (user.graduationYear === null || user.graduationYear === undefined || user.graduationYear === '') return false;
          const num = Number(user.graduationYear);
          return !isNaN(num) && Number.isInteger(num) && num >= 2000 && num <= 2100;
        })(),
      },
      { key: 'preparationLevel', label: 'Preparation Level', weight: 15, check: typeof user.preparationLevel === 'string' && user.preparationLevel.trim().length > 0 },
      {
        key: 'targetCompanies',
        label: 'Target Companies',
        weight: 15,
        check: Array.isArray(user.targetCompanies) && user.targetCompanies.some((item) => {
          if (!item) return false;
          if (typeof item === 'string') return item.trim().length > 0;
          if (typeof item === 'object') return Boolean(item._id || (typeof item.name === 'string' && item.name.trim().length > 0));
          return true;
        }),
      },
      {
        key: 'preparationGoals',
        label: 'Preparation Goals',
        weight: 10,
        check: Array.isArray(user.preparationGoals) && user.preparationGoals.some((item) => {
          if (!item) return false;
          if (typeof item === 'string') return item.trim().length > 0;
          return true;
        }),
      },
    ];

    const completedFields = [];
    const missingFields = [];
    let completionPercentage = 0;

    profileFields.forEach((field) => {
      if (field.check) {
        completionPercentage += field.weight;
        completedFields.push({ key: field.key, label: field.label });
      } else {
        missingFields.push({ key: field.key, label: field.label });
      }
    });

    const profileCompletion = {
      percentage: Math.min(100, Math.round(completionPercentage)),
      completedFields,
      missingFields,
    };

    // 7. Continue Where You Left Off (Real Database Records)
    const inProgressMock = allMockAttempts.find((m) => m.status === 'in_progress');
    const inProgressApt = allAptitudeAttempts.find((a) => a.status === 'in_progress');
    const latestUnacceptedCoding = allCodingSubmissions.find((c) => c.status !== 'accepted' && c.status !== 'pending');

    let continueActivity = null;
    if (inProgressMock) {
      continueActivity = {
        type: 'mock_test',
        title: 'Resume Mock Assessment',
        subtitle: inProgressMock.mockTest?.title || 'Timed Placement Exam',
        actionLink: `/mock-tests/session/${inProgressMock._id}`,
        actionText: 'Resume Test',
        progress: `${inProgressMock.totalQuestions || 0} questions`,
        startedAt: inProgressMock.createdAt,
      };
    } else if (inProgressApt) {
      continueActivity = {
        type: 'aptitude',
        title: 'Continue Aptitude Practice',
        subtitle: inProgressApt.topic || inProgressApt.category || 'Quantitative & Logical',
        actionLink: `/aptitude/session/${inProgressApt._id}`,
        actionText: 'Resume Practice',
        progress: `${inProgressApt.totalQuestions || 0} questions`,
        startedAt: inProgressApt.startedAt || inProgressApt.createdAt,
      };
    } else if (latestUnacceptedCoding && latestUnacceptedCoding.problem) {
      continueActivity = {
        type: 'coding',
        title: `Retry Problem: ${latestUnacceptedCoding.problem.title}`,
        subtitle: `Last status: ${latestUnacceptedCoding.status.replace(/_/g, ' ')}`,
        actionLink: `/coding/problem/${latestUnacceptedCoding.problem._id || latestUnacceptedCoding.problem}`,
        actionText: 'Solve Problem',
        progress: `Language: ${latestUnacceptedCoding.language}`,
        startedAt: latestUnacceptedCoding.submittedAt || latestUnacceptedCoding.createdAt,
      };
    }

    // 7.5 Activity Flag (Used by weak areas, recommendation, and readiness)
    const hasActivityData = aptitudeCompleted > 0 || allCodingSubmissions.length > 0 || mockCompleted > 0;

    // 8. Weak Areas Analysis (Derived from Actual Performance)
    const weakItems = [];
    const lowAptitude = completedAptitudeAttempts.filter((a) => (a.percentage || 0) < 60);

    if (lowAptitude.length > 0) {
      const topicStats = {};
      lowAptitude.forEach((a) => {
        const t = a.topic || a.category || 'General Aptitude';
        if (!topicStats[t]) topicStats[t] = { count: 0, totalPct: 0 };
        topicStats[t].count += 1;
        topicStats[t].totalPct += (a.percentage || 0);
      });

      Object.entries(topicStats).slice(0, 2).forEach(([topicName, stats]) => {
        const avg = Math.round(stats.totalPct / stats.count);
        weakItems.push({
          name: topicName,
          type: 'aptitude',
          metric: `Accuracy: ${avg}%`,
          actionText: 'Practice Set',
          actionLink: '/aptitude',
        });
      });
    }

    const unacceptedProblems = allCodingSubmissions.filter((c) => c.status !== 'accepted' && c.problem);
    if (unacceptedProblems.length > 0 && weakItems.length < 3) {
      const probMap = {};
      unacceptedProblems.forEach((c) => {
        const pId = c.problem?._id?.toString() || c.problem?.toString();
        if (!probMap[pId]) {
          probMap[pId] = { title: c.problem?.title || 'Coding Problem', count: 0, id: pId };
        }
        probMap[pId].count += 1;
      });

      const solvedIds = new Set(acceptedSubmissions.map((s) => s.problem?._id?.toString() || s.problem?.toString()));
      Object.values(probMap)
        .filter((p) => !solvedIds.has(p.id))
        .slice(0, 2)
        .forEach((p) => {
          weakItems.push({
            name: p.title,
            type: 'coding',
            metric: `${p.count} Unresolved ${p.count === 1 ? 'Attempt' : 'Attempts'}`,
            actionText: 'Retry Problem',
            actionLink: `/coding/problem/${p.id}`,
          });
        });
    }

    const weakAreas = {
      items: weakItems,
      message: weakItems.length > 0
        ? 'Focus on these areas to raise your overall placement score.'
        : hasActivityData
        ? 'No critical weak areas identified. Good work maintaining solid accuracy!'
        : 'Complete more practice to identify your weak areas.',
    };

    // 9. Today's Recommendation (Deterministic Rule Priority & Adaptive Personalization)
    let recommendation = null;

    if (continueActivity && (continueActivity.type === 'mock_test' || continueActivity.type === 'aptitude')) {
      // Priority 1: Unfinished timed assessment
      recommendation = {
        title: 'Resume In-Progress Assessment',
        description: `You have an unfinished ${continueActivity.type === 'mock_test' ? 'mock test' : 'aptitude set'}. Complete it to finalize your accuracy score.`,
        actionText: continueActivity.actionText,
        actionLink: continueActivity.actionLink,
        reason: 'unfinished_assessment',
        priority: 1,
      };
    } else if (aptitudeCompleted > 0 && aptAvgScore < 60) {
      // Priority 2a: Weak aptitude performance
      recommendation = {
        title: 'Strengthen Aptitude Foundations',
        description: `Your current aptitude accuracy is ${aptAvgScore}%. Practice core quantitative and logical reasoning sets to reach placement thresholds (65%+).`,
        actionText: 'Practice Aptitude',
        actionLink: '/aptitude',
        reason: 'weak_aptitude',
        priority: 2,
      };
    } else if (codingSolvedProblems === 0) {
      // Priority 2b: Zero coding problems solved
      recommendation = {
        title: 'Start Coding Practice',
        description: 'Technical campus rounds test DSA fundamentals. Solve beginner-friendly problems in arrays and strings.',
        actionText: 'Browse Coding Problems',
        actionLink: '/coding',
        reason: 'zero_coding',
        priority: 2,
      };
    } else if (mockCompleted === 0) {
      // Priority 2c: Zero mock tests taken
      recommendation = {
        title: 'Benchmark with a Mock Test',
        description: 'Take a timed placement assessment to establish your benchmark score and simulate real exam conditions.',
        actionText: 'Take a Mock Test',
        actionLink: '/mock-tests',
        reason: 'zero_mock_tests',
        priority: 2,
      };
    } else if (Array.isArray(user.targetCompanies) && user.targetCompanies.length > 0) {
      // Priority 3: Target company track
      const firstTarget = user.targetCompanies[0];
      const matchedFirst = typeof firstTarget === 'string'
        ? matchedCompanies.find((c) => c.name.trim().toLowerCase() === firstTarget.trim().toLowerCase())
        : null;
      const targetCompanyLink = matchedFirst
        ? `/companies/${encodeURIComponent(matchedFirst.slug || matchedFirst._id.toString())}`
        : '/companies';

      recommendation = {
        title: `Prepare for ${firstTarget}`,
        description: `Explore placement syllabus, past hiring rounds, and tailored questions for ${firstTarget}.`,
        actionText: `View Company Track`,
        actionLink: targetCompanyLink,
        reason: 'target_company',
        priority: 3,
      };
    } else if (profileCompletion.percentage < 70) {
      // Priority 4: Incomplete profile
      recommendation = {
        title: 'Complete Your Profile',
        description: 'Add your target companies and placement goals to unlock tailored company tracks.',
        actionText: 'Complete Profile',
        actionLink: '/profile',
        reason: 'incomplete_profile',
        priority: 4,
      };
    } else {
      // Priority 5: Adaptive Next Action by Preparation Level & Weak Performance
      const prepLevel = (user.preparationLevel || '').trim().toLowerCase();

      // Check if user has real weak areas identified from attempts
      const hasWeakAptitude = lowAptitude.length > 0;
      const hasUnresolvedCoding = unacceptedProblems.length > 0;

      if (prepLevel === 'just starting') {
        recommendation = {
          title: 'Build Quantitative & Logical Foundations',
          description: 'Start with fundamental aptitude topics and beginner problem sets to build placement core competency.',
          actionText: 'Start Foundations',
          actionLink: '/aptitude',
          reason: 'level_foundation',
          priority: 5,
        };
      } else if (prepLevel === 'placement ready') {
        if (publishedMockTests.length > 0) {
          recommendation = {
            title: 'Full-Length Placement Exam Simulation',
            description: 'Simulate high-stakes campus recruitment conditions with timed multi-section assessments.',
            actionText: 'Take Placement Mock',
            actionLink: '/mock-tests',
            reason: 'placement_ready_mock',
            priority: 5,
          };
        } else if (Array.isArray(user.targetCompanies) && user.targetCompanies.length > 0) {
          const firstTarget = user.targetCompanies[0];
          const matchedFirst = typeof firstTarget === 'string'
            ? matchedCompanies.find((c) => c.name.trim().toLowerCase() === firstTarget.trim().toLowerCase())
            : null;
          const targetCompanyLink = matchedFirst
            ? `/companies/${encodeURIComponent(matchedFirst.slug || matchedFirst._id.toString())}`
            : '/companies';

          recommendation = {
            title: `Company-Specific Interview Prep`,
            description: `Review advanced technical questions and placement pattern archives for ${firstTarget}.`,
            actionText: 'View Company Track',
            actionLink: targetCompanyLink,
            reason: 'placement_ready_company',
            priority: 5,
          };
        } else {
          recommendation = {
            title: 'Advanced Technical & Speed Practice',
            description: 'Refine solution optimality, time complexity, and speed under strict exam constraints.',
            actionText: 'Practice Technical Problems',
            actionLink: '/coding',
            reason: 'placement_ready_advanced',
            priority: 5,
          };
        }
      } else if (prepLevel === 'intermediate' || prepLevel === 'beginner' || prepLevel === 'advanced') {
        if (hasWeakAptitude) {
          const firstWeakApt = lowAptitude[0];
          const weakTopic = firstWeakApt.topic || firstWeakApt.category || 'Quantitative Aptitude';
          recommendation = {
            title: `Improve Accuracy: ${weakTopic}`,
            description: `Target your recent performance gap in ${weakTopic} to push your aptitude score past campus cutoff thresholds.`,
            actionText: 'Practice Topic',
            actionLink: '/aptitude',
            reason: 'weak_topic_targeted',
            priority: 5,
          };
        } else if (hasUnresolvedCoding) {
          const firstUnresolved = unacceptedProblems[0];
          const probTitle = firstUnresolved.problem?.title || 'Unresolved Challenge';
          const probId = firstUnresolved.problem?._id?.toString() || firstUnresolved.problem?.toString();
          recommendation = {
            title: `Master Problem: ${probTitle}`,
            description: `Revisit and resolve your pending submission to strengthen technical interview pattern mastery.`,
            actionText: 'Retry Problem',
            actionLink: probId ? `/coding/problem/${probId}` : '/coding',
            reason: 'unresolved_coding_targeted',
            priority: 5,
          };
        } else if (prepLevel === 'advanced') {
          recommendation = {
            title: 'Target Advanced Technical Problems',
            description: 'Focus on medium and hard algorithmic patterns, system design, and technical interview questions.',
            actionText: 'Solve Advanced Coding',
            actionLink: '/coding',
            reason: 'advanced_technical',
            priority: 5,
          };
        } else {
          recommendation = {
            title: 'Progressive Aptitude & Coding Practice',
            description: 'Maintain your preparation streak with balanced practice across quantitative sets and coding challenges.',
            actionText: 'Start Practicing',
            actionLink: '/aptitude',
            reason: 'progressive_practice',
            priority: 5,
          };
        }
      } else {
        // Safe deterministic default for missing, empty, or unknown preparation level
        recommendation = {
          title: 'Daily Placement Practice',
          description: 'Maintain your preparation streak with 10 quantitative aptitude questions or a targeted DSA challenge today.',
          actionText: 'Start Practicing',
          actionLink: '/aptitude',
          reason: 'daily_consistency',
          priority: 5,
        };
      }
    }

    // 10. Placement Readiness (Transparent Real Formula — Never Fabricated)
    let readiness = null;

    if (!hasActivityData) {
      readiness = {
        score: null,
        status: 'insufficient_data',
        message: 'Complete more practice activities to calculate your placement readiness.',
        breakdown: null,
      };
    } else {
      const profileScore = Math.round(profileCompletion.percentage * 0.15); // max 15
      const aptitudeScore = aptitudeCompleted > 0
        ? Math.round((Math.min(100, aptAvgScore) / 100) * 30 * Math.min(1, aptitudeCompleted / 3))
        : 0; // max 30
      const codingScore = codingSolvedProblems > 0
        ? Math.round(Math.min(30, (codingSolvedProblems / 10) * 30))
        : 0; // max 30
      const mockTestScore = mockCompleted > 0
        ? Math.round((Math.min(100, mockAvgScore) / 100) * 25 * Math.min(1, mockCompleted / 2))
        : 0; // max 25

      const calculatedScore = Math.min(100, profileScore + aptitudeScore + codingScore + mockTestScore);
      const readinessStatus = calculatedScore >= 75
        ? 'placement_ready'
        : calculatedScore >= 50
        ? 'progressing'
        : 'building_foundations';

      const readinessMessage = calculatedScore >= 75
        ? 'Strong placement readiness across aptitude, coding, and mock assessments.'
        : calculatedScore >= 50
        ? 'Good progress. Target weak areas and take full-length mock tests to reach the top tier.'
        : 'Foundational preparation stage. Complete more aptitude sets and coding challenges.';

      readiness = {
        score: calculatedScore,
        status: readinessStatus,
        message: readinessMessage,
        breakdown: {
          profileScore,
          aptitudeScore,
          codingScore,
          mockTestScore,
        },
      };
    }

    // 11. Target Companies with Real MongoDB Metadata
    const targetCompanies = (user.targetCompanies || []).map((targetName) => {
      const trimmedTarget = typeof targetName === 'string' ? targetName.trim().toLowerCase() : '';
      const found = matchedCompanies.find((c) => c.name.trim().toLowerCase() === trimmedTarget);
      if (found) {
        const directLink = `/companies/${encodeURIComponent(found.slug || found._id.toString())}`;
        return {
          id: found._id,
          name: found.name,
          slug: found.slug,
          logoUrl: found.logoUrl || '',
          industry: found.industry || 'Technology',
          roles: found.roles || [],
          hasTrack: true,
          link: directLink,
        };
      }
      return {
        id: null,
        name: targetName,
        slug: targetName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        logoUrl: '',
        industry: 'Technology',
        roles: [],
        hasTrack: false,
        link: '/companies',
      };
    });

    // 12. Build Unified Chronological Recent Activity Feed
    const activityFeed = [];

    allAptitudeAttempts.slice(0, 5).forEach((a) => {
      const isCompleted = a.status === 'submitted' || a.status === 'expired';
      activityFeed.push({
        id: a._id,
        type: 'aptitude',
        title: isCompleted ? 'Aptitude Practice Completed' : 'Aptitude Practice In Progress',
        subtitle: `${a.topic || a.category || 'General'} • Score: ${a.percentage || 0}% (${a.correctAnswers || 0}/${a.totalQuestions || 0})`,
        timestamp: a.submittedAt || a.createdAt,
        status: a.status,
      });
    });

    allCodingSubmissions.slice(0, 5).forEach((c) => {
      activityFeed.push({
        id: c._id,
        type: 'coding',
        title: `Coding Submission: ${c.problem?.title || 'Problem'}`,
        subtitle: `Language: ${c.language} • Status: ${c.status.replace(/_/g, ' ')}`,
        timestamp: c.submittedAt || c.createdAt,
        status: c.status,
      });
    });

    allMockAttempts.slice(0, 5).forEach((m) => {
      const isCompleted = m.status === 'submitted';
      const isExpired = m.status === 'expired';
      const actionText = isCompleted
        ? 'Mock Assessment Completed'
        : isExpired
        ? 'Mock Assessment Expired'
        : 'Mock Assessment In Progress';

      activityFeed.push({
        id: m._id,
        type: 'mock_test',
        title: actionText,
        subtitle: m.status === 'in_progress'
          ? 'Timed assessment currently in progress'
          : `Score: ${m.percentage || 0}% (${m.correctAnswers || 0}/${m.totalQuestions || 0})`,
        timestamp: m.submittedAt || m.createdAt,
        status: m.status,
      });
    });

    activityFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 13. Assemble Final Summary Payload
    const summaryData = {
      profile: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        college: user.college || '',
        branch: user.branch || '',
        graduationYear: user.graduationYear || null,
        preparationLevel: user.preparationLevel || '',
        onboardingCompleted: Boolean(user.onboardingCompleted),
        role: user.role,
        profilePhoto: user.profilePhoto || '',
        createdAt: user.createdAt,
      },
      profileCompletion,
      preparation: {
        aptitude: {
          attempted: aptitudeAttempted,
          completed: aptitudeCompleted,
          questionsAttempted: aptQuestionsAttempted,
          correctTotal: aptCorrectTotal,
          averagePercentage: aptAvgScore,
        },
        coding: {
          attempted: codingAttemptedProblems,
          solved: codingSolvedProblems,
          totalSubmissions: allCodingSubmissions.length,
        },
        mockTests: {
          attempted: mockAttempted,
          completed: mockCompleted,
          averagePercentage: mockAvgScore,
        },
      },
      continueActivity,
      recommendation,
      readiness,
      weakAreas,
      targetCompanies,
      streakDays,
      recentActivity: activityFeed.slice(0, 5),
      upcomingTests: publishedMockTests.map((t) => ({
        id: t._id,
        title: t.title,
        durationMinutes: t.durationMinutes,
        totalQuestions: t.totalQuestions,
        category: t.categories?.[0] || 'Aptitude',
        difficulty: t.difficulty,
      })),
      preparationGoals: user.preparationGoals || [],
    };

    res.status(200).json({
      success: true,
      data: summaryData,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getDashboardSummary,
};
