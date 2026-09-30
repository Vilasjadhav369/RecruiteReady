import User from '../models/User.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import CodingSubmission from '../models/CodingSubmission.js';
import MockTestAttempt from '../models/MockTestAttempt.js';

/**
 * GET /api/leaderboard
 * Computes platform leaderboard from actual student activity.
 * Transparent formula:
 * Score = (Aptitude Correct * 10) + (Mock Test Points) + (Accepted Coding Problems * 25)
 * Zero fabricated students or phantom points.
 */
export const getLeaderboard = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student', isActive: true })
      .select('firstName lastName college createdAt')
      .lean();

    if (students.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          leaderboard: [],
          formula: 'Score = (Aptitude Correct * 10) + (Mock Test Points) + (Accepted Coding Solved * 25)',
          message: 'Leaderboard will appear once enough activity is available.',
        },
      });
    }

    const studentIds = students.map((s) => s._id);

    // Aggregate aptitude correct answers by user
    const [aptitudeAgg, codingAgg, mockAgg] = await Promise.all([
      AptitudeAttempt.aggregate([
        { $match: { user: { $in: studentIds }, status: { $in: ['submitted', 'expired'] } } },
        {
          $group: {
            _id: '$user',
            totalCorrect: { $sum: '$correctAnswers' },
            attemptsCount: { $sum: 1 },
          },
        },
      ]),
      CodingSubmission.aggregate([
        { $match: { user: { $in: studentIds }, status: 'accepted' } },
        {
          $group: {
            _id: '$user',
            acceptedCount: { $sum: 1 },
          },
        },
      ]),
      MockTestAttempt.aggregate([
        { $match: { user: { $in: studentIds }, status: { $in: ['submitted', 'expired'] } } },
        {
          $group: {
            _id: '$user',
            totalMockScore: { $sum: '$score' },
            testsCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const aptMap = new Map(aptitudeAgg.map((a) => [a._id.toString(), a]));
    const codeMap = new Map(codingAgg.map((c) => [c._id.toString(), c]));
    const mockMap = new Map(mockAgg.map((m) => [m._id.toString(), m]));

    const scoredStudents = [];

    students.forEach((student) => {
      const sId = student._id.toString();
      const apt = aptMap.get(sId) || { totalCorrect: 0, attemptsCount: 0 };
      const code = codeMap.get(sId) || { acceptedCount: 0 };
      const mock = mockMap.get(sId) || { totalMockScore: 0, testsCount: 0 };

      const points = (apt.totalCorrect * 10) + (mock.totalMockScore) + (code.acceptedCount * 25);

      if (points > 0 || apt.attemptsCount > 0) {
        scoredStudents.push({
          id: student._id,
          displayName: `${student.firstName} ${student.lastName ? student.lastName.charAt(0) + '.' : ''}`,
          college: student.college || 'Engineering Institute',
          score: points,
          stats: {
            aptitudeCorrect: apt.totalCorrect,
            codingAccepted: code.acceptedCount,
            testsCompleted: mock.testsCount,
          },
        });
      }
    });

    // Sort descending by score
    scoredStudents.sort((a, b) => b.score - a.score);

    // Assign rank
    const rankedLeaderboard = scoredStudents.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    res.status(200).json({
      success: true,
      data: {
        leaderboard: rankedLeaderboard,
        formula: 'Points = (Aptitude Correct * 10) + (Mock Test Score) + (Accepted Coding Problems * 25)',
        totalActiveParticipants: rankedLeaderboard.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
