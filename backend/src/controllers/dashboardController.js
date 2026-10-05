import AptitudeAttempt from '../models/AptitudeAttempt.js';
import CodingSubmission from '../models/CodingSubmission.js';
import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';

/**
 * GET /api/dashboard/summary
 * Returns real student dashboard summary data aggregated from MongoDB.
 * Zero fabricated/fake metrics. Synchronized with /api/progress/summary.
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    const user = req.user;
    const userId = user._id;

    const [
      allAptitudeAttempts,
      completedAptitudeAttempts,
      allCodingSubmissions,
      allMockAttempts,
      submittedMockAttempts,
      publishedMockTests,
    ] = await Promise.all([
      AptitudeAttempt.find({ user: userId }).sort({ createdAt: -1 }).lean(),
      AptitudeAttempt.find({ user: userId, status: { $in: ['submitted', 'expired'] } })
        .sort({ createdAt: -1 })
        .lean(),
      CodingSubmission.find({ user: userId })
        .populate('problem', 'title')
        .sort({ submittedAt: -1 })
        .lean(),
      MockTestAttempt.find({ user: userId })
        .populate('mockTest', 'title totalQuestions')
        .sort({ createdAt: -1 })
        .lean(),
      MockTestAttempt.find({ user: userId, status: 'submitted' }).lean(),
      MockTest.find({ isPublished: true })
        .select('title durationMinutes totalQuestions categories difficulty')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
    ]);

    // 1. Aptitude Metrics
    const aptitudeAttempted = allAptitudeAttempts.length;
    const aptitudeCompleted = completedAptitudeAttempts.length;
    const aptQuestionsAttempted = completedAptitudeAttempts.reduce((sum, a) => sum + (a.totalQuestions || 0), 0);
    const aptCorrectTotal = completedAptitudeAttempts.reduce((sum, a) => sum + (a.correctAnswers || 0), 0);
    const aptAvgScore = aptitudeCompleted > 0
      ? Math.round(completedAptitudeAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / aptitudeCompleted)
      : 0;

    // 2. Coding Metrics
    const codingAttemptedProblems = new Set(
      allCodingSubmissions.map((s) => s.problem?._id?.toString() || s.problem?.toString())
    ).size;
    const acceptedSubmissions = allCodingSubmissions.filter((s) => s.status === 'accepted');
    const codingSolvedProblems = new Set(
      acceptedSubmissions.map((s) => s.problem?._id?.toString() || s.problem?.toString())
    ).size;

    // 3. Mock Test Metrics
    const mockAttempted = allMockAttempts.length;
    const mockCompleted = submittedMockAttempts.length;

    // 4. Consecutive Active Day Streak
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

    // 5. Build unified chronological recent activity feed
    const activityFeed = [];

    allAptitudeAttempts.slice(0, 5).forEach((a) => {
      const isCompleted = a.status === 'submitted' || a.status === 'expired';
      activityFeed.push({
        id: a._id,
        type: 'aptitude',
        title: isCompleted ? `Aptitude Practice Completed` : `Aptitude Practice In Progress`,
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
      const actionText = isCompleted ? 'Mock Assessment Completed' : isExpired ? 'Mock Assessment Expired' : 'Mock Assessment In Progress';

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

    const summaryData = {
      profile: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        college: user.college || '',
        branch: user.branch || '',
        graduationYear: user.graduationYear || null,
        role: user.role,
        profilePhoto: user.profilePhoto || '',
        createdAt: user.createdAt,
      },
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
        },
      },
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
      targetCompanies: user.targetCompanies || [],
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
