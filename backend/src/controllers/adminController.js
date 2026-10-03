import mongoose from 'mongoose';
import User from '../models/User.js';
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import CodingProblem from '../models/CodingProblem.js';
import CodingSubmission from '../models/CodingSubmission.js';
import Company from '../models/Company.js';
import StudyMaterial from '../models/StudyMaterial.js';
import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import Review from '../models/Review.js';

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/dashboard
 * Aggregates real platform statistics from MongoDB.
 */
export const getAdminDashboardStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      activeStudents,
      totalQuestions,
      activeQuestions,
      totalAptAttempts,
      totalCodingProblems,
      totalCodingSubmissions,
      totalCompanies,
      totalResources,
      totalMockTests,
      totalMockAttempts,
      totalReviews,
      recentUsers,
      recentQuestions,
      recentAttempts,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', isActive: true }),
      AptitudeQuestion.countDocuments(),
      AptitudeQuestion.countDocuments({ isActive: true }),
      AptitudeAttempt.countDocuments(),
      CodingProblem.countDocuments(),
      CodingSubmission.countDocuments(),
      Company.countDocuments(),
      StudyMaterial.countDocuments(),
      MockTest.countDocuments(),
      MockTestAttempt.countDocuments(),
      Review.countDocuments(),
      User.find({ role: 'student' })
        .select('firstName lastName email college createdAt isActive')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      AptitudeQuestion.find()
        .select('question category topic difficulty createdAt isActive')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      AptitudeAttempt.find()
        .populate('user', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const activityList = [];

    recentUsers.forEach((u) => {
      activityList.push({
        type: 'user_registration',
        title: `Student Registered: ${u.firstName} ${u.lastName}`,
        subtitle: u.college || u.email,
        timestamp: u.createdAt,
        status: u.isActive ? 'active' : 'inactive',
      });
    });

    recentQuestions.forEach((q) => {
      activityList.push({
        type: 'question_created',
        title: `Aptitude Question Added: ${q.topic}`,
        subtitle: `${q.category} • ${q.difficulty}`,
        timestamp: q.createdAt,
        status: q.isActive ? 'active' : 'inactive',
      });
    });

    recentAttempts.forEach((a) => {
      activityList.push({
        type: 'aptitude_attempt',
        title: `Test Completed by ${a.user ? a.user.firstName : 'Student'}`,
        subtitle: `Score: ${a.percentage || 0}% • ${a.category || 'Aptitude'}`,
        timestamp: a.submittedAt || a.createdAt,
        status: a.status,
      });
    });

    activityList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      data: {
        students: {
          total: totalStudents,
          active: activeStudents,
          inactive: totalStudents - activeStudents,
        },
        aptitude: {
          questions: totalQuestions,
          active: activeQuestions,
          attempts: totalAptAttempts,
        },
        coding: {
          problems: totalCodingProblems,
          submissions: totalCodingSubmissions,
        },
        companies: {
          total: totalCompanies,
        },
        resources: {
          total: totalResources,
        },
        mockTests: {
          total: totalMockTests,
          attempts: totalMockAttempts,
        },
        reviews: {
          total: totalReviews,
        },
        activity: activityList.slice(0, 8),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── STUDENT MANAGEMENT ────────────────────────────────────────────────────────

export const getStudents = async (req, res, next) => {
  try {
    const { search = '', status = 'all', page = 1, limit = 10 } = req.query;
    const query = { role: 'student' };

    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;

    if (search.trim()) {
      const s = search.trim();
      query.$or = [
        { firstName: { $regex: s, $options: 'i' } },
        { lastName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { college: { $regex: s, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const students = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        students,
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

export const getStudentById = async (req, res, next) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' }).select('-password');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.status(200).json({ success: true, data: { student } });
  } catch (error) {
    next(error);
  }
};

export const updateStudentStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive boolean flag is required' });
    }

    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      { $set: { isActive } },
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      message: `Student account ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { student },
    });
  } catch (error) {
    next(error);
  }
};

// ─── APTITUDE MANAGEMENT ───────────────────────────────────────────────────────

export const getAdminAptitudeQuestions = async (req, res, next) => {
  try {
    const { search = '', category = '', difficulty = '', status = 'all', page = 1, limit = 10 } = req.query;
    const query = {};

    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;

    if (category && category !== 'all') query.category = category;
    if (difficulty && difficulty !== 'all') query.difficulty = difficulty.toLowerCase();

    if (search.trim()) {
      const s = search.trim();
      query.$or = [
        { question: { $regex: s, $options: 'i' } },
        { topic: { $regex: s, $options: 'i' } },
        { tags: { $regex: s, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await AptitudeQuestion.countDocuments(query);
    const questions = await AptitudeQuestion.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        questions,
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

export const createAptitudeQuestion = async (req, res, next) => {
  try {
    const { question, options, correctOption, category, topic, difficulty, explanation, tags, marks, isActive } = req.body;

    if (!question || !options || !correctOption || !category || !topic || !explanation) {
      return res.status(400).json({ success: false, message: 'All required question fields must be provided' });
    }

    if (Array.isArray(options)) {
      const texts = options.map(o => (o.text || '').trim().toLowerCase());
      if (new Set(texts).size < options.length) {
        return res.status(400).json({ success: false, message: 'All option choices must be mutually distinct' });
      }
    }

    const newQuestion = await AptitudeQuestion.create({
      question: question.trim(),
      options,
      correctOption: correctOption.toUpperCase(),
      category: category.trim(),
      topic: topic.trim(),
      difficulty: difficulty ? difficulty.toLowerCase() : 'medium',
      explanation: explanation.trim(),
      tags: Array.isArray(tags) ? tags : [],
      marks: Number(marks) || 1,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Aptitude question created successfully',
      data: { question: newQuestion },
    });
  } catch (error) {
    next(error);
  }
};

export const getAptitudeQuestionById = async (req, res, next) => {
  try {
    const question = await AptitudeQuestion.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.status(200).json({ success: true, data: { question } });
  } catch (error) {
    next(error);
  }
};

export const updateAptitudeQuestion = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.createdBy;

    const updated = await AptitudeQuestion.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      data: { question: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAptitudeQuestionStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive boolean is required' });
    }

    const updated = await AptitudeQuestion.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive } },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.status(200).json({
      success: true,
      message: `Question ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { question: updated },
    });
  } catch (error) {
    next(error);
  }
};

// ─── CODING MANAGEMENT (PHASE 8) ──────────────────────────────────────────────

export const getAdminCodingProblems = async (req, res, next) => {
  try {
    const { search = '', difficulty = '', status = 'all', page = 1, limit = 10 } = req.query;
    const query = {};

    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;

    if (difficulty && difficulty !== 'all') query.difficulty = difficulty;
    if (search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { topics: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await CodingProblem.countDocuments(query);
    const problems = await CodingProblem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        problems,
        pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) || 1 },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCodingProblem = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      description,
      difficulty,
      category,
      topics,
      constraints,
      inputFormat,
      outputFormat,
      examples,
      starterCode,
      solutionExplanation,
      testCases,
      supportedLanguages,
      companies,
      isActive,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Problem title and description are required' });
    }

    const finalSlug = (slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const problem = await CodingProblem.create({
      title: title.trim(),
      slug: finalSlug,
      description: description.trim(),
      difficulty: difficulty || 'medium',
      category: category || 'Core Algorithms',
      topics: Array.isArray(topics) ? topics : [],
      constraints: Array.isArray(constraints) ? constraints : [],
      inputFormat: inputFormat || '',
      outputFormat: outputFormat || '',
      examples: Array.isArray(examples) ? examples : [],
      starterCode: starterCode || undefined,
      solutionExplanation: solutionExplanation || '',
      testCases: Array.isArray(testCases) ? testCases : [],
      supportedLanguages: Array.isArray(supportedLanguages) ? supportedLanguages : ['javascript', 'python', 'java', 'cpp'],
      companies: Array.isArray(companies) ? companies : [],
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Coding problem created successfully',
      data: { problem },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminCodingProblemById = async (req, res, next) => {
  try {
    const problem = await CodingProblem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Coding problem not found' });
    }
    res.status(200).json({ success: true, data: { problem } });
  } catch (error) {
    next(error);
  }
};

export const updateCodingProblem = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.createdBy;

    const problem = await CodingProblem.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Coding problem not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Coding problem updated successfully',
      data: { problem },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCodingProblemStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive boolean flag is required' });
    }

    const problem = await CodingProblem.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive } },
      { returnDocument: 'after' }
    );

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Coding problem not found' });
    }

    res.status(200).json({
      success: true,
      message: `Problem ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { problem },
    });
  } catch (error) {
    next(error);
  }
};

// ─── COMPANY MANAGEMENT (PHASE 9) ─────────────────────────────────────────────

export const getAdminCompanies = async (req, res, next) => {
  try {
    const { search = '', status = 'all', page = 1, limit = 10 } = req.query;
    const query = {};

    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { industry: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Company.countDocuments(query);
    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        companies,
        pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) || 1 },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCompany = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      logoUrl,
      description,
      industry,
      website,
      careersUrl,
      roles,
      eligibility,
      selectionProcess,
      aptitudeTopics,
      codingTopics,
      interviewTopics,
      resources,
      isActive,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    const finalSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const company = await Company.create({
      name: name.trim(),
      slug: finalSlug,
      logoUrl: logoUrl || '',
      description: description || '',
      industry: industry || 'Technology',
      website: website || '',
      careersUrl: careersUrl || '',
      roles: Array.isArray(roles) ? roles : [],
      eligibility: eligibility || 'BE / B.Tech / MCA',
      selectionProcess: Array.isArray(selectionProcess) ? selectionProcess : [],
      aptitudeTopics: Array.isArray(aptitudeTopics) ? aptitudeTopics : [],
      codingTopics: Array.isArray(codingTopics) ? codingTopics : [],
      interviewTopics: Array.isArray(interviewTopics) ? interviewTopics : [],
      resources: Array.isArray(resources) ? resources : [],
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Company profile created successfully',
      data: { company },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminCompanyById = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.status(200).json({ success: true, data: { company } });
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.createdBy;

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Company profile updated',
      data: { company },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCompanyStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive boolean flag is required' });
    }

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive } },
      { returnDocument: 'after' }
    );

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.status(200).json({
      success: true,
      message: `Company ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { company },
    });
  } catch (error) {
    next(error);
  }
};

