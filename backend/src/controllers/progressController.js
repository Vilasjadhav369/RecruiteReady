import AptitudeAttempt from '../models/AptitudeAttempt.js';
import CodingSubmission from '../models/CodingSubmission.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import Company from '../models/Company.js';
import Bookmark from '../models/Bookmark.js';
import User from '../models/User.js';

/**
 * Deterministic Placement Readiness Formula:
 * Components:
 *  - Aptitude: max 25 pts (accuracy scaled by volume up to 5 sessions)
 *  - Coding: max 30 pts (problems solved up to 10 + acceptance rate)
 *  - Mock Tests: max 25 pts (average score + volume up to 3 tests)
 *  - Consistency: max 10 pts (active days up to 7 + streak up to 5)
 *  - Profile: max 10 pts (onboarding & academic completeness)
 * Total: 0–100 bounded
 *
 * NOTE: Placement Readiness is an internal preparation indicator,
 * NOT a job prediction or guarantee of placement.
 */
function calculatePlacementReadiness({
  aptCompleted,
  aptAvgScore,
  codingSolved,
  codingRate,
  mockCompleted,
  mockAvgScore,
  prepDays,
  currentStreak,
  profileCompletionPct,
}) {
  const totalActivities = aptCompleted + codingSolved + mockCompleted;
  if (totalActivities === 0) {
    return {
      isEligible: false,
      score: null,
      level: 'Not Enough Data',
      message:
        'Complete at least 1 practice session, coding problem, or mock test to calculate your Placement Readiness score.',
      disclaimer:
        'An estimate based on your RecruiteReady preparation activity and performance. This is an internal progress indicator and does not guarantee job placement.',
      breakdown: {
        aptitude: { score: 0, max: 25, label: 'Aptitude Practice' },
        coding: { score: 0, max: 30, label: 'Coding Practice' },
        mockTests: { score: 0, max: 25, label: 'Mock Assessments' },
        consistency: { score: 0, max: 10, label: 'Consistency' },
        profile: { score: Math.round((profileCompletionPct / 100) * 10), max: 10, label: 'Profile Completeness' },
      },
      requirementsNeeded: [
        'Complete at least 1 aptitude session',
        'Submit at least 1 coding problem',
        'Complete at least 1 mock test',
      ],
    };
  }

  // 1. Aptitude (max 25)
  const aptAccuracyFactor = aptCompleted > 0 && aptAvgScore !== null ? Math.min(100, Math.max(0, aptAvgScore)) / 100 : 0;
  const aptVolumeFactor = Math.min(1, aptCompleted / 5);
  const aptScore = Math.min(25, Math.round(aptAccuracyFactor * 20 + aptVolumeFactor * 5));

  // 2. Coding (max 30)
  const codingSolvedScore = Math.min(20, Math.round((codingSolved / 10) * 20));
  const codingRateFactor = codingRate !== null ? (Math.min(100, Math.max(0, codingRate)) / 100) * 10 : 0;
  const codingScore = Math.min(30, Math.round(codingSolvedScore + codingRateFactor));

  // 3. Mock Tests (max 25)
  const mockAvgFactor = mockCompleted > 0 && mockAvgScore !== null ? Math.min(100, Math.max(0, mockAvgScore)) / 100 : 0;
  const mockVolumeFactor = Math.min(1, mockCompleted / 3);
  const mockScore = Math.min(25, Math.round(mockAvgFactor * 20 + mockVolumeFactor * 5));

  // 4. Consistency (max 10)
  const prepDaysScore = Math.min(6, Math.round((prepDays / 7) * 6));
  const streakScore = Math.min(4, Math.round((currentStreak / 5) * 4));
  const consistencyScore = Math.min(10, prepDaysScore + streakScore);

  // 5. Profile & Goals (max 10)
  const profileScore = Math.min(10, Math.round((Math.min(100, profileCompletionPct) / 100) * 10));

  const rawTotal = aptScore + codingScore + mockScore + consistencyScore + profileScore;
  const finalScore = Math.min(100, Math.max(0, rawTotal));

  let level = 'Getting Started';
  let message = 'Foundational preparation stage. Practice core aptitude sets and solve beginner coding challenges.';

  if (finalScore >= 90) {
    level = 'Placement Ready';
    message = 'Exceptional placement readiness across all evaluation dimensions.';
  } else if (finalScore >= 75) {
    level = 'Strong Preparation';
    message = 'Comprehensive placement preparation. Consistently performing across aptitude, coding, and mock assessments.';
  } else if (finalScore >= 60) {
    level = 'Developing';
    message = 'Good progress across core topics. Target weak areas and take timed mock assessments.';
  } else if (finalScore >= 40) {
    level = 'Building Foundation';
    message = 'Steady preparation base. Focus on moderate coding challenges and regular assessment practice.';
  }

  return {
    isEligible: true,
    score: finalScore,
    level,
    message,
    disclaimer:
      'An estimate based on your RecruiteReady preparation activity and performance. This is an internal progress indicator and does not guarantee job placement.',
    breakdown: {
      aptitude: { score: aptScore, max: 25, label: 'Aptitude Practice' },
      coding: { score: codingScore, max: 30, label: 'Coding Practice' },
      mockTests: { score: mockScore, max: 25, label: 'Mock Assessments' },
      consistency: { score: consistencyScore, max: 10, label: 'Consistency' },
      profile: { score: profileScore, max: 10, label: 'Profile Completeness' },
    },
    requirementsNeeded: [],
  };
}

