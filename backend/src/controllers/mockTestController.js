import mongoose from 'mongoose';
import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import CodingProblem from '../models/CodingProblem.js';

/**
 * Sanitize question for active mock test session
 * Never expose correctOption or hidden test cases during active test
 */
const sanitizeMockQuestion = (q, qType) => {
  if (qType === 'aptitude') {
    return {
      _id: q._id,
      questionType: 'aptitude',
      question: q.question,
      options: q.options,
      category: q.category,
      topic: q.topic,
      difficulty: q.difficulty,
      marks: q.marks || 1,
    };
  } else {
    return {
      _id: q._id,
      questionType: 'coding',
      title: q.title,
      description: q.description,
      difficulty: q.difficulty,
      examples: q.examples,
      constraints: q.constraints,
      supportedLanguages: q.supportedLanguages,
      starterCode: q.starterCode,
    };
  }
};

/**
 * GET /api/mock-tests
 * List all published mock tests.
 */
export const getMockTests = async (req, res, next) => {
  try {
    const { category = '', difficulty = '', page = 1, limit = 10 } = req.query;
    const query = { isPublished: true };

    if (category && category !== 'all') {
      query.categories = category;
    }
    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await MockTest.countDocuments(query);
    const mockTests = await MockTest.find(query)
      .select('title description durationMinutes totalQuestions categories difficulty instructions createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        mockTests,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mock-tests/:id
 * Retrieve mock test details before starting.
 */
export const getMockTestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid test ID' });
    }

    const test = await MockTest.findOne({ _id: id, isPublished: true })
      .select('title description durationMinutes totalQuestions categories difficulty instructions createdAt');

    if (!test) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }

    res.status(200).json({
      success: true,
      data: { test },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/mock-tests/:id/start
 * Start a mock test attempt with server-side timer.
 */
export const startMockTestAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid test ID' });
    }

    const test = await MockTest.findOne({ _id: id, isPublished: true });
    if (!test) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }

    if (!test.questions || test.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This test does not contain any questions yet. Please check back later.',
      });
    }

    // Load actual questions
    const aptIds = test.questions.filter((q) => q.questionType === 'aptitude').map((q) => q.questionId);
    const codeIds = test.questions.filter((q) => q.questionType === 'coding').map((q) => q.questionId);

    const [aptQuestions, codingQuestions] = await Promise.all([
      AptitudeQuestion.find({ _id: { $in: aptIds }, isActive: true }).lean(),
      CodingProblem.find({ _id: { $in: codeIds }, isActive: true }).lean(),
    ]);

    const qMap = new Map();
    aptQuestions.forEach((q) => qMap.set(q._id.toString(), { ...q, questionType: 'aptitude' }));
    codingQuestions.forEach((q) => qMap.set(q._id.toString(), { ...q, questionType: 'coding' }));

    const resolvedQuestions = [];
    const initialAnswers = [];

    test.questions.forEach((tq) => {
      const qData = qMap.get(tq.questionId.toString());
      if (qData) {
        resolvedQuestions.push(sanitizeMockQuestion(qData, tq.questionType));
        initialAnswers.push({
          questionId: tq.questionId,
          questionType: tq.questionType,
          selectedOption: '',
          codeSubmissionId: null,
          isCorrect: null,
          marksObtained: 0,
        });
      }
    });

    if (resolvedQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Questions in this mock test are currently unavailable.',
      });
    }

    const timeLimitSeconds = (test.durationMinutes || 30) * 60;

    const attempt = await MockTestAttempt.create({
      user: req.user._id,
      mockTest: test._id,
      answers: initialAnswers,
      totalQuestions: resolvedQuestions.length,
      status: 'in_progress',
      startedAt: new Date(),
      timeLimitSeconds,
    });

    res.status(201).json({
      success: true,
      message: 'Mock test started',
      data: {
        attemptId: attempt._id,
        test: {
          _id: test._id,
          title: test.title,
          description: test.description,
          durationMinutes: test.durationMinutes,
          timeLimitSeconds,
          remainingSeconds: timeLimitSeconds,
          totalQuestions: resolvedQuestions.length,
        },
        attempt: {
          _id: attempt._id,
          status: attempt.status,
          startedAt: attempt.startedAt,
          answers: attempt.answers,
        },
        questions: resolvedQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mock-tests/attempts/:id
 * Retrieve attempt state (restores on refresh).
 */
export const getAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid attempt ID' });
    }

    const attempt = await MockTestAttempt.findOne({ _id: id, user: req.user._id }).populate('mockTest');
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Mock test attempt not found' });
    }

    // Determine elapsed time
    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
    const remainingSeconds = Math.max(0, attempt.timeLimitSeconds - elapsedSeconds);

    if (remainingSeconds === 0 && attempt.status === 'in_progress') {
      attempt.status = 'expired';
      await attempt.save();
    }

    const test = attempt.mockTest;
    const aptIds = (test.questions || []).filter((q) => q.questionType === 'aptitude').map((q) => q.questionId);
    const codeIds = (test.questions || []).filter((q) => q.questionType === 'coding').map((q) => q.questionId);

    const [aptQuestions, codingQuestions] = await Promise.all([
      AptitudeQuestion.find({ _id: { $in: aptIds } }).lean(),
      CodingProblem.find({ _id: { $in: codeIds } }).lean(),
    ]);

    const qMap = new Map();
    aptQuestions.forEach((q) => qMap.set(q._id.toString(), { ...q, questionType: 'aptitude' }));
    codingQuestions.forEach((q) => qMap.set(q._id.toString(), { ...q, questionType: 'coding' }));

    const questions = [];
    (test.questions || []).forEach((tq) => {
      const qData = qMap.get(tq.questionId.toString());
      if (qData) {
        questions.push(sanitizeMockQuestion(qData, tq.questionType));
      }
    });

    res.status(200).json({
      success: true,
      data: {
        attempt: {
          _id: attempt._id,
          status: attempt.status,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          timeLimitSeconds: attempt.timeLimitSeconds,
          remainingSeconds,
          answers: attempt.answers,
          totalQuestions: attempt.totalQuestions,
        },
        test: {
          _id: test._id,
          title: test.title,
          description: test.description,
          durationMinutes: test.durationMinutes,
        },
        questions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/mock-tests/attempts/:id/answers
 * Save in-progress answer for a mock test.
 */
export const saveAttemptAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questionId, selectedOption, codeSubmissionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID supplied' });
    }

    const attempt = await MockTestAttempt.findOne({ _id: id, user: req.user._id });
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Cannot update answers because attempt is ${attempt.status}`,
      });
    }

    const ansIndex = attempt.answers.findIndex((a) => a.questionId.toString() === questionId);
    if (ansIndex >= 0) {
      if (selectedOption !== undefined) attempt.answers[ansIndex].selectedOption = selectedOption;
      if (codeSubmissionId !== undefined) attempt.answers[ansIndex].codeSubmissionId = codeSubmissionId;
    } else {
      attempt.answers.push({
        questionId,
        selectedOption: selectedOption || '',
        codeSubmissionId: codeSubmissionId || null,
      });
    }

    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Mock test answer saved',
      data: { questionId, selectedOption, codeSubmissionId },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/mock-tests/attempts/:id/submit
 * Evaluate answers server-side, calculate score, mark submitted.
 */
export const submitMockTestAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid attempt ID' });
    }

    const attempt = await MockTestAttempt.findOne({ _id: id, user: req.user._id }).populate('mockTest');
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Attempt has already been ${attempt.status}`,
      });
    }

    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
    const isExpired = elapsedSeconds > (attempt.timeLimitSeconds + 15);

    const test = attempt.mockTest;
    const aptIds = (test.questions || []).filter((q) => q.questionType === 'aptitude').map((q) => q.questionId);
    const aptQuestions = await AptitudeQuestion.find({ _id: { $in: aptIds } }).lean();
    const aptMap = new Map();
    aptQuestions.forEach((q) => aptMap.set(q._id.toString(), q));

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let totalScore = 0;

    const evaluatedAnswers = attempt.answers.map((ans) => {
      const qStr = ans.questionId.toString();
      if (ans.questionType === 'aptitude' || !ans.questionType) {
        const aptQ = aptMap.get(qStr);
        if (!ans.selectedOption) {
          unansweredCount++;
          return {
            ...ans.toObject(),
            isCorrect: false,
            marksObtained: 0,
          };
        }

        const isCorrect = aptQ && aptQ.correctOption === ans.selectedOption;
        const marks = aptQ?.marks || 1;

        if (isCorrect) {
          correctCount++;
          totalScore += marks;
          return {
            ...ans.toObject(),
            isCorrect: true,
            marksObtained: marks,
          };
        } else {
          wrongCount++;
          return {
            ...ans.toObject(),
            isCorrect: false,
            marksObtained: 0,
          };
        }
      } else {
        // Coding questions
        return ans.toObject();
      }
    });

    const totalQuestions = attempt.totalQuestions || 1;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    attempt.answers = evaluatedAnswers;
    attempt.correctAnswers = correctCount;
    attempt.wrongAnswers = wrongCount;
    attempt.unanswered = unansweredCount;
    attempt.score = totalScore;
    attempt.percentage = percentage;
    attempt.status = isExpired ? 'expired' : 'submitted';
    attempt.submittedAt = new Date();

    await attempt.save();

    res.status(200).json({
      success: true,
      message: isExpired ? 'Time expired. Test auto-submitted.' : 'Mock test submitted successfully',
      data: {
        attemptId: attempt._id,
        score: attempt.score,
        percentage: attempt.percentage,
        correctAnswers: attempt.correctAnswers,
        wrongAnswers: attempt.wrongAnswers,
        unanswered: attempt.unanswered,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mock-tests/attempts/:id/result
 * Retrieve detailed result and explanations after completion.
 */
export const getAttemptResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid attempt ID' });
    }

    const attempt = await MockTestAttempt.findOne({
      _id: id,
      user: req.user._id,
      status: { $in: ['submitted', 'expired'] },
    }).populate('mockTest');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Completed attempt result not found or test is still in progress',
      });
    }

    const test = attempt.mockTest;
    const aptIds = (test.questions || []).filter((q) => q.questionType === 'aptitude').map((q) => q.questionId);
    const aptQuestions = await AptitudeQuestion.find({ _id: { $in: aptIds } }).lean();
    const aptMap = new Map();
    aptQuestions.forEach((q) => aptMap.set(q._id.toString(), q));

    const ansMap = new Map();
    attempt.answers.forEach((a) => ansMap.set(a.questionId.toString(), a));

    const review = (test.questions || []).map((tq) => {
      const qStr = tq.questionId.toString();
      const aptQ = aptMap.get(qStr);
      const userAns = ansMap.get(qStr);

      return {
        questionId: tq.questionId,
        questionType: tq.questionType,
        question: aptQ ? aptQ.question : 'Question details unavailable',
        options: aptQ ? aptQ.options : [],
        category: aptQ ? aptQ.category : '',
        topic: aptQ ? aptQ.topic : '',
        difficulty: aptQ ? aptQ.difficulty : '',
        correctOption: aptQ ? aptQ.correctOption : '',
        explanation: aptQ ? aptQ.explanation : '',
        selectedOption: userAns ? userAns.selectedOption : '',
        isCorrect: userAns ? userAns.isCorrect : false,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          _id: attempt._id,
          testTitle: test.title,
          totalQuestions: attempt.totalQuestions,
          correctAnswers: attempt.correctAnswers,
          wrongAnswers: attempt.wrongAnswers,
          unanswered: attempt.unanswered,
          score: attempt.score,
          percentage: attempt.percentage,
          status: attempt.status,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          timeLimitSeconds: attempt.timeLimitSeconds,
        },
        review,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mock-tests/history
 * List user's past mock test attempts.
 */
export const getMockTestHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const total = await MockTestAttempt.countDocuments({ user: req.user._id });
    const attempts = await MockTestAttempt.find({ user: req.user._id })
      .populate('mockTest', 'title durationMinutes categories difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-answers')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        attempts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
