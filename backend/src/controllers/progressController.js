import AptitudeAttempt from '../models/AptitudeAttempt.js';
import CodingSubmission from '../models/CodingSubmission.js';
import MockTestAttempt from '../models/MockTestAttempt.js';

/**
 * GET /api/progress/summary
 * Aggregates real student progress metrics across Aptitude, Coding, and Mock Tests.
 * Zero fabricated data.
 */
export const getProgressSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      allAptitudeAttempts,
      completedAptitudeAttempts,
      allCodingSubmissions,
      allMockAttempts,
      submittedMockAttempts,
    ] = await Promise.all([
      AptitudeAttempt.find({ user: userId }).sort({ createdAt: -1 }).lean(),
      AptitudeAttempt.find({ user: userId, status: { $in: ['submitted', 'expired'] } })
        .sort({ createdAt: 1 })
        .lean(),
      CodingSubmission.find({ user: userId })
        .populate('problem', 'title difficulty topics category')
        .sort({ submittedAt: -1 })
        .lean(),
      MockTestAttempt.find({ user: userId }).sort({ createdAt: -1 }).lean(),
      MockTestAttempt.find({ user: userId, status: 'submitted' })
        .populate('mockTest', 'title totalQuestions')
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    // 1. Aptitude Metrics
    const aptTotalAttempts = allAptitudeAttempts.length;
    const aptCompletedSessions = completedAptitudeAttempts.length;
    const aptQuestionsAttempted = completedAptitudeAttempts.reduce((sum, a) => sum + (a.totalQuestions || 0), 0);
    const aptCorrectTotal = completedAptitudeAttempts.reduce((sum, a) => sum + (a.correctAnswers || 0), 0);
    const aptAvgScore = aptCompletedSessions > 0
      ? Math.round(completedAptitudeAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / aptCompletedSessions)
      : null;

    // Topic breakdown for Aptitude
    const aptTopicMap = new Map();
    completedAptitudeAttempts.forEach((att) => {
      (att.answers || []).forEach((ans) => {
        const key = att.topic || att.category || 'General Aptitude';
        if (!aptTopicMap.has(key)) {
          aptTopicMap.set(key, { total: 0, correct: 0 });
        }
        const stat = aptTopicMap.get(key);
        stat.total += 1;
        if (ans.isCorrect) stat.correct += 1;
      });
    });

    const aptTopicPerformance = [];
    aptTopicMap.forEach((val, topic) => {
      aptTopicPerformance.push({
        topic,
        total: val.total,
        correct: val.correct,
        accuracy: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
      });
    });

    // 2. Coding Metrics
    const codingTotalSubmissions = allCodingSubmissions.length;
    const uniqueAttemptedProblems = new Set(
      allCodingSubmissions.map((s) => s.problem?._id?.toString() || s.problem?.toString())
    ).size;
    const acceptedSubmissions = allCodingSubmissions.filter((s) => s.status === 'accepted');
    const uniqueSolvedProblems = new Set(
      acceptedSubmissions.map((s) => s.problem?._id?.toString() || s.problem?.toString())
    ).size;
    const codingAcceptanceRate = codingTotalSubmissions > 0
      ? Math.round((acceptedSubmissions.length / codingTotalSubmissions) * 100)
      : null;

    const languageStats = {};
    const codingTopicMap = new Map();
    allCodingSubmissions.forEach((s) => {
      const lang = s.language || 'other';
      languageStats[lang] = (languageStats[lang] || 0) + 1;

      // Extract topics if problem metadata is populated
      const problemTopics = Array.isArray(s.problem?.topics) && s.problem.topics.length > 0
        ? s.problem.topics
        : s.problem?.category
        ? [s.problem.category]
        : [];

      problemTopics.forEach((t) => {
        if (!codingTopicMap.has(t)) {
          codingTopicMap.set(t, { attempted: 0, solved: 0 });
        }
        const st = codingTopicMap.get(t);
        st.attempted += 1;
        if (s.status === 'accepted') st.solved += 1;
      });
    });

    const codingTopicPerformance = [];
    codingTopicMap.forEach((val, topic) => {
      codingTopicPerformance.push({
        topic,
        attempted: val.attempted,
        solved: val.solved,
      });
    });

    // 3. Mock Test Metrics (M7 definition: completed = submitted)
    const mockTotalAttempted = allMockAttempts.length;
    const mockCompleted = submittedMockAttempts.length;
    const mockExpired = allMockAttempts.filter((m) => m.status === 'expired').length;
    const mockInProgress = allMockAttempts.filter((m) => m.status === 'in_progress').length;
    const mockAvgScore = mockCompleted > 0
      ? Math.round(submittedMockAttempts.reduce((sum, m) => sum + (m.percentage || 0), 0) / mockCompleted)
      : null;
    const mockBestScore = mockCompleted > 0
      ? Math.max(...submittedMockAttempts.map((m) => m.percentage || 0))
      : null;

    // 4. Chronological Score Trend (only from completed attempts)
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

    // 5. Preparation Streak (genuine consecutive calendar days)
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

    // 6. Chronological Unified Recent Activity Feed
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
          ? 'Assessment session currently in progress'
          : `Score: ${m.percentage || 0}% (${m.correctAnswers || 0}/${m.totalQuestions || 0})`,
        timestamp: m.submittedAt || m.createdAt,
        status: m.status,
      });
    });

    activityFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCompletedActivities: aptCompletedSessions + uniqueSolvedProblems + mockCompleted,
          streakDays,
        },
        aptitude: {
          totalAttempts: aptTotalAttempts,
          completedSessions: aptCompletedSessions,
          questionsAttempted: aptQuestionsAttempted,
          correctTotal: aptCorrectTotal,
          averagePercentage: aptAvgScore,
          topicPerformance: aptTopicPerformance,
        },
        coding: {
          totalSubmissions: codingTotalSubmissions,
          attemptedProblems: uniqueAttemptedProblems,
          problemsSolved: uniqueSolvedProblems,
          acceptedSubmissions: acceptedSubmissions.length,
          acceptanceRate: codingAcceptanceRate,
          languageBreakdown: languageStats,
          topicPerformance: codingTopicPerformance,
        },
        mockTests: {
          totalAttempts: mockTotalAttempted,
          completed: mockCompleted,
          expired: mockExpired,
          inProgress: mockInProgress,
          averagePercentage: mockAvgScore,
          bestPercentage: mockBestScore,
        },
        scoreTrend,
        recentActivity: activityFeed.slice(0, 8),
      },
    });
  } catch (error) {
    next(error);
  }
};
