import mongoose from 'mongoose';
import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import CodingProblem from '../models/CodingProblem.js';
import CodingSubmission from '../models/CodingSubmission.js';
import Company from '../models/Company.js';
import notificationService from '../services/notificationService.js';
import { isCodingEnabled } from '../config/features.js';

/**
 * Build immutable snapshot for an aptitude question in a mock test with shuffled options.
 */
const buildMockAptitudeSnapshot = (q, marks = 1) => {
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
    marks: Number(marks) || Number(q.marks) || 1,
    category: q.category || '',
    topic: q.topic || '',
    difficulty: q.difficulty || 'medium',
  };
};

/**
 * Build immutable snapshot for a coding problem in a mock test.
 * Never stores or leaks hidden test cases.
 */
const buildMockCodingSnapshot = (q, marks = 1) => ({
  questionId: q._id,
  questionType: 'coding',
  title: q.title,
  description: q.description,
  difficulty: q.difficulty,
  examples: q.examples || [],
  constraints: q.constraints || [],
  supportedLanguages: q.supportedLanguages || [],
  starterCode: q.starterCode || {},
  marks: Number(marks) || 1,
});

/**
 * Sanitize question for active mock test session
 * Never expose correctOption, originalKey, explanation, or hidden test cases during active test
 */
const sanitizeMockQuestion = (q, qType) => {
  const type = qType || q.questionType || 'aptitude';
  if (type === 'aptitude') {
    return {
      _id: q.questionId || q._id,
      questionType: 'aptitude',
      question: q.question,
      options: (q.options || []).map((opt) => ({
        key: opt.key,
        text: opt.text,
      })),
      category: q.category,
      topic: q.topic,
      difficulty: q.difficulty,
      marks: q.marks || 1,
    };
  } else {
    return {
      _id: q.questionId || q._id,
      questionType: 'coding',
      title: q.title,
      description: q.description,
      difficulty: q.difficulty,
      examples: q.examples,
      constraints: q.constraints,
      supportedLanguages: q.supportedLanguages,
      starterCode: q.starterCode,
      marks: q.marks || 1,
    };
  }
};

/**
 * Helper to grade and finalize mock test attempt using snapshot or live questions
 */
