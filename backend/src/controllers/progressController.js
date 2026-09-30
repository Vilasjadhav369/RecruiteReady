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

    const [aptitudeAttempts, codingSubmissions, mockTestAttempts] = await Promise.all([
      AptitudeAttempt.find({ user: userId, status: { $in: ['submitted', 'expired'] } })
        .sort({ createdAt: 1 })
        .lean(),
      CodingSubmission.find({ user: userId }).populate('problem', 'title difficulty topics').lean(),
      MockTestAttempt.find({ user: userId, status: { $in: ['submitted', 'expired'] } })
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    // 1. Aptitude Metrics
    const aptTotalAttempts = aptitudeAttempts.length;
    const aptQuestionsAttempted = aptitudeAttempts.reduce((sum, a) => sum + (a.totalQuestions || 0), 0);
    const aptCorrectTotal = aptitudeAttempts.reduce((sum, a) => sum + (a.correctAnswers || 0), 0);
    const aptAvgScore = aptTotalAttempts > 0
      ? Math.round(aptitudeAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / aptTotalAttempts)
      : 0;

    // Category / Topic breakdown
    const topicMap = new Map();
    aptitudeAttempts.forEach((att) => {
      (att.answers || []).forEach((ans) => {
        const key = att.topic || att.category || 'General';
        if (!topicMap.has(key)) {
          topicMap.set(key, { total: 0, correct: 0 });
        }
        const stat = topicMap.get(key);
        stat.total += 1;
        if (ans.isCorrect) stat.correct += 1;
      });
    });

    const topicPerformance = [];
    topicMap.forEach((val, topic) => {
      topicPerformance.push({
        topic,
        total: val.total,
        correct: val.correct,
        accuracy: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
      });
    });

    // 2. Coding Metrics
    const codingTotalSubmissions = codingSubmissions.length;
    const acceptedSubmissions = codingSubmissions.filter((s) => s.status === 'accepted');
    const uniqueProblemsSolved = new Set(
      acceptedSubmissions.map((s) => s.problem?._id?.toString() || s.problem?.toString())
    ).size;

    const languageStats = {};
    codingSubmissions.forEach((s) => {
      const lang = s.language || 'other';
      languageStats[lang] = (languageStats[lang] || 0) + 1;
    });

    // 3. Mock Test Metrics
    const mockTotalCompleted = mockTestAttempts.length;
    const mockAvgScore = mockTotalCompleted > 0
      ? Math.round(mockTestAttempts.reduce((sum, m) => sum + (m.percentage || 0), 0) / mockTotalCompleted)
      : 0;

    // 4. Chronological Score Trend
    const scoreTrend = [];
    aptitudeAttempts.forEach((a) => {
      scoreTrend.push({
        date: a.submittedAt || a.createdAt,
        type: 'Aptitude',
        label: `${a.category || 'Aptitude'} (${a.topic || 'Practice'})`,
        percentage: a.percentage || 0,
      });
    });
    mockTestAttempts.forEach((m) => {
      scoreTrend.push({
        date: m.submittedAt || m.createdAt,
        type: 'Mock Test',
        label: 'Mock Test',
        percentage: m.percentage || 0,
      });
    });
    scoreTrend.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      success: true,
      data: {
        aptitude: {
          totalAttempts: aptTotalAttempts,
          questionsAttempted: aptQuestionsAttempted,
          correctTotal: aptCorrectTotal,
          averagePercentage: aptAvgScore,
          topicPerformance,
        },
        coding: {
          totalSubmissions: codingTotalSubmissions,
          problemsSolved: uniqueProblemsSolved,
          acceptedSubmissions: acceptedSubmissions.length,
          languageBreakdown: languageStats,
        },
        mockTests: {
          completed: mockTotalCompleted,
          averagePercentage: mockAvgScore,
        },
        scoreTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};
