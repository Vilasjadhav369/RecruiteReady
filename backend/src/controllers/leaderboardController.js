import User from '../models/User.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import CodingSubmission from '../models/CodingSubmission.js';
import MockTestAttempt from '../models/MockTestAttempt.js';

/**
 * Scoring weights for verified completed activities.
 * Transparent and proportional to assessment effort.
 */
const SCORING_WEIGHTS = {
  aptitudeSession: 10,
  codingProblem: 25,
  mockTest: 30,
};

/**
 * GET /api/leaderboard
 * Computes platform campus leaderboard strictly from verified student database records.
 *
 * Rules:
 * - Aptitude: completed session (status: submitted or expired)
 * - Coding: distinct problems solved (status: accepted) — duplicates never inflate score
 * - Mock Tests: completed assessments (status: submitted) — expired/in-progress excluded
 * - Ranking: Standard competition ranking (1, 2, 2, 4) with deterministic tie-breaking
 * - Privacy: No emails, passwords, or private fields exposed. Name formatted as "First L."
 * - Zero fabricated students, schools, or phantom points.
 */
export const getLeaderboard = async (req, res, next) => {
  try {
    const currentUserId = req.user?._id?.toString();

    // 1. Perform authentic aggregations directly on indexed attempt/submission records
    const [aptitudeAgg, codingAgg, mockAgg] = await Promise.all([
      // Aptitude completed sessions (status: submitted or expired)
      AptitudeAttempt.aggregate([
        {
          $match: {
            status: { $in: ['submitted', 'expired'] },
          },
        },
        {
          $group: {
            _id: '$user',
            completedSessions: { $sum: 1 },
            correctTotal: { $sum: '$correctAnswers' },
            questionsAttempted: { $sum: '$totalQuestions' },
          },
        },
      ]),

      // Coding problems solved: DISTINCT problems per user with status: accepted
      // Grouping by { user, problem } first guarantees duplicates never inflate count
      CodingSubmission.aggregate([
        {
          $match: {
            status: 'accepted',
          },
        },
        {
          $group: {
            _id: { user: '$user', problem: '$problem' },
          },
        },
        {
          $group: {
            _id: '$_id.user',
            distinctSolved: { $sum: 1 },
          },
        },
      ]),

      // Mock tests completed: status strictly submitted (expired/abandoned excluded)
      MockTestAttempt.aggregate([
        {
          $match: {
            status: 'submitted',
          },
        },
        {
          $group: {
            _id: '$user',
            completedTests: { $sum: 1 },
            correctTotal: { $sum: '$correctAnswers' },
          },
        },
      ]),
    ]);

    // 2. Identify candidate student IDs who have qualifying activity (plus current user)
    const candidateIds = new Set();
    aptitudeAgg.forEach((a) => { if (a._id) candidateIds.add(a._id.toString()); });
    codingAgg.forEach((c) => { if (c._id) candidateIds.add(c._id.toString()); });
    mockAgg.forEach((m) => { if (m._id) candidateIds.add(m._id.toString()); });
    if (currentUserId) candidateIds.add(currentUserId);

    if (candidateIds.size === 0) {
      return res.status(200).json({
        success: true,
        data: {
          leaderboard: [],
          currentUser: {
            isRanked: false,
            rank: null,
            score: 0,
            completedActivities: 0,
            aptitudeCompleted: 0,
            mockTestsCompleted: 0,
            codingProblemsSolved: 0,
          },
          scoringRules: {
            aptitudeWeight: SCORING_WEIGHTS.aptitudeSession,
            codingWeight: SCORING_WEIGHTS.codingProblem,
            mockTestWeight: SCORING_WEIGHTS.mockTest,
            formula: `Score = (Aptitude Sessions × ${SCORING_WEIGHTS.aptitudeSession}) + (Coding Problems Solved × ${SCORING_WEIGHTS.codingProblem}) + (Mock Tests × ${SCORING_WEIGHTS.mockTest})`,
          },
          totalRankedStudents: 0,
        },
      });
    }

    // 3. Fetch ONLY active student accounts for participants with real activity (or current user)
    const students = await User.find({
      _id: { $in: Array.from(candidateIds) },
      role: 'student',
      isActive: { $ne: false },
    })
      .select('firstName lastName profilePhoto createdAt')
      .lean();

    const aptMap = new Map(aptitudeAgg.map((a) => [a._id.toString(), a]));
    const codeMap = new Map(codingAgg.map((c) => [c._id.toString(), c]));
    const mockMap = new Map(mockAgg.map((m) => [m._id.toString(), m]));

    // 3. Compute verified metrics & scores for each student
    const candidateList = [];

    students.forEach((student) => {
      const sId = student._id.toString();
      const apt = aptMap.get(sId) || { completedSessions: 0, correctTotal: 0, questionsAttempted: 0 };
      const code = codeMap.get(sId) || { distinctSolved: 0 };
      const mock = mockMap.get(sId) || { completedTests: 0, correctTotal: 0 };

      const aptitudeCompleted = apt.completedSessions || 0;
      const codingProblemsSolved = code.distinctSolved || 0;
      const mockTestsCompleted = mock.completedTests || 0;
      const completedActivities = aptitudeCompleted + codingProblemsSolved + mockTestsCompleted;

      const score =
        (aptitudeCompleted * SCORING_WEIGHTS.aptitudeSession) +
        (codingProblemsSolved * SCORING_WEIGHTS.codingProblem) +
        (mockTestsCompleted * SCORING_WEIGHTS.mockTest);

      // Privacy-safe student display formatting
      const first = (student.firstName || '').trim();
      const last = (student.lastName || '').trim();
      const lastInitial = last ? `${last.charAt(0).toUpperCase()}.` : '';
      const displayName = first ? `${first} ${lastInitial}`.trim() : 'Student';

      const initial1 = first ? first.charAt(0).toUpperCase() : 'S';
      const initial2 = last ? last.charAt(0).toUpperCase() : '';
      const initials = `${initial1}${initial2}`;

      candidateList.push({
        id: sId,
        displayName,
        initials,
        profilePhoto: student.profilePhoto || null,
        score,
        completedActivities,
        aptitudeCompleted,
        codingProblemsSolved,
        mockTestsCompleted,
        stats: {
          aptitudeSessions: aptitudeCompleted,
          aptitudeCorrect: apt.correctTotal || 0,
          codingSolved: codingProblemsSolved,
          mockTestsCompleted,
        },
      });
    });

    // 4. Filter for active participants: only students with real activity (score > 0) qualify
    const rankedParticipants = candidateList.filter((c) => c.completedActivities > 0);

    // 5. Deterministic sorting:
    // Primary: Score descending
    // Secondary: Completed activities descending
    // Tertiary: Stable student ID string ascending
    rankedParticipants.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.completedActivities !== a.completedActivities) return b.completedActivities - a.completedActivities;
      return a.id.localeCompare(b.id);
    });

    // 6. Assign competition ranking (1, 2, 2, 4)
    let currentRank = 1;
    for (let i = 0; i < rankedParticipants.length; i++) {
      if (i > 0 && rankedParticipants[i].score < rankedParticipants[i - 1].score) {
        currentRank = i + 1;
      }
      rankedParticipants[i].rank = currentRank;
    }

    // 7. Extract current user's ranking context
    let currentUserContext = {
      isRanked: false,
      rank: null,
      score: 0,
      completedActivities: 0,
      aptitudeCompleted: 0,
      mockTestsCompleted: 0,
      codingProblemsSolved: 0,
    };

    if (currentUserId) {
      const userInRanked = rankedParticipants.find((p) => p.id === currentUserId);
      if (userInRanked) {
        currentUserContext = {
          isRanked: true,
          rank: userInRanked.rank,
          score: userInRanked.score,
          completedActivities: userInRanked.completedActivities,
          aptitudeCompleted: userInRanked.aptitudeCompleted,
          mockTestsCompleted: userInRanked.mockTestsCompleted,
          codingProblemsSolved: userInRanked.codingProblemsSolved,
        };
      } else {
        // User has 0 qualifying activity
        const userCandidate = candidateList.find((c) => c.id === currentUserId);
        if (userCandidate) {
          currentUserContext = {
            isRanked: false,
            rank: null,
            score: userCandidate.score,
            completedActivities: userCandidate.completedActivities,
            aptitudeCompleted: userCandidate.aptitudeCompleted,
            mockTestsCompleted: userCandidate.mockTestsCompleted,
            codingProblemsSolved: userCandidate.codingProblemsSolved,
          };
        }
      }
    }

    // 8. Public payload stripping any internal/unneeded data with safe limit bounding
    const parsedLimit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
    const limit = Math.min(100, Math.max(1, isNaN(parsedLimit) ? 100 : parsedLimit));

    const publicLeaderboard = rankedParticipants.map((p) => ({
      rank: p.rank,
      student: {
        id: p.id,
        displayName: p.displayName,
        initials: p.initials,
        profilePhoto: p.profilePhoto,
      },
      score: p.score,
      completedActivities: p.completedActivities,
      aptitudeCompleted: p.aptitudeCompleted,
      codingProblemsSolved: p.codingProblemsSolved,
      mockTestsCompleted: p.mockTestsCompleted,
      stats: p.stats,
    }));

    res.status(200).json({
      success: true,
      data: {
        leaderboard: publicLeaderboard.slice(0, limit),
        currentUser: currentUserContext,
        scoringRules: {
          aptitudeWeight: SCORING_WEIGHTS.aptitudeSession,
          codingWeight: SCORING_WEIGHTS.codingProblem,
          mockTestWeight: SCORING_WEIGHTS.mockTest,
          formula: `Score = (Aptitude Sessions × ${SCORING_WEIGHTS.aptitudeSession}) + (Coding Problems Solved × ${SCORING_WEIGHTS.codingProblem}) + (Mock Tests × ${SCORING_WEIGHTS.mockTest})`,
        },
        totalRankedStudents: publicLeaderboard.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