const evaluateAndFinalizeMockAttempt = async (attempt, isExpired = false) => {
  let test = attempt.mockTest;
  if (!test || !test.questions) {
    const testId = test?._id || test || attempt.mockTest;
    if (testId) {
      test = await MockTest.findById(testId).lean();
    }
  }

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let totalScore = 0;

  if (attempt.questionSnapshots && attempt.questionSnapshots.length > 0) {
    // Grade against immutable snapshots (P0-B)
    const snapMap = new Map();
    attempt.questionSnapshots.forEach((s) => snapMap.set(s.questionId.toString(), s));

    // Grade coding problems if referenced
    const codeSubIds = (attempt.answers || [])
      .filter((a) => a.questionType === 'coding' && a.codeSubmissionId)
      .map((a) => a.codeSubmissionId);
    
    let submissionMap = new Map();
    if (codeSubIds.length > 0) {
      const submissions = await CodingSubmission.find({ _id: { $in: codeSubIds } }).lean();
      submissions.forEach((sub) => submissionMap.set(sub._id.toString(), sub));
    }

    const evaluatedAnswers = (attempt.answers || []).map((ans) => {
      const qStr = ans.questionId ? ans.questionId.toString() : '';
      if (ans.questionType === 'aptitude' || !ans.questionType) {
        const snap = snapMap.get(qStr);
        if (!ans.selectedOption) {
          unansweredCount++;
          return {
            ...(ans.toObject ? ans.toObject() : ans),
            isCorrect: false,
            marksObtained: 0,
          };
        }

        const isCorrect = snap && snap.correctOption === ans.selectedOption;
        const marks = snap?.marks || 1;

        if (isCorrect) {
          correctCount++;
          totalScore += marks;
          return {
            ...(ans.toObject ? ans.toObject() : ans),
            isCorrect: true,
            marksObtained: marks,
          };
        } else {
          wrongCount++;
          return {
            ...(ans.toObject ? ans.toObject() : ans),
            isCorrect: false,
            marksObtained: 0,
          };
        }
      } else if (ans.questionType === 'coding') {
        const snap = snapMap.get(qStr);
        const marks = snap?.marks || 1;
        const sub = ans.codeSubmissionId ? submissionMap.get(ans.codeSubmissionId.toString()) : null;

        if (!ans.codeSubmissionId || !sub) {
          unansweredCount++;
          return {
            ...(ans.toObject ? ans.toObject() : ans),
            isCorrect: false,
            marksObtained: 0,
          };
        }

        // Verified evaluation based on sandbox result status
        const isAccepted = sub.status === 'accepted';
        if (isAccepted) {
          correctCount++;
          totalScore += marks;
          return {
            ...(ans.toObject ? ans.toObject() : ans),
            isCorrect: true,
            marksObtained: marks,
          };
        } else {
          wrongCount++;
          return {
            ...(ans.toObject ? ans.toObject() : ans),
            isCorrect: false,
            marksObtained: 0,
          };
        }
      } else {
        return ans.toObject ? ans.toObject() : ans;
      }
    });

    const totalQuestions = attempt.totalQuestions || attempt.questionSnapshots.length || 1;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    attempt.answers = evaluatedAnswers;
    attempt.correctAnswers = correctCount;
    attempt.wrongAnswers = wrongCount;
    attempt.unanswered = unansweredCount;
    attempt.score = totalScore;
    attempt.percentage = percentage;
    attempt.status = isExpired ? 'expired' : 'submitted';
    attempt.submittedAt = attempt.submittedAt || new Date();

    await attempt.save();
    return attempt;
  }

  // Legacy fallback if no snapshots
  if (!test) return attempt;

  const aptIds = (test.questions || []).filter((q) => q.questionType === 'aptitude').map((q) => q.questionId);
  const aptQuestions = await AptitudeQuestion.find({ _id: { $in: aptIds } }).lean();
  const aptMap = new Map();
  aptQuestions.forEach((q) => aptMap.set(q._id.toString(), q));

  const evaluatedAnswers = (attempt.answers || []).map((ans) => {
    const qStr = ans.questionId ? ans.questionId.toString() : '';
    if (ans.questionType === 'aptitude' || !ans.questionType) {
      const aptQ = aptMap.get(qStr);
      if (!ans.selectedOption) {
        unansweredCount++;
        return {
          ...(ans.toObject ? ans.toObject() : ans),
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
          ...(ans.toObject ? ans.toObject() : ans),
          isCorrect: true,
          marksObtained: marks,
        };
      } else {
        wrongCount++;
        return {
          ...(ans.toObject ? ans.toObject() : ans),
          isCorrect: false,
          marksObtained: 0,
        };
      }
    } else {
      return ans.toObject ? ans.toObject() : ans;
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
  attempt.submittedAt = attempt.submittedAt || new Date();

  await attempt.save();
  return attempt;
};

/**
 * GET /api/mock-tests
 * List all published mock tests with authoritative user attempt status.
 */
export const getMockTests = async (req, res, next) => {
  try {
    const { category = '', difficulty = '', company = '', page = 1, limit = 10 } = req.query;
    const query = { isPublished: true };

    if (category && category !== 'all' && category !== 'undefined' && category !== 'null') {
      query.categories = category;
    }
    if (difficulty && difficulty !== 'all' && difficulty !== 'undefined' && difficulty !== 'null') {
      query.difficulty = difficulty;
    }

    if (company && company !== 'all' && company !== 'undefined' && company !== 'null') {
      if (company === 'generic') {
        query.company = null;
      } else {
        const isMongoId = mongoose.Types.ObjectId.isValid(company);
        const companyDoc = await Company.findOne({
          $or: [
            ...(isMongoId ? [{ _id: company }] : []),
            { slug: company.toLowerCase().trim() },
          ],
          isActive: true,
        }).select('_id');

        if (companyDoc) {
          query.company = companyDoc._id;
        } else {
          // If requested company is inactive or not found, return empty set safely
          query.company = new mongoose.Types.ObjectId();
        }
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await MockTest.countDocuments(query);
    const rawTests = await MockTest.find(query)
      .select('title description durationMinutes totalQuestions categories difficulty instructions createdAt questions company')
      .populate('company', 'name slug logoUrl isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Look up latest user attempts for these mock tests to provide authoritative status
    const testIds = rawTests.map((t) => t._id);
    const userAttempts = await MockTestAttempt.find({
      user: req.user._id,
      mockTest: { $in: testIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    const now = Date.now();
    const latestAttemptByTest = new Map();

    for (const att of userAttempts) {
      const testIdStr = att.mockTest.toString();
      if (!latestAttemptByTest.has(testIdStr)) {
        // Check if in_progress attempt has expired
        if (att.status === 'in_progress' && att.timeLimitSeconds) {
          const elapsed = (now - new Date(att.startedAt).getTime()) / 1000;
          if (elapsed > att.timeLimitSeconds + 15) {
            const fullAttempt = await MockTestAttempt.findById(att._id).populate('mockTest');
            if (fullAttempt && fullAttempt.status === 'in_progress') {
              await evaluateAndFinalizeMockAttempt(fullAttempt, true);
              att.status = 'expired';
              att.score = fullAttempt.score;
              att.percentage = fullAttempt.percentage;
              att.correctAnswers = fullAttempt.correctAnswers;
              att.wrongAnswers = fullAttempt.wrongAnswers;
              att.unanswered = fullAttempt.unanswered;
            }
          }
        }
        latestAttemptByTest.set(testIdStr, att);
      }
    }

    const mockTests = rawTests.map((t) => {
      const testIdStr = t._id.toString();
      const latest = latestAttemptByTest.get(testIdStr);
      const trueTotalQuestions = (t.questions && t.questions.length > 0) ? t.questions.length : (t.totalQuestions || 0);

      let userAttempt = null;
      if (latest) {
        const elapsed = Math.floor((now - new Date(latest.startedAt).getTime()) / 1000);
        const remainingSeconds = latest.timeLimitSeconds ? Math.max(0, latest.timeLimitSeconds - elapsed) : 0;
        userAttempt = {
          _id: latest._id,
          status: latest.status, // 'in_progress', 'submitted', 'expired'
          score: latest.score || 0,
          percentage: latest.percentage || 0,
          correctAnswers: latest.correctAnswers || 0,
          totalQuestions: latest.totalQuestions || trueTotalQuestions,
          submittedAt: latest.submittedAt || null,
          remainingSeconds,
        };
      }

      return {
        _id: t._id,
        title: t.title,
        description: t.description,
        durationMinutes: t.durationMinutes,
        totalQuestions: trueTotalQuestions,
        categories: t.categories,
        difficulty: t.difficulty,
        instructions: t.instructions,
        company: (t.company && t.company.isActive) ? {
          _id: t.company._id,
          name: t.company.name,
          slug: t.company.slug,
          logoUrl: t.company.logoUrl,
        } : null,
        createdAt: t.createdAt,
        userAttempt,
      };
    });

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
 * Retrieve mock test details before starting, including user attempt status.
 */
export const getMockTestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid test ID' });
    }

    const test = await MockTest.findOne({ _id: id, isPublished: true })
      .select('title description durationMinutes totalQuestions categories difficulty instructions createdAt questions company')
      .populate('company', 'name slug logoUrl isActive');

    if (!test) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }

    const trueTotalQuestions = (test.questions && test.questions.length > 0) ? test.questions.length : (test.totalQuestions || 0);

    // Check user's latest attempt for this test
    const latest = await MockTestAttempt.findOne({
      user: req.user._id,
      mockTest: test._id,
    })
      .sort({ createdAt: -1 });

    let userAttempt = null;
    if (latest) {
      const now = Date.now();
      if (latest.status === 'in_progress' && latest.timeLimitSeconds) {
        const elapsed = (now - new Date(latest.startedAt).getTime()) / 1000;
        if (elapsed > latest.timeLimitSeconds + 15) {
          latest.mockTest = test;
          await evaluateAndFinalizeMockAttempt(latest, true);
        }
      }

      const elapsed = Math.floor((now - new Date(latest.startedAt).getTime()) / 1000);
      const remainingSeconds = latest.timeLimitSeconds ? Math.max(0, latest.timeLimitSeconds - elapsed) : 0;
      userAttempt = {
        _id: latest._id,
        status: latest.status,
        score: latest.score || 0,
        percentage: latest.percentage || 0,
        correctAnswers: latest.correctAnswers || 0,
        totalQuestions: latest.totalQuestions || trueTotalQuestions,
        submittedAt: latest.submittedAt,
        remainingSeconds,
      };
    }

    res.status(200).json({
      success: true,
      data: {
        test: {
          _id: test._id,
          title: test.title,
          description: test.description,
          durationMinutes: test.durationMinutes,
          totalQuestions: trueTotalQuestions,
          categories: test.categories,
          difficulty: test.difficulty,
          instructions: test.instructions,
          company: (test.company && test.company.isActive) ? {
            _id: test.company._id,
            name: test.company.name,
            slug: test.company.slug,
            logoUrl: test.company.logoUrl,
          } : null,
          createdAt: test.createdAt,
        },
        userAttempt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/mock-tests/:id/start
 * Start or resume a mock test attempt with server-side timer.
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
      AptitudeQuestion.find({ _id: { $in: aptIds } }).lean(),
      CodingProblem.find({ _id: { $in: codeIds } }).lean(),
    ]);

    const qMap = new Map();
    aptQuestions.forEach((q) => qMap.set(q._id.toString(), { ...q, questionType: 'aptitude' }));
    codingQuestions.forEach((q) => qMap.set(q._id.toString(), { ...q, questionType: 'coding' }));

    const questionSnapshots = [];
    const resolvedQuestions = [];
    const initialAnswers = [];

    test.questions.forEach((tq) => {
      const qData = qMap.get(tq.questionId.toString());
      if (qData) {
        if (tq.questionType === 'aptitude') {
          const snap = buildMockAptitudeSnapshot(qData, tq.marks || 1);
          questionSnapshots.push(snap);
          resolvedQuestions.push(sanitizeMockQuestion(snap, 'aptitude'));
        } else {
          const snap = buildMockCodingSnapshot(qData, tq.marks || 1);
          questionSnapshots.push(snap);
          resolvedQuestions.push(sanitizeMockQuestion(snap, 'coding'));
        }

        initialAnswers.push({
          questionId: tq.questionId,
          questionType: tq.questionType,
          selectedOption: '',
          version: 1,
          clientTimestamp: null,
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

    // Check if user already has an in-progress attempt for this mock test
    const existingAttempt = await MockTestAttempt.findOne({
      user: req.user._id,
      mockTest: test._id,
      status: 'in_progress',
    }).sort({ createdAt: -1 });

    if (existingAttempt) {
      const elapsed = Math.floor((Date.now() - new Date(existingAttempt.startedAt).getTime()) / 1000);
      const remaining = Math.max(0, existingAttempt.timeLimitSeconds - elapsed);

      if (remaining > 0) {
        // Attempt is genuinely active and within time limit — resume it!
        let activeQuestions = resolvedQuestions;
        if (existingAttempt.questionSnapshots && existingAttempt.questionSnapshots.length > 0) {
          activeQuestions = existingAttempt.questionSnapshots.map((s) => sanitizeMockQuestion(s, s.questionType));
        }

        return res.status(200).json({
          success: true,
          message: 'Active test attempt resumed',
          data: {
            attemptId: existingAttempt._id,
            test: {
              _id: test._id,
              title: test.title,
              description: test.description,
              durationMinutes: test.durationMinutes,
              timeLimitSeconds: existingAttempt.timeLimitSeconds,
              remainingSeconds: remaining,
              totalQuestions: existingAttempt.totalQuestions,
            },
            attempt: {
              _id: existingAttempt._id,
              status: existingAttempt.status,
              startedAt: existingAttempt.startedAt,
              answers: existingAttempt.answers,
            },
            questions: activeQuestions,
          },
        });
      } else {
        // Stale attempt expired — finalize it as expired now!
        existingAttempt.mockTest = test;
        await evaluateAndFinalizeMockAttempt(existingAttempt, true);
      }
    }

    const timeLimitSeconds = (test.durationMinutes || 30) * 60;

    const attempt = await MockTestAttempt.create({
      user: req.user._id,
      mockTest: test._id,
      questionSnapshots,
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
    if (error.code === 11000) {
      try {
        const existingAttempt = await MockTestAttempt.findOne({
          user: req.user._id,
          mockTest: req.params.id,
          status: 'in_progress',
        }).sort({ createdAt: -1 });

        if (existingAttempt) {
          const elapsed = Math.floor((Date.now() - new Date(existingAttempt.startedAt).getTime()) / 1000);
          const remaining = Math.max(0, existingAttempt.timeLimitSeconds - elapsed);
          const activeQuestions = (existingAttempt.questionSnapshots || []).map((s) => sanitizeMockQuestion(s, s.questionType));

          return res.status(200).json({
            success: true,
            message: 'Active test attempt resumed',
            data: {
              attemptId: existingAttempt._id,
              test: {
                _id: req.params.id,
                timeLimitSeconds: existingAttempt.timeLimitSeconds,
                remainingSeconds: remaining,
                totalQuestions: existingAttempt.totalQuestions,
              },
              attempt: {
                _id: existingAttempt._id,
                status: existingAttempt.status,
                startedAt: existingAttempt.startedAt,
                answers: existingAttempt.answers,
              },
              questions: activeQuestions,
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
      await evaluateAndFinalizeMockAttempt(attempt, true);
    }

    const test = attempt.mockTest;
    let questions = [];

    if (attempt.questionSnapshots && attempt.questionSnapshots.length > 0) {
      questions = attempt.questionSnapshots.map((s) => sanitizeMockQuestion(s, s.questionType));
    } else {
      // Legacy fallback
      const aptIds = (test?.questions || []).filter((q) => q.questionType === 'aptitude').map((q) => q.questionId);
      const codeIds = (test?.questions || []).filter((q) => q.questionType === 'coding').map((q) => q.questionId);

      const [aptQuestions, codingQuestions] = await Promise.all([
        AptitudeQuestion.find({ _id: { $in: aptIds } }).lean(),
        CodingProblem.find({ _id: { $in: codeIds } }).lean(),
      ]);

      const qMap = new Map();
      aptQuestions.forEach((q) => qMap.set(q._id.toString(), { ...q, questionType: 'aptitude' }));
      codingQuestions.forEach((q) => qMap.set(q._id.toString(), { ...q, questionType: 'coding' }));

      (test?.questions || []).forEach((tq) => {
        const qData = qMap.get(tq.questionId.toString());
        if (qData) {
          questions.push(sanitizeMockQuestion(qData, tq.questionType));
        }
      });
    }

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
          _id: test?._id,
          title: test?.title || 'Mock Test',
          description: test?.description || '',
          durationMinutes: test?.durationMinutes || 30,
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
 * Save in-progress answer for a mock test with versioning (P0-D).
 */
export const saveAttemptAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questionId, selectedOption, codeSubmissionId, version, clientTimestamp } = req.body;

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

    // Workstream 1: Server-authoritative timer deadline enforcement
    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
    if (elapsedSeconds >= attempt.timeLimitSeconds) {
      attempt.status = 'expired';
      attempt.submittedAt = new Date();
      await attempt.save();
      return res.status(400).json({
        success: false,
        message: 'Mock test time limit has expired. Answer cannot be saved.',
      });
    }

    // Workstream 2: Question membership and option validation
    const questionSnapshot = (attempt.questionSnapshots || []).find((s) => s.questionId.toString() === questionId);
    let questionType = questionSnapshot?.questionType || 'aptitude';

    if (!questionSnapshot) {
      // Fallback check against test.questions definition
      const test = await MockTest.findById(attempt.mockTest).lean();
      const testQ = (test?.questions || []).find((q) => q.questionId.toString() === questionId);
      if (!testQ) {
        return res.status(400).json({
          success: false,
          message: 'Question does not belong to this mock test assessment',
        });
      }
      questionType = testQ.questionType || 'aptitude';
    }

    // Validate option for aptitude questions
    let cleanSelectedOption = selectedOption;
    if (questionType === 'aptitude' && selectedOption !== undefined && selectedOption !== null && selectedOption !== '') {
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
      cleanSelectedOption = cleanOpt;
    }

    // Validate codeSubmissionId if provided
    if (codeSubmissionId !== undefined && codeSubmissionId !== null && codeSubmissionId !== '') {
      if (!mongoose.Types.ObjectId.isValid(codeSubmissionId)) {
        return res.status(400).json({ success: false, message: 'Invalid code submission ID format' });
      }
      const submissionExists = await CodingSubmission.exists({
        _id: codeSubmissionId,
        user: req.user._id,
        problem: questionId,
      });
      if (!submissionExists) {
        return res.status(400).json({
          success: false,
          message: 'Referenced code submission does not exist or does not belong to this student for this problem',
        });
      }
    }

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
      if (cleanSelectedOption !== undefined) attempt.answers[ansIndex].selectedOption = cleanSelectedOption;
      if (codeSubmissionId !== undefined) attempt.answers[ansIndex].codeSubmissionId = codeSubmissionId;
      attempt.answers[ansIndex].version = updatedVersion;
      attempt.answers[ansIndex].clientTimestamp = clientTimestamp ? new Date(clientTimestamp) : new Date();
    } else {
      attempt.answers.push({
        questionId,
        selectedOption: cleanSelectedOption || '',
        codeSubmissionId: codeSubmissionId || null,
        version: updatedVersion,
        clientTimestamp: clientTimestamp ? new Date(clientTimestamp) : new Date(),
      });
    }

    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Mock test answer saved',
      data: {
        questionId,
        selectedOption: cleanSelectedOption,
        codeSubmissionId,
        version: updatedVersion,
      },
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
      // Return 200 with current state to prevent double-submit or auto-submit race errors
      return res.status(200).json({
        success: true,
        message: `Attempt has already been ${attempt.status}`,
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

    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
    const isExpired = elapsedSeconds > (attempt.timeLimitSeconds + 15);

    await evaluateAndFinalizeMockAttempt(attempt, isExpired);

    // Generate completion notification for student
    await notificationService.createNotification({
      recipient: attempt.user,
      type: 'mock_test_completed',
      title: 'Mock Test Completed',
      message: `Your mock test result for "${attempt.mockTest?.title || 'Mock Assessment'}" is ready. Score: ${attempt.percentage}%`,
      link: `/mock-tests/result/${attempt._id}`,
      metadata: { entityId: attempt._id.toString() },
    });

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
    }).populate('mockTest');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Completed attempt result not found',
      });
    }

    // If attempt is in_progress but timer has passed, finalize as expired now
    if (attempt.status === 'in_progress') {
      const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
      if (elapsedSeconds >= attempt.timeLimitSeconds) {
        await evaluateAndFinalizeMockAttempt(attempt, true);
      } else {
        return res.status(400).json({
          success: false,
          message: 'This test is still in progress.',
        });
      }
    }

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Completed attempt result not found or test is still in progress',
      });
    }

    const test = attempt.mockTest || {};
    const ansMap = new Map();
    attempt.answers.forEach((a) => ansMap.set(a.questionId.toString(), a));

    let review = [];

    if (attempt.questionSnapshots && attempt.questionSnapshots.length > 0) {
      // Use snapshot data with presentation order that student saw
      review = attempt.questionSnapshots.map((snap) => {
        const qStr = snap.questionId.toString();
        const userAns = ansMap.get(qStr);

        if (snap.questionType === 'aptitude') {
          return {
            questionId: snap.questionId,
            questionType: 'aptitude',
            question: snap.question,
            options: (snap.options || []).map((o) => ({ key: o.key, text: o.text })),
            category: snap.category,
            topic: snap.topic,
            difficulty: snap.difficulty,
            correctOption: snap.correctOption,
            explanation: snap.explanation,
            marks: snap.marks || 1,
            selectedOption: userAns ? userAns.selectedOption : '',
            isCorrect: userAns ? userAns.isCorrect : false,
          };
        } else {
          return {
            questionId: snap.questionId,
            questionType: 'coding',
            title: snap.title,
            description: snap.description,
            difficulty: snap.difficulty,
            marks: snap.marks || 1,
            selectedOption: '',
            isCorrect: userAns ? userAns.isCorrect : false,
            codeSubmissionId: userAns ? userAns.codeSubmissionId : null,
          };
        }
      });
    } else {
      // Legacy fallback
      const aptIds = (test.questions || []).filter((q) => q.questionType === 'aptitude').map((q) => q.questionId);
      const aptQuestions = await AptitudeQuestion.find({ _id: { $in: aptIds } }).lean();
      const aptMap = new Map();
      aptQuestions.forEach((q) => aptMap.set(q._id.toString(), q));

      review = (test.questions || []).map((tq) => {
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
    }

    res.status(200).json({
      success: true,
      data: {
        summary: {
          _id: attempt._id,
          testTitle: test.title || 'Mock Test Assessment',
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
 * POST /api/mock-tests/attempts/:id/telemetry
 * Record focus-loss or window event non-punitively (P0-E).
 */
export const recordMockTestTelemetry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { eventType, metadata } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid attempt ID' });
    }

    const allowedEvents = ['tab_hidden', 'tab_visible', 'window_blur', 'window_focus', 'fullscreen_exit'];
    if (!allowedEvents.includes(eventType)) {
      return res.status(400).json({ success: false, message: 'Invalid telemetry event type' });
    }

    const attempt = await MockTestAttempt.findOne({ _id: id, user: req.user._id });
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

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
      .select('-answers -questionSnapshots')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Check for expired in-progress attempts and finalize them
    const now = Date.now();
    for (const att of attempts) {
      if (att.status === 'in_progress' && att.timeLimitSeconds) {
        const elapsed = (now - new Date(att.startedAt).getTime()) / 1000;
        if (elapsed > att.timeLimitSeconds + 15) {
          const fullAttempt = await MockTestAttempt.findById(att._id).populate('mockTest');
          if (fullAttempt && fullAttempt.status === 'in_progress') {
            await evaluateAndFinalizeMockAttempt(fullAttempt, true);
            att.status = 'expired';
            att.score = fullAttempt.score;
            att.percentage = fullAttempt.percentage;
            att.correctAnswers = fullAttempt.correctAnswers;
            att.wrongAnswers = fullAttempt.wrongAnswers;
            att.unanswered = fullAttempt.unanswered;
          }
        }
      }
      delete att.answers;
      delete att.questionSnapshots;
    }

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
