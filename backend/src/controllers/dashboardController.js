import AptitudeAttempt from '../models/AptitudeAttempt.js';
import CodingSubmission from '../models/CodingSubmission.js';
import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';

/**
 * GET /api/dashboard/summary
 * Returns real student dashboard summary data aggregated from MongoDB.
 * Zero fabricated/fake metrics.
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    const user = req.user;
    const userId = user._id;

    const [
      aptitudeAttempted,
      aptitudeCompleted,
      codingAttemptedProblems,
      codingSolvedProblems,
      mockAttempted,
      mockCompleted,
      recentAptitude,
      recentCoding,
      recentMockTests,
      publishedMockTests,
    ] = await Promise.all([
      AptitudeAttempt.countDocuments({ user: userId }),
      AptitudeAttempt.countDocuments({ user: userId, status: { $in: ['submitted', 'expired'] } }),
      CodingSubmission.distinct('problem', { user: userId }),
      CodingSubmission.distinct('problem', { user: userId, status: 'accepted' }),
      MockTestAttempt.countDocuments({ user: userId }),
      MockTestAttempt.countDocuments({ user: userId, status: { $in: ['submitted', 'expired'] } }),
      AptitudeAttempt.find({ user: userId, status: { $in: ['submitted', 'expired'] } })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      CodingSubmission.find({ user: userId })
        .populate('problem', 'title')
        .sort({ submittedAt: -1 })
        .limit(3)
        .lean(),
      MockTestAttempt.find({ user: userId, status: { $in: ['submitted', 'expired'] } })
        .populate('mockTest', 'title')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      MockTest.find({ isPublished: true })
        .select('title durationMinutes totalQuestions categories difficulty')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
    ]);

    // Build unified chronological recent activity feed
    const activityFeed = [];

    recentAptitude.forEach((a) => {
      activityFeed.push({
        id: a._id,
        type: 'aptitude',
        title: `Aptitude Practice: ${a.topic || a.category}`,
        subtitle: `Score: ${a.percentage || 0}% (${a.correctAnswers}/${a.totalQuestions})`,
        timestamp: a.submittedAt || a.createdAt,
        status: a.status,
      });
    });

    recentCoding.forEach((c) => {
      activityFeed.push({
        id: c._id,
        type: 'coding',
        title: `Coding Submission: ${c.problem?.title || 'Problem'}`,
        subtitle: `Language: ${c.language} • Status: ${c.status.replace(/_/g, ' ')}`,
        timestamp: c.submittedAt || c.createdAt,
        status: c.status,
      });
    });

    recentMockTests.forEach((m) => {
      activityFeed.push({
        id: m._id,
        type: 'mock_test',
        title: `Mock Test: ${m.mockTest?.title || 'Assessment'}`,
        subtitle: `Score: ${m.percentage || 0}%`,
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
        },
        coding: {
          attempted: codingAttemptedProblems.length,
          solved: codingSolvedProblems.length,
        },
        mockTests: {
          attempted: mockAttempted,
          completed: mockCompleted,
        },
      },
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
