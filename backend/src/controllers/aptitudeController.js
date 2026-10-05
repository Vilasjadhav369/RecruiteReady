import mongoose from 'mongoose';
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import notificationService from '../services/notificationService.js';

/**
 * Helper to sanitize question for active student session
 * Strips correctOption and explanation to prevent answer leakage
 */
const sanitizeQuestionForSession = (q) => ({
  _id: q._id,
  question: q.question,
  options: q.options,
  category: q.category,
  topic: q.topic,
  difficulty: q.difficulty,
  marks: q.marks || 1,
});

/**
 * POST /api/aptitude/sessions
 * Start a new randomized aptitude session.
 */
export const startSession = async (req, res, next) => {
  try {
    const { category, topic, difficulty, numberOfQuestions = 10, timeLimitMinutes = 15 } = req.body;

    const numQ = Math.min(Math.max(Number(numberOfQuestions) || 10, 1), 50);
    const timeMins = Math.min(Math.max(Number(timeLimitMinutes) || 15, 1), 180);

    const query = { isActive: true };
    if (category && category !== 'all' && category !== 'undefined' && category !== 'null') query.category = category;
    if (topic && topic !== 'all' && topic !== 'undefined' && topic !== 'null') query.topic = topic;
    if (difficulty && difficulty !== 'all' && difficulty !== 'mixed' && difficulty !== 'undefined' && difficulty !== 'null') query.difficulty = difficulty;

    const availableCount = await AptitudeQuestion.countDocuments(query);
    if (availableCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active questions match your selected criteria. Please try different filters.',
      });
    }

    const actualNumQ = Math.min(numQ, availableCount);

    // Randomly sample available questions up to requested number
    const sampledQuestions = await AptitudeQuestion.aggregate([
      { $match: query },
      { $sample: { size: actualNumQ } },
    ]);

    const questionIds = sampledQuestions.map((q) => q._id);
    const initialAnswers = questionIds.map((qid) => ({
      questionId: qid,
      selectedOption: '',
      isCorrect: null,
      marksObtained: 0,
    }));

    const attempt = await AptitudeAttempt.create({
      user: req.user._id,
      questionIds,
      answers: initialAnswers,
      category: category || 'General Aptitude',
      topic: topic || 'Mixed Topics',
      difficulty: difficulty || 'mixed',
      totalQuestions: sampledQuestions.length,
      status: 'in_progress',
      startedAt: new Date(),
      timeLimitSeconds: timeMins * 60,
    });

    const sanitizedQuestions = sampledQuestions.map(sanitizeQuestionForSession);

    res.status(201).json({
      success: true,
      message: 'Aptitude session started',
      data: {
        sessionId: attempt._id,
        attempt: {
          _id: attempt._id,
          totalQuestions: attempt.totalQuestions,
          category: attempt.category,
          topic: attempt.topic,
          difficulty: attempt.difficulty,
          status: attempt.status,
          startedAt: attempt.startedAt,
          timeLimitSeconds: attempt.timeLimitSeconds,
          remainingSeconds: attempt.timeLimitSeconds,
          answers: attempt.answers,
        },
        questions: sanitizedQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/aptitude/sessions/:id
 * Retrieve active session info for student (without answer keys).
 */
export const getSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    const attempt = await AptitudeAttempt.findOne({ _id: id, user: req.user._id }).populate({
      path: 'questionIds',
      select: '-correctOption -explanation',
    });

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Aptitude session not found' });
    }

    // Determine elapsed time
    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
    const remainingSeconds = Math.max(0, attempt.timeLimitSeconds - elapsedSeconds);

    // If time has strictly expired and test was in_progress
    if (remainingSeconds === 0 && attempt.status === 'in_progress') {
      attempt.status = 'expired';
      await attempt.save();
    }

    res.status(200).json({
      success: true,
      data: {
        attempt: {
          _id: attempt._id,
          category: attempt.category,
          topic: attempt.topic,
          difficulty: attempt.difficulty,
          totalQuestions: attempt.totalQuestions,
          status: attempt.status,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          timeLimitSeconds: attempt.timeLimitSeconds,
          remainingSeconds,
          answers: attempt.answers,
        },
        questions: attempt.questionIds.map(sanitizeQuestionForSession),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/aptitude/sessions/:id/answers
 * Save a single question answer in progress.
 */
export const saveAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questionId, selectedOption } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID supplied' });
    }

    const validOption = ['A', 'B', 'C', 'D', ''].includes(selectedOption) ? selectedOption : '';

    const attempt = await AptitudeAttempt.findOne({ _id: id, user: req.user._id });
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Cannot update answers because session is already ${attempt.status}.`,
      });
    }

    // Check if question belongs to session
    const isQInSession = attempt.questionIds.some((q) => q.toString() === questionId);
    if (!isQInSession) {
      return res.status(400).json({ success: false, message: 'Question does not belong to this session' });
    }

    // Update in answers array
    const ansIndex = attempt.answers.findIndex((a) => a.questionId.toString() === questionId);
    if (ansIndex >= 0) {
      attempt.answers[ansIndex].selectedOption = validOption;
    } else {
      attempt.answers.push({ questionId, selectedOption: validOption });
    }

    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Answer saved',
      data: {
        questionId,
        selectedOption: validOption,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/aptitude/sessions/:id/submit
 * Server-side score calculation and finalization.
 */
export const submitSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    const attempt = await AptitudeAttempt.findOne({ _id: id, user: req.user._id });
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Session has already been ${attempt.status}`,
      });
    }

    // Verify time limit
    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
    // Allow a grace window of 15 seconds for network latency
    const isExpired = elapsedSeconds > (attempt.timeLimitSeconds + 15);

    // Fetch actual questions with correct answers
    const questions = await AptitudeQuestion.find({ _id: { $in: attempt.questionIds } });
    const questionMap = new Map();
    questions.forEach((q) => questionMap.set(q._id.toString(), q));

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let totalScore = 0;

    const evaluatedAnswers = attempt.questionIds.map((qid) => {
      const qStr = qid.toString();
      const qObj = questionMap.get(qStr);
      const userAns = attempt.answers.find((a) => a.questionId.toString() === qStr);
      const selected = userAns ? userAns.selectedOption : '';

      if (!selected) {
        unansweredCount++;
        return {
          questionId: qid,
          selectedOption: '',
          isCorrect: false,
          marksObtained: 0,
        };
      }

      const isCorrect = qObj && qObj.correctOption === selected;
      const marks = qObj?.marks || 1;

      if (isCorrect) {
        correctCount++;
        totalScore += marks;
        return {
          questionId: qid,
          selectedOption: selected,
          isCorrect: true,
          marksObtained: marks,
        };
      } else {
        wrongCount++;
        return {
          questionId: qid,
          selectedOption: selected,
          isCorrect: false,
          marksObtained: 0,
        };
      }
    });

    const totalQuestions = attempt.totalQuestions || questions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    attempt.answers = evaluatedAnswers;
    attempt.correctAnswers = correctCount;
    attempt.wrongAnswers = wrongCount;
    attempt.unanswered = unansweredCount;
    attempt.score = totalScore;
    attempt.percentage = percentage;
    attempt.status = isExpired ? 'expired' : 'submitted';
    attempt.submittedAt = new Date();

    await attempt.save();

    // Generate aptitude completion notification for student
    await notificationService.createNotification({
      recipient: attempt.user,
      type: 'aptitude_completed',
      title: 'Aptitude Practice Completed',
      message: `Your aptitude practice result for "${attempt.subcategory || attempt.category || 'Practice Session'}" is ready. Score: ${attempt.percentage}%`,
      link: `/aptitude/result/${attempt._id}`,
      metadata: { entityId: attempt._id.toString() },
    });

    res.status(200).json({
      success: true,
      message: isExpired ? 'Time expired. Test auto-submitted.' : 'Test submitted successfully',
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
 * GET /api/aptitude/results/:id
 * Fetch detailed test results including explanations.
 */
export const getSessionResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    const attempt = await AptitudeAttempt.findOne({
      _id: id,
      user: req.user._id,
      status: { $in: ['submitted', 'expired'] },
    }).populate('questionIds');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Completed attempt result not found or test is still in progress',
      });
    }

    const answerMap = new Map();
    attempt.answers.forEach((a) => answerMap.set(a.questionId.toString(), a));

    const detailedReview = (attempt.questionIds || []).map((q) => {
      const ansObj = answerMap.get(q._id.toString());
      return {
        questionId: q._id,
        question: q.question,
        options: q.options,
        category: q.category,
        topic: q.topic,
        difficulty: q.difficulty,
        correctOption: q.correctOption,
        explanation: q.explanation,
        marks: q.marks || 1,
        selectedOption: ansObj ? ansObj.selectedOption : '',
        isCorrect: ansObj ? ansObj.isCorrect : false,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          _id: attempt._id,
          category: attempt.category,
          topic: attempt.topic,
          difficulty: attempt.difficulty,
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
        review: detailedReview,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/aptitude/history
 * List user's past aptitude attempts.
 */
export const getAptitudeHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // Auto-expire any in_progress attempts whose timer has genuinely elapsed
    const now = new Date();
    await AptitudeAttempt.updateMany(
      {
        user: req.user._id,
        status: 'in_progress',
        $expr: {
          $gt: [
            { $subtract: [now, '$startedAt'] },
            { $multiply: ['$timeLimitSeconds', 1000] },
          ],
        },
      },
      {
        $set: {
          status: 'expired',
        },
      }
    );

    const total = await AptitudeAttempt.countDocuments({ user: req.user._id });
    const attempts = await AptitudeAttempt.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-questionIds -answers')
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

/**
 * GET /api/aptitude/metadata
 * Returns available categories, topics, and question counts for session configuration.
 */
export const getAptitudeMetadata = async (req, res, next) => {
  try {
    const categories = await AptitudeQuestion.distinct('category', { isActive: true });
    const topics = await AptitudeQuestion.distinct('topic', { isActive: true });
    const totalQuestions = await AptitudeQuestion.countDocuments({ isActive: true });

    const countsByCategory = await AptitudeQuestion.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        categories,
        topics,
        totalQuestions,
        countsByCategory: countsByCategory.reduce((acc, c) => {
          acc[c._id] = c.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    next(error);
  }
};
