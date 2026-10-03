import mongoose from 'mongoose';
import CodingProblem from '../models/CodingProblem.js';
import CodingSubmission from '../models/CodingSubmission.js';
import codeExecutionService from '../services/codeExecutionService.js';

/**
 * Sanitize coding problem for student API
 * NEVER leak hidden test cases or solution explanation to students during practice
 */
const sanitizeProblemForStudent = (problem) => {
  const p = problem.toObject ? problem.toObject() : { ...problem };
  // Only expose public/sample test cases if needed, never hidden ones
  if (p.testCases) {
    p.testCases = p.testCases.filter((tc) => !tc.isHidden);
  }
  delete p.solutionExplanation;
  return p;
};

/**
 * GET /api/coding/problems
 * List active coding problems with search and filters.
 */
export const getProblems = async (req, res, next) => {
  try {
    const { search = '', difficulty = '', topic = '', category = '', page = 1, limit = 12 } = req.query;

    const query = { isActive: true };

    const cleanSearch = (search && search !== 'undefined' && search !== 'null') ? search.trim() : '';
    if (cleanSearch) {
      query.$or = [
        { title: { $regex: cleanSearch, $options: 'i' } },
        { topics: { $regex: cleanSearch, $options: 'i' } },
      ];
    }
    if (difficulty && difficulty !== 'all' && difficulty !== 'undefined' && difficulty !== 'null') {
      query.difficulty = difficulty.toLowerCase();
    }
    if (topic && topic !== 'all' && topic !== 'undefined' && topic !== 'null') {
      query.topics = topic;
    }
    if (category && category !== 'all' && category !== 'undefined' && category !== 'null') {
      query.category = category;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const total = await CodingProblem.countDocuments(query);
    const rawProblems = await CodingProblem.find(query)
      .select('title slug difficulty category topics companies createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        problems: rawProblems,
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
 * GET /api/coding/problems/:id
 * Retrieve problem details with examples & starter code (no hidden test cases).
 */
export const getProblemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let problem;

    if (mongoose.Types.ObjectId.isValid(id)) {
      problem = await CodingProblem.findOne({ _id: id, isActive: true });
    } else {
      problem = await CodingProblem.findOne({ slug: id, isActive: true });
    }

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Coding problem not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        problem: sanitizeProblemForStudent(problem),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/coding/problems/:id/submit
 * Submit code for a problem.
 */
export const submitProblem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { language, code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Source code cannot be empty' });
    }
    if (!language || !['javascript', 'python', 'java', 'cpp'].includes(language.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid language specified. Supported languages: javascript, python, java, cpp',
      });
    }

    const problem = await CodingProblem.findOne({ _id: id, isActive: true });
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    // Call execution service abstraction
    const execResult = await codeExecutionService.executeCode({
      language,
      code,
      testCases: problem.testCases || [],
    });

    const submission = await CodingSubmission.create({
      user: req.user._id,
      problem: problem._id,
      language: language.toLowerCase(),
      code,
      status: execResult.status,
      passedTests: execResult.passedTests,
      totalTests: execResult.totalTests || (problem.testCases ? problem.testCases.length : 0),
      runtime: execResult.runtime || 0,
      memory: execResult.memory || 0,
      executionMessage: execResult.message || '',
    });

    res.status(201).json({
      success: true,
      message: execResult.message || 'Submission recorded',
      data: {
        submission: {
          _id: submission._id,
          status: submission.status,
          language: submission.language,
          passedTests: submission.passedTests,
          totalTests: submission.totalTests,
          runtime: submission.runtime,
          memory: submission.memory,
          executionMessage: submission.executionMessage,
          submittedAt: submission.submittedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/coding/submissions
 * Get student's past coding submissions.
 */
export const getSubmissions = async (req, res, next) => {
  try {
    const { problemId, page = 1, limit = 10 } = req.query;
    const query = { user: req.user._id };

    if (problemId && mongoose.Types.ObjectId.isValid(problemId)) {
      query.problem = problemId;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await CodingSubmission.countDocuments(query);
    const submissions = await CodingSubmission.find(query)
      .populate('problem', 'title slug difficulty')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        submissions,
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
 * GET /api/coding/submissions/:id
 * Single submission detail (ownership protected).
 */
export const getSubmissionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid submission ID' });
    }

    const submission = await CodingSubmission.findOne({
      _id: id,
      user: req.user._id,
    }).populate('problem', 'title slug difficulty');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    res.status(200).json({
      success: true,
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
};