/**
 * GET /api/progress/summary
 * Production-quality Advanced Progress & Analytics Engine.
 * 100% real database records, zero manufactured metrics.
 */
export const getProgressSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch user profile and all domain records in parallel with strict projections
    const [
      user,
      allAptitudeAttempts,
      allCodingSubmissions,
      allMockAttempts,
      userBookmarks,
    ] = await Promise.all([
      User.findById(userId)
        .select('firstName lastName college branch graduationYear preparationLevel targetCompanies preparationGoals')
        .lean(),
      AptitudeAttempt.find({ user: userId })
        .select('category topic difficulty score percentage correctAnswers wrongAnswers unanswered totalQuestions status submittedAt createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      CodingSubmission.find({ user: userId })
        .populate('problem', 'title difficulty topics category')
        .select('problem status language submittedAt createdAt')
        .sort({ submittedAt: -1 })
        .lean(),
      MockTestAttempt.find({ user: userId })
        .populate('mockTest', 'title totalQuestions durationMinutes categories difficulty')
        .select('mockTest score percentage correctAnswers wrongAnswers totalQuestions status submittedAt createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      Bookmark.find({ user: userId, itemType: 'company' }).select('itemId').lean(),
    ]);

    // Derive completed / submitted sets in-memory (chronological ascending order by createdAt)
    const completedAptitudeAttempts = allAptitudeAttempts
      .filter((a) => a.status === 'submitted' || a.status === 'expired')
      .slice()
      .reverse();

    const submittedMockAttempts = allMockAttempts
      .filter((m) => m.status === 'submitted')
      .slice()
      .reverse();

    const profileFields = [
      { key: 'firstName', weight: 10, check: typeof user?.firstName === 'string' && user.firstName.trim().length > 0 },
      { key: 'lastName', weight: 10, check: typeof user?.lastName === 'string' && user.lastName.trim().length > 0 },
      { key: 'college', weight: 15, check: typeof user?.college === 'string' && user.college.trim().length > 0 },
      { key: 'branch', weight: 15, check: typeof user?.branch === 'string' && user.branch.trim().length > 0 },
      {
        key: 'graduationYear',
        weight: 10,
        check: (() => {
          if (user?.graduationYear === null || user?.graduationYear === undefined || user?.graduationYear === '') return false;
          const num = Number(user.graduationYear);
          return !isNaN(num) && Number.isInteger(num) && num >= 2000 && num <= 2100;
        })(),
      },
      { key: 'preparationLevel', weight: 15, check: typeof user?.preparationLevel === 'string' && user.preparationLevel.trim().length > 0 },
      {
        key: 'targetCompanies',
        weight: 15,
        check: Array.isArray(user?.targetCompanies) && user.targetCompanies.some((item) => {
          if (!item) return false;
          if (typeof item === 'string') return item.trim().length > 0;
          if (typeof item === 'object') return Boolean(item._id || (typeof item.name === 'string' && item.name.trim().length > 0));
          return true;
        }),
      },
      {
        key: 'preparationGoals',
        weight: 10,
        check: Array.isArray(user?.preparationGoals) && user.preparationGoals.some((item) => {
          if (!item) return false;
          if (typeof item === 'string') return item.trim().length > 0;
          return true;
        }),
      },
    ];
    let profileCompletionPct = 0;
    profileFields.forEach((field) => {
      if (field.check) {
        profileCompletionPct += field.weight;
      }
    });
    profileCompletionPct = Math.min(100, Math.round(profileCompletionPct));

    // ==========================================
    // 1. APTITUDE ANALYTICS
    // ==========================================
    const getAptCorrect = (a) => {
      if (typeof a.correctAnswers === 'number' && a.correctAnswers > 0) return a.correctAnswers;
      if (typeof a.score === 'number' && a.score > 0) return a.score;
      return typeof a.correctAnswers === 'number' ? a.correctAnswers : (a.score || 0);
    };
    const getAptWrong = (a) => {
      if (typeof a.wrongAnswers === 'number' && a.wrongAnswers > 0) return a.wrongAnswers;
      return Math.max(0, (a.totalQuestions || 0) - getAptCorrect(a) - (a.unanswered || 0));
    };

    const aptTotalAttempts = allAptitudeAttempts.length;
    const aptCompletedSessions = completedAptitudeAttempts.length;
    const aptQuestionsAttempted = completedAptitudeAttempts.reduce(
      (sum, a) => sum + (a.totalQuestions || 0),
      0
    );
    const aptCorrectTotal = completedAptitudeAttempts.reduce(
      (sum, a) => sum + getAptCorrect(a),
      0
    );
    const aptWrongTotal = completedAptitudeAttempts.reduce(
      (sum, a) => sum + getAptWrong(a),
      0
    );
    const aptUnansweredTotal = completedAptitudeAttempts.reduce(
      (sum, a) => sum + (a.unanswered || 0),
      0
    );
    const aptAccuracy =
      aptQuestionsAttempted > 0
        ? Math.round((aptCorrectTotal / aptQuestionsAttempted) * 100)
        : null;
    const aptAvgScore =
      aptCompletedSessions > 0
        ? Math.round(
            completedAptitudeAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) /
              aptCompletedSessions
          )
        : null;
    const aptBestScore =
      aptCompletedSessions > 0
        ? Math.max(...completedAptitudeAttempts.map((a) => a.percentage || 0))
        : null;

    // Aptitude by Category (ONLY categories actually present in database)
    const categoryMap = new Map();
    completedAptitudeAttempts.forEach((att) => {
      const cat = att.category || 'General Aptitude';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { sessions: 0, total: 0, correct: 0, sumPct: 0 });
      }
      const st = categoryMap.get(cat);
      st.sessions += 1;
      st.total += att.totalQuestions || 0;
      st.correct += getAptCorrect(att);
      st.sumPct += att.percentage || 0;
    });

    const aptByCategory = [];
    categoryMap.forEach((val, cat) => {
      aptByCategory.push({
        category: cat,
        sessions: val.sessions,
        questionsAttempted: val.total,
        correct: val.correct,
        accuracy: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
        averagePercentage: val.sessions > 0 ? Math.round(val.sumPct / val.sessions) : 0,
      });
    });

    // Aptitude by Topic
    const aptTopicMap = new Map();
    completedAptitudeAttempts.forEach((att) => {
      const topic = att.topic || att.category || 'General Aptitude';
      if (!aptTopicMap.has(topic)) {
        aptTopicMap.set(topic, {
          category: att.category || 'General Aptitude',
          sessions: 0,
          total: 0,
          correct: 0,
        });
      }
      const st = aptTopicMap.get(topic);
      st.sessions += 1;
      st.total += att.totalQuestions || 0;
      st.correct += getAptCorrect(att);
    });

    const aptByTopic = [];
    aptTopicMap.forEach((val, topic) => {
      aptByTopic.push({
        topic,
        category: val.category,
        sessions: val.sessions,
        questionsAttempted: val.total,
        correct: val.correct,
        accuracy: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
      });
    });

    // Aptitude by Difficulty
    const aptDiffMap = new Map();
    completedAptitudeAttempts.forEach((att) => {
      const diff = att.difficulty || 'medium';
      if (!aptDiffMap.has(diff)) {
        aptDiffMap.set(diff, { sessions: 0, total: 0, correct: 0 });
      }
      const st = aptDiffMap.get(diff);
      st.sessions += 1;
      st.total += att.totalQuestions || 0;
      st.correct += att.correctAnswers || 0;
    });

    const aptByDifficulty = ['easy', 'medium', 'hard'].map((d) => {
      const val = aptDiffMap.get(d) || { sessions: 0, total: 0, correct: 0 };
      return {
        difficulty: d,
        sessions: val.sessions,
        questionsAttempted: val.total,
        correct: val.correct,
        accuracy: val.total > 0 ? Math.round((val.correct / val.total) * 100) : null,
      };
    });

    // Aptitude Recent Sessions (last 5)
    const aptRecent = completedAptitudeAttempts
      .slice(-5)
      .reverse()
      .map((a) => ({
        id: a._id,
        category: a.category || 'General',
        topic: a.topic || 'Practice',
        difficulty: a.difficulty || 'medium',
        score: a.score || 0,
        percentage: a.percentage || 0,
        correctAnswers: a.correctAnswers || 0,
        totalQuestions: a.totalQuestions || 0,
        date: a.submittedAt || a.createdAt,
      }));

    // Aptitude Timeline Trend
    const aptTrend = completedAptitudeAttempts.map((a) => ({
      date: a.submittedAt || a.createdAt,
      label: `${a.category || 'Aptitude'} (${a.topic || 'Practice'})`,
      percentage: a.percentage || 0,
    }));

    // ==========================================
    // 2. CODING ANALYTICS
    // ==========================================
    const codingTotalSubmissions = allCodingSubmissions.length;
    const attemptedProblemIds = new Set();
    const solvedProblemIds = new Set();

    allCodingSubmissions.forEach((s) => {
      const pid = s.problem?._id?.toString() || s.problem?.toString();
      if (pid) attemptedProblemIds.add(pid);
      if (s.status === 'accepted' && pid) solvedProblemIds.add(pid);
    });

    const uniqueCodingAttempted = attemptedProblemIds.size;
    const uniqueCodingSolved = solvedProblemIds.size;
    const acceptedSubmissions = allCodingSubmissions.filter((s) => s.status === 'accepted');
    const failedSubmissions = codingTotalSubmissions - acceptedSubmissions.length;
    const codingSuccessRate = codingTotalSubmissions > 0
      ? Math.round((acceptedSubmissions.length / codingTotalSubmissions) * 100)
      : null;

    // Coding Difficulty Distribution (Easy, Medium, Hard)
    const diffStats = {
      easy: { attempted: new Set(), solved: new Set(), total: 0, accepted: 0 },
      medium: { attempted: new Set(), solved: new Set(), total: 0, accepted: 0 },
      hard: { attempted: new Set(), solved: new Set(), total: 0, accepted: 0 },
    };

    allCodingSubmissions.forEach((s) => {
      const diff = (s.problem?.difficulty || 'medium').toLowerCase();
      const pid = s.problem?._id?.toString() || s.problem?.toString();
      if (diffStats[diff]) {
        diffStats[diff].total += 1;
        if (pid) diffStats[diff].attempted.add(pid);
        if (s.status === 'accepted') {
          diffStats[diff].accepted += 1;
          if (pid) diffStats[diff].solved.add(pid);
        }
      }
    });

    const codingDifficultyDistribution = ['easy', 'medium', 'hard'].map((d) => ({
      difficulty: d,
      problemsAttempted: diffStats[d].attempted.size,
      problemsSolved: diffStats[d].solved.size,
      totalSubmissions: diffStats[d].total,
      acceptedSubmissions: diffStats[d].accepted,
      successRate: diffStats[d].total > 0
        ? Math.round((diffStats[d].accepted / diffStats[d].total) * 100)
        : null,
    }));

    // Coding Topic Analytics (ONLY topics stored on problems in DB)
    const codingTopicMap = new Map();
    allCodingSubmissions.forEach((s) => {
      const pid = s.problem?._id?.toString() || s.problem?.toString();
      const pTopics = Array.isArray(s.problem?.topics) && s.problem.topics.length > 0
        ? s.problem.topics
        : s.problem?.category
        ? [s.problem.category]
        : [];

      pTopics.forEach((t) => {
        if (!codingTopicMap.has(t)) {
          codingTopicMap.set(t, {
            attemptedProblems: new Set(),
            solvedProblems: new Set(),
            totalSubmissions: 0,
            acceptedSubmissions: 0,
          });
        }
        const st = codingTopicMap.get(t);
        st.totalSubmissions += 1;
        if (pid) st.attemptedProblems.add(pid);
        if (s.status === 'accepted') {
          st.acceptedSubmissions += 1;
          if (pid) st.solvedProblems.add(pid);
        }
      });
    });

    const codingTopics = [];
    codingTopicMap.forEach((val, topic) => {
      const attempted = val.attemptedProblems.size;
      const solved = val.solvedProblems.size;
      const total = val.totalSubmissions;
      const accepted = val.acceptedSubmissions;
      const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;

      // Status classification threshold: requires min 2 problems or 3 submissions
      let status = 'insufficient_data';
      let statusLabel = 'More practice needed';

      if (total >= 3) {
        if (solved >= 2 && rate >= 70) {
          status = 'strong';
          statusLabel = 'Strong';
        } else if (rate < 50 || (attempted >= 2 && solved === 0)) {
          status = 'needs_improvement';
          statusLabel = 'Needs Improvement';
        } else {
          status = 'developing';
          statusLabel = 'Developing';
        }
      }

      codingTopics.push({
        topic,
        problemsAttempted: attempted,
        problemsSolved: solved,
        totalSubmissions: total,
        acceptedSubmissions: accepted,
        successRate: rate,
        status,
        statusLabel,
      });
    });

    // Language Breakdown
    const languageStats = {};
    allCodingSubmissions.forEach((s) => {
      const l = s.language || 'other';
      languageStats[l] = (languageStats[l] || 0) + 1;
    });

    // Coding Recent Submissions (last 5)
    const codingRecent = allCodingSubmissions.slice(0, 5).map((s) => ({
      id: s._id,
      title: s.problem?.title || 'Coding Problem',
      difficulty: s.problem?.difficulty || 'medium',
      language: s.language,
      status: s.status,
      date: s.submittedAt || s.createdAt,
    }));

    // ==========================================
    // 3. MOCK TEST ANALYTICS
    // ==========================================
    const mockTotalAttempted = allMockAttempts.length;
    const mockCompleted = submittedMockAttempts.length;
    const mockExpired = allMockAttempts.filter((m) => m.status === 'expired').length;
    const mockInProgress = allMockAttempts.filter((m) => m.status === 'in_progress').length;
    const mockAvgScore = mockCompleted > 0
      ? Math.round(
          submittedMockAttempts.reduce((sum, m) => sum + (m.percentage || 0), 0) /
            mockCompleted
        )
      : null;
    const mockBestScore = mockCompleted > 0
      ? Math.max(...submittedMockAttempts.map((m) => m.percentage || 0))
      : null;

    // Mock Tests by Category
    const mockCatMap = new Map();
    submittedMockAttempts.forEach((m) => {
      const cats = m.mockTest?.categories || ['General'];
      cats.forEach((c) => {
        if (!mockCatMap.has(c)) {
          mockCatMap.set(c, { completed: 0, sumPct: 0 });
        }
        const st = mockCatMap.get(c);
        st.completed += 1;
        st.sumPct += m.percentage || 0;
      });
    });

    const mockByCategory = [];
    mockCatMap.forEach((val, category) => {
      mockByCategory.push({
        category,
        testsCompleted: val.completed,
        averagePercentage: val.completed > 0 ? Math.round(val.sumPct / val.completed) : 0,
      });
    });

    // Mock Tests by Difficulty
    const mockDiffMap = new Map();
    submittedMockAttempts.forEach((m) => {
      const diff = m.mockTest?.difficulty || 'medium';
      if (!mockDiffMap.has(diff)) {
        mockDiffMap.set(diff, { completed: 0, sumPct: 0 });
      }
      const st = mockDiffMap.get(diff);
      st.completed += 1;
      st.sumPct += m.percentage || 0;
    });

    const mockByDifficulty = ['easy', 'medium', 'hard'].map((d) => {
      const val = mockDiffMap.get(d) || { completed: 0, sumPct: 0 };
      return {
        difficulty: d,
        testsCompleted: val.completed,
        averagePercentage: val.completed > 0 ? Math.round(val.sumPct / val.completed) : null,
      };
    });

    // Mock Recent (last 5 submitted)
    const mockRecent = submittedMockAttempts
      .slice(-5)
      .reverse()
      .map((m) => ({
        id: m._id,
        title: m.mockTest?.title || 'Mock Assessment',
        difficulty: m.mockTest?.difficulty || 'medium',
        score: m.score || 0,
        percentage: m.percentage || 0,
        correctAnswers: m.correctAnswers || 0,
        totalQuestions: m.totalQuestions || 0,
        date: m.submittedAt || m.createdAt,
      }));

    // ==========================================
    // 4. TOPIC HEATMAP & STRENGTHS/WEAKNESSES
    // ==========================================
    // Combined topics for Heatmap
    const topicHeatmap = [];

    // Aptitude topics into heatmap
    aptByTopic.forEach((at) => {
      let status = 'insufficient_data';
      let statusLabel = 'More practice needed';
      if (at.questionsAttempted >= 3) {
        if (at.accuracy >= 70) {
          status = 'strong';
          statusLabel = 'Strong';
        } else if (at.accuracy < 60) {
          status = 'needs_improvement';
          statusLabel = 'Needs Improvement';
        } else {
          status = 'developing';
          statusLabel = 'Developing';
        }
      }

      topicHeatmap.push({
        topic: at.topic,
        name: at.topic,
        track: 'Aptitude',
        domain: 'Aptitude',
        sampleSize: at.questionsAttempted,
        attempts: at.questionsAttempted,
        correct: at.correct,
        accuracy: at.accuracy,
        status,
        statusLabel,
      });
    });

    // Coding topics into heatmap
    codingTopics.forEach((ct) => {
      topicHeatmap.push({
        topic: ct.topic,
        name: ct.topic,
        track: 'Coding',
        domain: 'Coding',
        sampleSize: ct.totalSubmissions,
        attempts: ct.totalSubmissions,
        correct: ct.acceptedSubmissions,
        accuracy: ct.successRate,
        status: ct.status,
        statusLabel: ct.statusLabel,
      });
    });

    // Identify Strengths (sampleSize >= 3, accuracy >= 70%)
    const strengths = topicHeatmap
      .filter((t) => t.sampleSize >= 3 && t.accuracy >= 70)
      .map((t) => ({
        name: t.topic,
        topic: t.topic,
        track: t.track,
        domain: t.track,
        sampleSize: t.sampleSize,
        attempts: t.sampleSize,
        correct: t.correct,
        accuracy: t.accuracy,
        statusLabel: 'Strong',
        description: `Consistently demonstrated high accuracy (${t.accuracy}%) over ${t.sampleSize} verified evaluations.`,
      }));

    // Identify Weak Areas (sampleSize >= 3, accuracy < 60%)
    const weakAreas = topicHeatmap
      .filter((t) => t.sampleSize >= 3 && t.accuracy < 60)
      .map((t) => ({
        name: t.topic,
        topic: t.topic,
        track: t.track,
        domain: t.track,
        sampleSize: t.sampleSize,
        attempts: t.sampleSize,
        correct: t.correct,
        accuracy: t.accuracy,
        statusLabel: 'Needs Improvement',
        recommendation: `Accuracy is currently at ${t.accuracy}%. Dedicated practice recommended.`,
      }));

    const hasEnoughTopicData = topicHeatmap.some((t) => t.sampleSize >= 3);

    // ==========================================
    // 5. PREPARATION CONSISTENCY & WEEKLY ACTIVITY
    // ==========================================
    // Qualifying activities: completed aptitude, evaluated coding, submitted mock test
    const activeDatesSet = new Set();
    const activityTimestamps = [];

    completedAptitudeAttempts.forEach((a) => {
      const d = (a.submittedAt || a.createdAt);
      if (d) {
        const dStr = new Date(d).toISOString().split('T')[0];
        activeDatesSet.add(dStr);
        activityTimestamps.push(new Date(d));
      }
    });

    allCodingSubmissions.forEach((c) => {
      const d = (c.submittedAt || c.createdAt);
      if (d) {
        const dStr = new Date(d).toISOString().split('T')[0];
        activeDatesSet.add(dStr);
        activityTimestamps.push(new Date(d));
      }
    });

    submittedMockAttempts.forEach((m) => {
      const d = (m.submittedAt || m.createdAt);
      if (d) {
        const dStr = new Date(d).toISOString().split('T')[0];
        activeDatesSet.add(dStr);
        activityTimestamps.push(new Date(d));
      }
    });

    const prepDays = activeDatesSet.size;

    // Current Streak calculation
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let currentStreak = 0;
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
          currentStreak += 1;
          curr = new Date(curr.getTime() - 86400000);
        } else {
          break;
        }
      }
    }

    // Longest Streak calculation
    const sortedDates = Array.from(activeDatesSet).sort();
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    sortedDates.forEach((dStr) => {
      const curDate = new Date(dStr);
      if (!lastDate) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((curDate - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak += 1;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      lastDate = curDate;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    });

    // Weekly Activity: past 7 days breakdown (Mon through Sun)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const target = new Date(Date.now() - i * 86400000);
      const targetStr = target.toISOString().split('T')[0];
      const count = activityTimestamps.filter(
        (ts) => ts.toISOString().split('T')[0] === targetStr
      ).length;
      weeklyActivity.push({
        day: dayNames[target.getDay()],
        dayOfWeek: dayNames[target.getDay()],
        date: targetStr,
        count,
        totalActivities: count,
        isToday: targetStr === todayStr,
        active: count > 0,
      });
    }

    const hasWeeklyActivity = weeklyActivity.some((w) => w.count > 0);

    // ==========================================
    // 6. PLACEMENT READINESS CALCULATION
    // ==========================================
    const readiness = calculatePlacementReadiness({
      aptCompleted: aptCompletedSessions,
      aptAvgScore,
      codingSolved: uniqueCodingSolved,
      codingRate: codingSuccessRate,
      mockCompleted,
      mockAvgScore,
      prepDays,
      currentStreak,
      profileCompletionPct,
    });

    // ==========================================
    // 7. TARGET COMPANY PREPARATION TRACKING
    // ==========================================
    const targetCompanyRefs = Array.isArray(user?.targetCompanies) ? user.targetCompanies : [];
    let targetCompaniesAnalytics = [];

    if (targetCompanyRefs.length > 0) {
      const validObjectIds = targetCompanyRefs
        .map((r) => (r?._id || r)?.toString())
        .filter((id) => /^[0-9a-fA-F]{24}$/.test(id));
      const targetNames = targetCompanyRefs
        .map((r) => (typeof r === 'string' ? r : r?.name))
        .filter(Boolean);

      const matchedCompanies = await Company.find({
        $or: [
          { name: { $in: targetNames } },
          { _id: { $in: validObjectIds } },
        ],
        isActive: true,
      })
        .select('name slug industry roles selectionProcess aptitudeTopics codingTopics resources logoUrl')
        .lean();

      const bookmarkedCompanyIds = new Set(userBookmarks.map((b) => b.itemId.toString()));

      targetCompaniesAnalytics = matchedCompanies.map((found) => {
        const compAptTopics = found.aptitudeTopics || [];
        const compCodingTopics = found.codingTopics || [];

        // Topics prepared count
        const topicsPreparedCount = compAptTopics.filter((t) => aptTopicMap.has(t)).length;
        const codingSolvedCount = compCodingTopics.filter((t) => {
          const st = codingTopicMap.get(t);
          return st && st.solvedProblems.size > 0;
        }).length;

        // Has student attempted aptitude topics relevant to company?
        const aptitudePracticed = compAptTopics.length > 0
          ? topicsPreparedCount > 0
          : aptCompletedSessions > 0;

        // Has student solved coding topics relevant to company?
        const codingPracticed = compCodingTopics.length > 0
          ? codingSolvedCount > 0
          : uniqueCodingSolved > 0;

        const isBookmarked = bookmarkedCompanyIds.has(found._id.toString());

        return {
          id: found._id,
          name: found.name,
          slug: found.slug,
          industry: found.industry || 'Technology',
          roles: found.roles || [],
          selectionProcess: found.selectionProcess || [],
          availableResourcesCount: (found.resources || []).length,
          aptitudeTopics: compAptTopics,
          codingTopics: compCodingTopics,
          hasTrack: true,
          link: `/companies/${found.slug || found._id}`,
          bookmarked: isBookmarked,
          hasBookmarks: isBookmarked,
          topicsPrepared: compAptTopics.length > 0 ? topicsPreparedCount : aptCompletedSessions,
          codingSolved: compCodingTopics.length > 0 ? codingSolvedCount : uniqueCodingSolved,
          mockTestsTaken: mockCompleted,
          checklist: {
            aptitudePracticed,
            codingPracticed,
            mockTestTaken: mockCompleted > 0,
            isBookmarked,
          },
        };
      });
    }

    // ==========================================
    // 8. DETERMINISTIC NEXT RECOMMENDATIONS
    // ==========================================
    const recommendations = [];

    if (mockCompleted === 0) {
      recommendations.push({
        priority: 1,
        title: 'Take your first full-length Mock Assessment',
        description: 'Timed full-length mock tests simulate real campus evaluation patterns and test overall exam strategy.',
        track: 'Mock Tests',
        actionText: 'Take Mock Test',
        actionLink: '/mock-tests',
      });
    }

    if (aptCompletedSessions === 0) {
      recommendations.push({
        priority: 1,
        title: 'Start Aptitude Practice',
        description: 'Practice core Quantitative and Logical Reasoning question banks to unlock aptitude analytics.',
        track: 'Aptitude',
        actionText: 'Practice Aptitude',
        actionLink: '/aptitude',
      });
    } else if (aptAccuracy !== null && aptAccuracy < 60) {
      recommendations.push({
        priority: 2,
        title: 'Strengthen foundational Aptitude accuracy',
        description: `Your overall aptitude accuracy is ${aptAccuracy}%. Focus on high-frequency Quantitative and Logical reasoning sets to reach 70%+ threshold.`,
        track: 'Aptitude',
        actionText: 'Practice Aptitude',
        actionLink: '/aptitude',
      });
    }

    if (uniqueCodingSolved === 0) {
      recommendations.push({
        priority: 2,
        title: 'Begin Coding Practice',
        description: 'Campus placement technical rounds test foundational algorithms. Solve beginner problems in Arrays and Strings.',
        track: 'Coding',
        actionText: 'Solve Coding',
        actionLink: '/coding',
      });
    } else if (codingSuccessRate !== null && codingSuccessRate < 50) {
      recommendations.push({
        priority: 2,
        title: 'Review test case edge cases in Coding',
        description: `Your current coding acceptance rate is ${codingSuccessRate}%. Test your edge cases and boundary inputs before submitting.`,
        track: 'Coding',
        actionText: 'Practice Coding',
        actionLink: '/coding',
      });
    }

    if (weakAreas.length > 0) {
      const topWeak = weakAreas[0];
      recommendations.push({
        priority: 3,
        title: `Dedicate practice to weak area: ${topWeak.name}`,
        description: `${topWeak.name} accuracy is currently at ${topWeak.accuracy}%. Focused problem sets will improve this domain.`,
        track: topWeak.track,
        actionText: topWeak.track === 'Coding' ? 'Solve Problems' : 'Practice Set',
        actionLink: topWeak.track === 'Coding' ? '/coding' : '/aptitude',
      });
    }

    if (currentStreak === 0 && (aptCompletedSessions > 0 || uniqueCodingSolved > 0)) {
      recommendations.push({
        priority: 4,
        title: 'Resume daily preparation consistency',
        description: 'Complete at least one practice set or coding challenge today to build your active streak.',
        track: 'Consistency',
        actionText: 'Practice Today',
        actionLink: '/dashboard',
      });
    }

    if (profileCompletionPct < 100) {
      recommendations.push({
        priority: 5,
        title: 'Complete your profile details',
        description: 'Specify your college, branch, graduation year, and target companies for personalized placement tracking.',
        track: 'Profile',
        actionText: 'Complete Profile',
        actionLink: '/profile',
      });
    }

    // Sort by priority and cap to top 4 recommendations
    recommendations.sort((a, b) => a.priority - b.priority);
    const finalRecommendations = recommendations.slice(0, 4).map((r, idx) => ({
      id: r.id || `rec-${idx + 1}`,
      priority: r.priority,
      title: r.title,
      description: r.description,
      track: r.track,
      domain: r.track,
      actionText: r.actionText,
      actionLabel: r.actionText,
      actionLink: r.actionLink,
      actionUrl: r.actionLink,
    }));

    // ==========================================
    // 9. UNIFIED RECENT ACTIVITY FEED
    // ==========================================
    const recentActivity = [];

    allAptitudeAttempts.slice(0, 6).forEach((a) => {
      const isCompleted = a.status === 'submitted' || a.status === 'expired';
      recentActivity.push({
        id: a._id,
        type: 'aptitude',
        title: isCompleted ? 'Aptitude Practice Completed' : 'Aptitude Practice In Progress',
        subtitle: `${a.topic || a.category || 'General'} • Score: ${a.percentage || 0}% (${a.correctAnswers || 0}/${a.totalQuestions || 0})`,
        timestamp: a.submittedAt || a.createdAt,
        status: a.status,
      });
    });

    allCodingSubmissions.slice(0, 6).forEach((c) => {
      recentActivity.push({
        id: c._id,
        type: 'coding',
        title: `Coding Submission: ${c.problem?.title || 'Problem'}`,
        subtitle: `Language: ${c.language} • Status: ${c.status.replace(/_/g, ' ')}`,
        timestamp: c.submittedAt || c.createdAt,
        status: c.status,
      });
    });

    allMockAttempts.slice(0, 6).forEach((m) => {
      const isCompleted = m.status === 'submitted';
      const isExpired = m.status === 'expired';
      const actionText = isCompleted
        ? 'Mock Assessment Completed'
        : isExpired
        ? 'Mock Assessment Expired'
        : 'Mock Assessment In Progress';
      recentActivity.push({
        id: m._id,
        type: 'mock_test',
        title: actionText,
        subtitle: m.status === 'in_progress'
          ? 'Timed assessment in progress'
          : `Score: ${m.percentage || 0}% (${m.correctAnswers || 0}/${m.totalQuestions || 0})`,
        timestamp: m.submittedAt || m.createdAt,
        status: m.status,
      });
    });

    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Chronological Evaluation Timeline (Aptitude & Mock Tests)
    const scoreTrend = [];
    completedAptitudeAttempts.forEach((a) => {
      scoreTrend.push({
        date: a.submittedAt || a.createdAt,
        type: 'Aptitude',
        label: `${a.category || 'Aptitude'} (${a.topic || 'Practice'})`,
        percentage: a.percentage || 0,
      });
    });
    submittedMockAttempts.forEach((m) => {
      scoreTrend.push({
        date: m.submittedAt || m.createdAt,
        type: 'Mock Test',
        label: m.mockTest?.title || 'Mock Test',
        percentage: m.percentage || 0,
      });
    });
    scoreTrend.sort((a, b) => new Date(a.date) - new Date(b.date));

    // ==========================================
    // 10. OVERVIEW KPI METRICS
    // ==========================================
    const overview = {
      totalAptitudeAttempts: aptTotalAttempts,
      completedAptitudeAttempts: aptCompletedSessions,
      totalQuestionsAttempted: aptQuestionsAttempted,
      totalCorrectAnswers: aptCorrectTotal,
      overallAptitudeAccuracy: aptAccuracy,
      aptitudeAccuracy: aptAccuracy,
      totalCodingSubmissions: codingTotalSubmissions,
      uniqueCodingAttempted,
      problemsAttempted: uniqueCodingAttempted,
      uniqueCodingSolved,
      problemsSolved: uniqueCodingSolved,
      codingSuccessRate,
      totalMockTests: mockTotalAttempted,
      completedMockTests: mockCompleted,
      mockTestAverage: mockAvgScore,
      mockTestBestScore: mockBestScore,
      preparationDays: prepDays,
      activePreparationDays: prepDays,
      currentStreak,
      longestStreak,
      totalActivities: aptCompletedSessions + codingTotalSubmissions + mockCompleted,
      totalCompletedActivities: aptCompletedSessions + uniqueCodingSolved + mockCompleted,
    };

    // Return Complete Verified Analytics Payload
    res.status(200).json({
      success: true,
      data: {
        overview,
        aptitude: {
          totalAttempts: aptTotalAttempts,
          completedSessions: aptCompletedSessions,
          questionsAttempted: aptQuestionsAttempted,
          correct: aptCorrectTotal,
          incorrect: aptWrongTotal,
          unanswered: aptUnansweredTotal,
          accuracy: aptAccuracy,
          averageScore: aptAvgScore,
          bestScore: aptBestScore,
          byCategory: aptByCategory,
          byTopic: aptByTopic,
          byDifficulty: aptByDifficulty,
          recent: aptRecent,
          trend: aptTrend,
        },
        coding: {
          totalSubmissions: codingTotalSubmissions,
          problemsAttempted: uniqueCodingAttempted,
          problemsSolved: uniqueCodingSolved,
          successfulSubmissions: acceptedSubmissions.length,
          failedSubmissions,
          successRate: codingSuccessRate,
          difficultyDistribution: codingDifficultyDistribution,
          topics: codingTopics,
          languages: languageStats,
          recent: codingRecent,
        },
        mockTests: {
          totalAttempts: mockTotalAttempted,
          completed: mockCompleted,
          expired: mockExpired,
          inProgress: mockInProgress,
          averagePercentage: mockAvgScore,
          bestPercentage: mockBestScore,
          byCategory: mockByCategory,
          byDifficulty: mockByDifficulty,
          recent: mockRecent,
        },
        topics: topicHeatmap,
        strengthsAndWeaknesses: {
          minimumSampleSize: 3,
          hasEnoughData: hasEnoughTopicData,
          strengths,
          weakAreas,
          guidance:
            'Topics require at least 3 evaluations to reliably determine strengths and weak areas.',
        },
        readiness,
        activity: {
          streakDays: currentStreak,
          longestStreak,
          preparationDays: prepDays,
          weeklyActivity,
          hasWeeklyActivity,
        },
        companies: targetCompaniesAnalytics,
        recommendations: finalRecommendations,
        scoreTrend,
        recentActivity: recentActivity.slice(0, 8),
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getProgressSummary,
};