// ─── STUDY RESOURCE MANAGEMENT (PHASE 10) ─────────────────────────────────────

export const getAdminResources = async (req, res, next) => {
  try {
    const { search = '', type = '', status = 'all', page = 1, limit = 10 } = req.query;
    const query = {};

    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;

    if (type && type !== 'all') query.type = type;
    if (search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { topic: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await StudyMaterial.countDocuments(query);
    const resources = await StudyMaterial.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        resources,
        pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) || 1 },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createResource = async (req, res, next) => {
  try {
    const { title, description, type, category, topic, url, fileUrl, thumbnailUrl, isActive } = req.body;

    if (!title || !type || !category || !topic || !url) {
      return res.status(400).json({ success: false, message: 'Title, type, category, topic, and URL are required' });
    }

    const resource = await StudyMaterial.create({
      title: title.trim(),
      description: (description || '').trim(),
      type,
      category: category.trim(),
      topic: topic.trim(),
      url: url.trim(),
      fileUrl: fileUrl || '',
      thumbnailUrl: thumbnailUrl || '',
      isActive: isActive !== undefined ? isActive : true,
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: { resource },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminResourceById = async (req, res, next) => {
  try {
    const resource = await StudyMaterial.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }
    res.status(200).json({ success: true, data: { resource } });
  } catch (error) {
    next(error);
  }
};

export const updateResource = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.uploadedBy;

    const resource = await StudyMaterial.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      data: { resource },
    });
  } catch (error) {
    next(error);
  }
};

export const updateResourceStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive boolean is required' });
    }

    const resource = await StudyMaterial.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive } },
      { returnDocument: 'after' }
    );

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    res.status(200).json({
      success: true,
      message: `Resource ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { resource },
    });
  } catch (error) {
    next(error);
  }
};

// ─── MOCK TEST MANAGEMENT (PHASE 11) ──────────────────────────────────────────

export const getAdminMockTests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await MockTest.countDocuments();
    const mockTests = await MockTest.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        mockTests,
        pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) || 1 },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createMockTest = async (req, res, next) => {
  try {
    const { title, description, durationMinutes, categories, difficulty, instructions, questions, isPublished } = req.body;

    if (!title || !durationMinutes) {
      return res.status(400).json({ success: false, message: 'Title and duration in minutes are required' });
    }

    const test = await MockTest.create({
      title: title.trim(),
      description: description || '',
      durationMinutes: Number(durationMinutes),
      categories: Array.isArray(categories) ? categories : ['General Aptitude'],
      difficulty: difficulty || 'medium',
      instructions: instructions || 'Read carefully and submit within time limit.',
      questions: Array.isArray(questions) ? questions : [],
      totalQuestions: Array.isArray(questions) ? questions.length : 0,
      isPublished: isPublished !== undefined ? isPublished : true,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Mock test created successfully',
      data: { mockTest: test },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminMockTestById = async (req, res, next) => {
  try {
    const mockTest = await MockTest.findById(req.params.id);
    if (!mockTest) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }
    res.status(200).json({ success: true, data: { mockTest } });
  } catch (error) {
    next(error);
  }
};

export const updateMockTest = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.createdBy;

    if (updates.questions && Array.isArray(updates.questions)) {
      updates.totalQuestions = updates.questions.length;
    }

    const mockTest = await MockTest.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!mockTest) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Mock test updated successfully',
      data: { mockTest },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMockTestStatus = async (req, res, next) => {
  try {
    const { isPublished } = req.body;
    if (typeof isPublished !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isPublished boolean is required' });
    }

    const mockTest = await MockTest.findByIdAndUpdate(
      req.params.id,
      { $set: { isPublished } },
      { returnDocument: 'after' }
    );

    if (!mockTest) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }

    res.status(200).json({
      success: true,
      message: `Mock test ${isPublished ? 'published' : 'unpublished'} successfully`,
      data: { mockTest },
    });
  } catch (error) {
    next(error);
  }
};

// ─── REVIEW MODERATION (PHASE 13) ─────────────────────────────────────────────

export const getAdminReviews = async (req, res, next) => {
  try {
    const { status = 'all', page = 1, limit = 10 } = req.query;
    const query = {};

    if (status !== 'all') {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('user', 'firstName lastName email college')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) || 1 },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const approveReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'approved', moderatedAt: new Date(), moderatedBy: req.user._id } },
      { returnDocument: 'after' }
    );

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Review approved successfully',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

export const rejectReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'rejected', moderatedAt: new Date(), moderatedBy: req.user._id } },
      { returnDocument: 'after' }
    );

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Review rejected',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

// ─── PLATFORM ANALYTICS (PHASE 12) ────────────────────────────────────────────

export const getAdminAnalytics = async (req, res, next) => {
  try {
    const [
      studentsTotal,
      studentsActive,
      aptQuestionsTotal,
      aptAttemptsTotal,
      codingProblemsTotal,
      codingSubmissionsTotal,
      companiesTotal,
      resourcesTotal,
      mockTestsTotal,
      mockAttemptsTotal,
      reviewsTotal,
      reviewsApproved,
      reviewsPending,
      attemptsByDay,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', isActive: true }),
      AptitudeQuestion.countDocuments(),
      AptitudeAttempt.countDocuments({ status: { $in: ['submitted', 'expired'] } }),
      CodingProblem.countDocuments(),
      CodingSubmission.countDocuments(),
      Company.countDocuments(),
      StudyMaterial.countDocuments(),
      MockTest.countDocuments(),
      MockTestAttempt.countDocuments({ status: { $in: ['submitted', 'expired'] } }),
      Review.countDocuments(),
      Review.countDocuments({ status: 'approved' }),
      Review.countDocuments({ status: 'pending' }),
      AptitudeAttempt.aggregate([
        { $match: { status: { $in: ['submitted', 'expired'] } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            avgScore: { $avg: '$percentage' },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 14 },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          students: { total: studentsTotal, active: studentsActive },
          aptitude: { questions: aptQuestionsTotal, attempts: aptAttemptsTotal },
          coding: { problems: codingProblemsTotal, submissions: codingSubmissionsTotal },
          companies: { total: companiesTotal },
          resources: { total: resourcesTotal },
          mockTests: { total: mockTestsTotal, attempts: mockAttemptsTotal },
          reviews: { total: reviewsTotal, approved: reviewsApproved, pending: reviewsPending },
        },
        activityTrend: attemptsByDay.map((d) => ({
          date: d._id,
          attempts: d.count,
          avgScore: Math.round(d.avgScore || 0),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAdminDashboardStats,
  getStudents,
  getStudentById,
  updateStudentStatus,
  getAdminAptitudeQuestions,
  createAptitudeQuestion,
  getAptitudeQuestionById,
  updateAptitudeQuestion,
  updateAptitudeQuestionStatus,
  getAdminCodingProblems,
  createCodingProblem,
  getAdminCodingProblemById,
  updateCodingProblem,
  updateCodingProblemStatus,
  getAdminCompanies,
  createCompany,
  getAdminCompanyById,
  updateCompany,
  updateCompanyStatus,
  getAdminResources,
  createResource,
  getAdminResourceById,
  updateResource,
  updateResourceStatus,
  getAdminMockTests,
  createMockTest,
  getAdminMockTestById,
  updateMockTest,
  updateMockTestStatus,
  getAdminReviews,
  approveReview,
  rejectReview,
  getAdminAnalytics,
};
