import mongoose from 'mongoose';
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import notificationService from '../services/notificationService.js';

/**
 * Helper to build an immutable snapshot with shuffled options.
 * Generates options with keys A, B, C, D in shuffled order and computes the corresponding correctOption.
 */
const buildAptitudeQuestionSnapshot = (q) => {
  const origOptions = Array.isArray(q.options) ? q.options : [];
  const shuffled = [...origOptions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const optionKeys = ['A', 'B', 'C', 'D'];
  let newCorrectOption = '';
  const targetOrigCorrect = (q.correctOption || '').trim().toUpperCase();

  const remappedOptions = shuffled.map((opt, idx) => {
    const assignedKey = optionKeys[idx] || String.fromCharCode(65 + idx);
    const origKey = (opt.key || '').trim().toUpperCase();
    if (origKey === targetOrigCorrect) {
      newCorrectOption = assignedKey;
    }
    return {
      key: assignedKey,
      text: opt.text,
      originalKey: origKey,
    };
  });

  if (!newCorrectOption && remappedOptions.length > 0) {
    newCorrectOption = 'A';
  }

  return {
    questionId: q._id,
    questionType: 'aptitude',
    question: q.question,
    options: remappedOptions,
    correctOption: newCorrectOption,
    explanation: q.explanation || '',
    marks: q.marks || 1,
    category: q.category || '',
    topic: q.topic || '',
    difficulty: q.difficulty || 'medium',
  };
};

/**
 * Helper to sanitize question for active student session
 * Strips correctOption, explanation, and originalKey to prevent answer leakage
 */
const sanitizeQuestionForSession = (q) => ({
  _id: q._id || q.questionId,
  question: q.question,
  options: (q.options || []).map((opt) => ({
    key: opt.key,
    text: opt.text,
  })),
  category: q.category,
  topic: q.topic,
  difficulty: q.difficulty,
  marks: q.marks || 1,
});

/**
 * POST /api/aptitude/sessions
 * Start a new randomized aptitude session or resume an active one.
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

    const targetCategory = category || 'General Aptitude';
    const targetTopic = topic || 'Mixed Topics';
    const targetDifficulty = difficulty || 'mixed';

    // P0-C: Check if student already has an active, non-expired attempt for this criteria
    const existingAttempt = await AptitudeAttempt.findOne({
      user: req.user._id,
      category: targetCategory,
      topic: targetTopic,
      difficulty: targetDifficulty,
      status: 'in_progress',
    }).sort({ createdAt: -1 });

    if (existingAttempt) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(existingAttempt.startedAt).getTime()) / 1000);
      const remainingSeconds = Math.max(0, existingAttempt.timeLimitSeconds - elapsedSeconds);

      if (remainingSeconds > 0) {
        // Attempt is still active and valid — resume cleanly
        let sanitizedQuestions = [];
        if (existingAttempt.questionSnapshots && existingAttempt.questionSnapshots.length > 0) {
          sanitizedQuestions = existingAttempt.questionSnapshots.map(sanitizeQuestionForSession);
        } else {
          const liveQuestions = await AptitudeQuestion.find({ _id: { $in: existingAttempt.questionIds } });
          sanitizedQuestions = liveQuestions.map(sanitizeQuestionForSession);
        }

        return res.status(200).json({
          success: true,
          message: 'Active aptitude session resumed',
          data: {
            sessionId: existingAttempt._id,
            attempt: {
              _id: existingAttempt._id,
              totalQuestions: existingAttempt.totalQuestions,
              category: existingAttempt.category,
              topic: existingAttempt.topic,
              difficulty: existingAttempt.difficulty,
              status: existingAttempt.status,
              startedAt: existingAttempt.startedAt,
              timeLimitSeconds: existingAttempt.timeLimitSeconds,
              remainingSeconds,
              answers: existingAttempt.answers,
            },
            questions: sanitizedQuestions,
          },
        });
      } else {
        // Stale attempt expired — auto-expire it
        existingAttempt.status = 'expired';
        existingAttempt.submittedAt = new Date();
        await existingAttempt.save();
      }
    }

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

    // P0-A & P0-B: Build snapshots with deterministic shuffled options
    const questionSnapshots = sampledQuestions.map(buildAptitudeQuestionSnapshot);
    const questionIds = sampledQuestions.map((q) => q._id);

    const initialAnswers = questionIds.map((qid) => ({
      questionId: qid,
      selectedOption: '',
      version: 1,
      clientTimestamp: null,
      isCorrect: null,
      marksObtained: 0,
    }));

    const attempt = await AptitudeAttempt.create({
      user: req.user._id,
      questionIds,
      questionSnapshots,
      answers: initialAnswers,
      category: targetCategory,
      topic: targetTopic,
      difficulty: targetDifficulty,
      totalQuestions: sampledQuestions.length,
      status: 'in_progress',
      startedAt: new Date(),
      timeLimitSeconds: timeMins * 60,
    });

    const sanitizedQuestions = questionSnapshots.map(sanitizeQuestionForSession);

    return res.status(201).json({
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
    if (error.code === 11000) {
      // Race condition handled: a concurrent request already initialized an active session
      try {
        const existingAttempt = await AptitudeAttempt.findOne({
          user: req.user._id,
          category: req.body.category || 'General Aptitude',
          topic: req.body.topic || 'Mixed Topics',
          difficulty: req.body.difficulty || 'mixed',
          status: 'in_progress',
        }).sort({ createdAt: -1 });

        if (existingAttempt) {
          const elapsedSeconds = Math.floor((Date.now() - new Date(existingAttempt.startedAt).getTime()) / 1000);
          const remainingSeconds = Math.max(0, existingAttempt.timeLimitSeconds - elapsedSeconds);
          const sanitizedQuestions = (existingAttempt.questionSnapshots || []).map(sanitizeQuestionForSession);

          return res.status(200).json({
            success: true,
            message: 'Active aptitude session resumed',
            data: {
              sessionId: existingAttempt._id,
              attempt: {
                _id: existingAttempt._id,
                totalQuestions: existingAttempt.totalQuestions,
                category: existingAttempt.category,
                topic: existingAttempt.topic,
                difficulty: existingAttempt.difficulty,
                status: existingAttempt.status,
                startedAt: existingAttempt.startedAt,
                timeLimitSeconds: existingAttempt.timeLimitSeconds,
                remainingSeconds,
                answers: existingAttempt.answers,
              },
              questions: sanitizedQuestions,
            },
          });
        }
      } catch (innerErr) {
        return next(innerErr);
      }
    }
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

    const attempt = await AptitudeAttempt.findOne({ _id: id, user: req.user._id });

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Aptitude session not found' });
    }

    // Determine elapsed time
    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
    const remainingSeconds = Math.max(0, attempt.timeLimitSeconds - elapsedSeconds);

    // If time has strictly expired and test was in_progress
    if (remainingSeconds === 0 && attempt.status === 'in_progress') {
      attempt.status = 'expired';
      attempt.submittedAt = new Date();
      await attempt.save();
    }

    let questions = [];
    if (attempt.questionSnapshots && attempt.questionSnapshots.length > 0) {
      questions = attempt.questionSnapshots.map(sanitizeQuestionForSession);
    } else {
      // Legacy fallback for attempts created before snapshots
      const populatedAttempt = await AptitudeAttempt.findById(id).populate({
        path: 'questionIds',
        select: '-correctOption -explanation',
      });
      questions = (populatedAttempt?.questionIds || []).filter(Boolean).map(sanitizeQuestionForSession);
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
        questions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/aptitude/sessions/:id/answers
 * Save a single question answer in progress with version tracking (P0-D).
 */
export const saveAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questionId, selectedOption, version, clientTimestamp } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID supplied' });
    }

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

    // Workstream 1: Server-authoritative timer deadline enforcement
    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
    if (elapsedSeconds >= attempt.timeLimitSeconds) {
      attempt.status = 'expired';
      attempt.submittedAt = new Date();
      await attempt.save();
      return res.status(400).json({
        success: false,
        message: 'Assessment time limit has expired. Answer cannot be saved.',
      });
    }

    // Workstream 2: Question membership and option validation
    const questionSnapshot = (attempt.questionSnapshots || []).find((s) => s.questionId.toString() === questionId);
    const isQInSession =
      Boolean(questionSnapshot) ||
      (attempt.questionIds || []).some((q) => q.toString() === questionId);

    if (!isQInSession) {
      return res.status(400).json({ success: false, message: 'Question does not belong to this session' });
    }

    // Option-based answers must refer to valid options for this question
    let validOption = '';
    if (selectedOption !== undefined && selectedOption !== null && selectedOption !== '') {
      const cleanOpt = String(selectedOption).trim().toUpperCase();
      if (questionSnapshot && Array.isArray(questionSnapshot.options)) {
        const optionExists = questionSnapshot.options.some((o) => (o.key || '').trim().toUpperCase() === cleanOpt);
        if (!optionExists) {
          return res.status(400).json({
            success: false,
            message: `Invalid option '${selectedOption}' for this question. Valid options: ${questionSnapshot.options.map((o) => o.key).join(', ')}`,
          });
        }
      } else if (!['A', 'B', 'C', 'D'].includes(cleanOpt)) {
        return res.status(400).json({
          success: false,
          message: `Invalid option '${selectedOption}'. Valid options are A, B, C, D`,
        });
      }
      validOption = cleanOpt;
    }

    // Update in answers array with version check (P0-D)
    const ansIndex = attempt.answers.findIndex((a) => a.questionId.toString() === questionId);
    let updatedVersion = Number(version) || 1;

    if (ansIndex >= 0) {
      const existingAns = attempt.answers[ansIndex];
      if (typeof version === 'number' && existingAns.version && version < existingAns.version) {
        return res.status(200).json({
          success: true,
          message: 'Stale update ignored; current version retained',
          data: {
            questionId,
            selectedOption: existingAns.selectedOption,
            version: existingAns.version,
          },
        });
      }
      updatedVersion = typeof version === 'number' ? version : (existingAns.version || 0) + 1;
      attempt.answers[ansIndex].selectedOption = validOption;
      attempt.answers[ansIndex].version = updatedVersion;
      attempt.answers[ansIndex].clientTimestamp = clientTimestamp ? new Date(clientTimestamp) : new Date();
    } else {
      attempt.answers.push({
        questionId,
        selectedOption: validOption,
        version: updatedVersion,
        clientTimestamp: clientTimestamp ? new Date(clientTimestamp) : new Date(),
      });
    }

    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Answer saved',
      data: {
        questionId,
        selectedOption: validOption,
        version: updatedVersion,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/aptitude/sessions/:id/submit
 * Server-side score calculation and finalization using question snapshots (P0-B).
 */
export const submitSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    let attempt = await AptitudeAttempt.findOne({ _id: id, user: req.user._id });
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(200).json({
        success: true,
        message: `Session has already been ${attempt.status}`,
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
    }

    // Verify time limit
    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
    // Allow a grace window of 15 seconds for network latency
    const isExpired = elapsedSeconds > (attempt.timeLimitSeconds + 15);

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let totalScore = 0;

    let evaluatedAnswers = [];

    if (attempt.questionSnapshots && attempt.questionSnapshots.length > 0) {
      // Grade against immutable snapshots (P0-B)
      const snapshotMap = new Map();
      attempt.questionSnapshots.forEach((s) => snapshotMap.set(s.questionId.toString(), s));

      evaluatedAnswers = attempt.questionSnapshots.map((snap) => {
        const qStr = snap.questionId.toString();
        const userAns = attempt.answers.find((a) => a.questionId.toString() === qStr);
        const selected = userAns ? userAns.selectedOption : '';

        if (!selected) {
          unansweredCount++;
          return {
            questionId: snap.questionId,
            selectedOption: '',
            version: userAns?.version || 1,
            isCorrect: false,
            marksObtained: 0,
          };
        }

        const isCorrect = snap.correctOption === selected;
        const marks = snap.marks || 1;

        if (isCorrect) {
          correctCount++;
          totalScore += marks;
          return {
            questionId: snap.questionId,
            selectedOption: selected,
            version: userAns?.version || 1,
            isCorrect: true,
            marksObtained: marks,
          };
        } else {
          wrongCount++;
          return {
            questionId: snap.questionId,
            selectedOption: selected,
            version: userAns?.version || 1,
            isCorrect: false,
            marksObtained: 0,
          };
        }
      });
    } else {
      // Legacy fallback for attempts before snapshot feature
      const questions = await AptitudeQuestion.find({ _id: { $in: attempt.questionIds } });
      const questionMap = new Map();
      questions.forEach((q) => questionMap.set(q._id.toString(), q));

      evaluatedAnswers = attempt.questionIds.map((qid) => {
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
    }

    const totalQuestions = attempt.totalQuestions || (attempt.questionSnapshots?.length || attempt.questionIds.length);
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
 * Fetch detailed test results including explanations from snapshots or fallback.
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
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Completed attempt result not found or test is still in progress',
      });
    }

    const answerMap = new Map();
    attempt.answers.forEach((a) => answerMap.set(a.questionId.toString(), a));

    let detailedReview = [];

    if (attempt.questionSnapshots && attempt.questionSnapshots.length > 0) {
      // Use snapshot data reflecting exact presentation shown to student
      detailedReview = attempt.questionSnapshots.map((snap) => {
        const ansObj = answerMap.get(snap.questionId.toString());
        return {
          questionId: snap.questionId,
          question: snap.question,
          options: (snap.options || []).map((o) => ({ key: o.key, text: o.text })),
          category: snap.category,
          topic: snap.topic,
          difficulty: snap.difficulty,
          correctOption: snap.correctOption,
          explanation: snap.explanation,
          marks: snap.marks || 1,
          selectedOption: ansObj ? ansObj.selectedOption : '',
          isCorrect: ansObj ? ansObj.isCorrect : false,
        };
      });
    } else {
      // Legacy fallback
      const populatedAttempt = await AptitudeAttempt.findById(id).populate('questionIds');
      detailedReview = (populatedAttempt?.questionIds || []).filter(Boolean).map((q) => {
        const ansObj = answerMap.get(q._id.toString());
        return {
          questionId: q._id,
          question: q.question || 'Question details unavailable',
          options: q.options || [],
          category: q.category || '',
          topic: q.topic || '',
          difficulty: q.difficulty || '',
          correctOption: q.correctOption || '',
          explanation: q.explanation || '',
          marks: q.marks || 1,
          selectedOption: ansObj ? ansObj.selectedOption : '',
          isCorrect: ansObj ? ansObj.isCorrect : false,
        };
      });
    }

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
 * POST /api/aptitude/sessions/:id/telemetry
 * Record focus-loss or window event non-punitively (P0-E).
 */
export const recordTelemetry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { eventType, metadata } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    const allowedEvents = ['tab_hidden', 'tab_visible', 'window_blur', 'window_focus', 'fullscreen_exit'];
    if (!allowedEvents.includes(eventType)) {
      return res.status(400).json({ success: false, message: 'Invalid telemetry event type' });
    }

    const attempt = await AptitudeAttempt.findOne({ _id: id, user: req.user._id });
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Only record while in progress, and cap at 50 events to prevent spam
    if (attempt.status === 'in_progress' && (attempt.integrityEvents || []).length < 50) {
      attempt.integrityEvents.push({
        eventType,
        timestamp: new Date(),
        metadata: metadata && typeof metadata === 'object' ? metadata : {},
      });
      await attempt.save();
    }

    res.status(200).json({
      success: true,
      message: 'Telemetry event recorded',
      data: {
        eventType,
        totalEvents: attempt.integrityEvents ? attempt.integrityEvents.length : 0,
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
      .select('-questionIds -answers -questionSnapshots')
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

    const [countsByCategory, countsByDifficultyAgg, countsByTopicAndDifficultyAgg] = await Promise.all([
      AptitudeQuestion.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      AptitudeQuestion.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: { category: '$category', difficulty: '$difficulty' }, count: { $sum: 1 } } },
      ]),
      AptitudeQuestion.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: { topic: '$topic', difficulty: '$difficulty' }, count: { $sum: 1 } } },
      ]),
    ]);

    // Format countsByDifficulty as { [category]: { easy: N, medium: N, hard: N } }
    const countsByDifficulty = {};
    countsByDifficultyAgg.forEach((item) => {
      const cat = item._id?.category;
      const diff = (item._id?.difficulty || '').toLowerCase();
      if (cat && diff) {
        if (!countsByDifficulty[cat]) {
          countsByDifficulty[cat] = { easy: 0, medium: 0, hard: 0 };
        }
        countsByDifficulty[cat][diff] = item.count;
      }
    });

    // Format countsByTopicAndDifficulty as { [topic]: { easy: N, medium: N, hard: N } }
    const countsByTopicAndDifficulty = {};
    countsByTopicAndDifficultyAgg.forEach((item) => {
      const top = item._id?.topic;
      const diff = (item._id?.difficulty || '').toLowerCase();
      if (top && diff) {
        if (!countsByTopicAndDifficulty[top]) {
          countsByTopicAndDifficulty[top] = { easy: 0, medium: 0, hard: 0 };
        }
        countsByTopicAndDifficulty[top][diff] = item.count;
      }
    });

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
        countsByDifficulty,
        countsByTopicAndDifficulty,
      },
    });
  } catch (error) {
    next(error);
  }
};
