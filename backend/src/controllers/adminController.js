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
import AuditLog from '../models/AuditLog.js';
import Session from '../models/Session.js';
import { logSecurityEvent } from '../services/securityLogger.js';
import notificationService from '../services/notificationService.js';
import sessionService from '../services/sessionService.js';

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
      pendingReviews,
      inactiveQuestions,
      inactiveProblems,
      inactiveResources,
      unpublishedMockTests,
      recentUsers,
      recentQuestions,
      recentAttempts,
      recentAuditLogs,
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
      Review.countDocuments({ status: 'pending' }),
      AptitudeQuestion.countDocuments({ isActive: false }),
      CodingProblem.countDocuments({ isActive: false }),
      StudyMaterial.countDocuments({ isActive: false }),
      MockTest.countDocuments({ isPublished: false }),
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
      AuditLog.find()
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    let activityList = [];

    if (recentAuditLogs && recentAuditLogs.length > 0) {
      activityList = recentAuditLogs.map((log) => ({
        type: log.action,
        title: log.action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        subtitle: log.user
          ? `${log.user.firstName} ${log.user.lastName} (${log.user.email})`
          : log.entityType || 'System Event',
        timestamp: log.createdAt,
        severity: log.severity || 'info',
        entityType: log.entityType,
        ipAddress: log.ipAddress,
        status: log.severity === 'critical' ? 'critical' : 'active',
      }));
    } else {
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
    }

    activityList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const pendingActions = {
      pendingReviews,
      inactiveQuestions,
      inactiveProblems,
      inactiveResources,
      unpublishedMockTests,
      incompleteCompanies: 0,
      totalPending:
        pendingReviews +
        inactiveQuestions +
        inactiveProblems +
        inactiveResources +
        unpublishedMockTests,
    };

    const healthSummary = {
      dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
      timestamp: new Date().toISOString(),
    };

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
          pending: pendingReviews,
        },
        pendingActions,
        health: healthSummary,
        activity: activityList.slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/health
 * Live platform health diagnostics (MongoDB ping, memory, uptime, collection counts).
 */
export const getAdminHealth = async (req, res, next) => {
  try {
    const startTime = Date.now();
    let dbPing = -1;
    let dbStatus = 'disconnected';

    if (mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.db.admin().ping();
        dbPing = Date.now() - startTime;
        dbStatus = 'connected';
      } catch (err) {
        dbStatus = 'degraded';
      }
    }

    const [
      userCount,
      studentCount,
      aptCount,
      codeCount,
      compCount,
      testCount,
      revCount,
      logCount,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      AptitudeQuestion.countDocuments(),
      CodingProblem.countDocuments(),
      Company.countDocuments(),
      MockTest.countDocuments(),
      Review.countDocuments(),
      AuditLog.countDocuments(),
    ]);

    const mem = process.memoryUsage();

    res.status(200).json({
      success: true,
      data: {
        status: dbStatus === 'connected' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        database: {
          status: dbStatus,
          name: mongoose.connection.name || 'recruitready',
          pingMs: dbPing,
          readyState: mongoose.connection.readyState,
        },
        process: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          memory: {
            heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
            heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
            rssMb: Math.round(mem.rss / (1024 * 1024)),
          },
        },
        collections: {
          users: userCount,
          students: studentCount,
          aptitudeQuestions: aptCount,
          codingProblems: codeCount,
          companies: compCount,
          mockTests: testCount,
          reviews: revCount,
          auditLogs: logCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/audit-logs
 * Paginated audit trail inspection with multi-dimensional filtering.
 */
export const getAdminAuditLogs = async (req, res, next) => {
  try {
    const {
      action,
      entityType,
      severity,
      search = '',
      page = 1,
      limit = 20,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    if (action && action !== 'all') query.action = action;
    if (entityType && entityType !== 'all') query.entityType = entityType;
    if (severity && severity !== 'all') query.severity = severity;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search.trim()) {
      const s = search.trim();
      query.$or = [
        { action: { $regex: s, $options: 'i' } },
        { entityType: { $regex: s, $options: 'i' } },
        { ipAddress: { $regex: s, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, logs, distinctActions, distinctEntityTypes] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .populate('user', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.distinct('action'),
      AuditLog.distinct('entityType'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
        filters: {
          availableActions: distinctActions.filter(Boolean).sort(),
          availableEntityTypes: distinctEntityTypes.filter(Boolean).sort(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── STUDENT MANAGEMENT ────────────────────────────────────────────────────────

export const getStudents = async (req, res, next) => {
  try {
    const {
      search = '',
      status = 'all',
      branch = 'all',
      graduationYear = 'all',
      emailVerified = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;
    const query = { role: 'student' };

    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;

    if (branch && branch !== 'all') {
      query.branch = branch;
    }

    if (graduationYear && graduationYear !== 'all') {
      const yr = parseInt(graduationYear, 10);
      if (!isNaN(yr)) query.graduationYear = yr;
    }

    if (emailVerified === 'true') query.emailVerified = true;
    else if (emailVerified === 'false') query.emailVerified = false;

    if (search.trim()) {
      const s = search.trim();
      query.$or = [
        { firstName: { $regex: s, $options: 'i' } },
        { lastName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { college: { $regex: s, $options: 'i' } },
      ];
    }

    const sortFields = {
      createdAt: 'createdAt',
      firstName: 'firstName',
      email: 'email',
      graduationYear: 'graduationYear',
    };
    const sortField = sortFields[sortBy] || 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortDirection };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, students, branches, years] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.distinct('branch', { role: 'student', branch: { $nin: ['', null] } }),
      User.distinct('graduationYear', { role: 'student', graduationYear: { $ne: null } }),
    ]);

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
        filters: {
          availableBranches: branches.filter(Boolean).sort(),
          availableGraduationYears: years.filter(Boolean).sort((a, b) => a - b),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportStudentsCsv = async (req, res, next) => {
  try {
    const {
      search = '',
      status = 'all',
      branch = 'all',
      graduationYear = 'all',
      emailVerified = 'all',
    } = req.query;

    const query = { role: 'student' };

    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;

    if (branch && branch !== 'all') {
      query.branch = branch;
    }

    if (graduationYear && graduationYear !== 'all') {
      const yr = parseInt(graduationYear, 10);
      if (!isNaN(yr)) query.graduationYear = yr;
    }

    if (emailVerified === 'true') query.emailVerified = true;
    else if (emailVerified === 'false') query.emailVerified = false;

    if (search.trim()) {
      const s = search.trim();
      query.$or = [
        { firstName: { $regex: s, $options: 'i' } },
        { lastName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { college: { $regex: s, $options: 'i' } },
      ];
    }

    // STRICT PROJECTION: Explicit safe fields only. Passwords and secrets are completely excluded.
    const students = await User.find(query)
      .select('firstName lastName email college branch graduationYear cgpa backlogs isActive emailVerified createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const header = [
      '"First Name"',
      '"Last Name"',
      '"Email"',
      '"College"',
      '"Branch"',
      '"Graduation Year"',
      '"CGPA"',
      '"Backlogs"',
      '"Status"',
      '"Email Verified"',
      '"Registered Date"',
    ].join(',');

    const rows = students.map((st) =>
      [
        escapeCsv(st.firstName),
        escapeCsv(st.lastName),
        escapeCsv(st.email),
        escapeCsv(st.college),
        escapeCsv(st.branch),
        escapeCsv(st.graduationYear || ''),
        escapeCsv(st.cgpa != null ? st.cgpa : ''),
        escapeCsv(st.backlogs != null ? st.backlogs : 0),
        escapeCsv(st.isActive ? 'Active' : 'Inactive'),
        escapeCsv(st.emailVerified ? 'Verified' : 'Unverified'),
        escapeCsv(st.createdAt ? new Date(st.createdAt).toISOString() : ''),
      ].join(',')
    );

    const csvContent = [header, ...rows].join('\r\n');

    await logSecurityEvent({
      action: 'admin_export_students_csv',
      user: req.user?._id,
      entityType: 'User',
      req,
      details: { count: students.length, filterApplied: Object.keys(query).length },
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="students_export_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
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

    // Revoke all active sessions immediately if account is deactivated
    if (!isActive) {
      await sessionService.revokeAllSessions(student._id);
    }

    await logSecurityEvent({
      action: 'admin_update_student_status',
      user: req.user?._id,
      entityType: 'User',
      entityId: student._id.toString(),
      req,
      details: { isActive, studentEmail: student.email },
    });

    res.status(200).json({
      success: true,
      message: `Student account ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { student },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateStudentStatus = async (req, res, next) => {
  try {
    const { ids, isActive } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of student IDs is required' });
    }
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive boolean flag is required' });
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid IDs provided' });
    }

    // Role protection: STRICTLY match role: 'student' so admins are NEVER modified!
    const result = await User.updateMany(
      { _id: { $in: validIds }, role: 'student' },
      { $set: { isActive } }
    );

    // Revoke all active sessions for deactivated students
    if (!isActive) {
      await Session.updateMany(
        { user: { $in: validIds }, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
    }

    await logSecurityEvent({
      action: 'admin_bulk_update_student_status',
      user: req.user?._id,
      entityType: 'User',
      req,
      details: { modifiedCount: result.modifiedCount, isActive, targetCount: validIds.length },
    });

    res.status(200).json({
      success: true,
      message: `Successfully ${isActive ? 'activated' : 'deactivated'} ${result.modifiedCount} student(s)`,
      data: { modifiedCount: result.modifiedCount },
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

    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ success: false, message: 'Exactly four options (A, B, C, D) are required' });
    }

    const validKeys = ['A', 'B', 'C', 'D'];
    const normalizedCorrect = String(correctOption).trim().toUpperCase();
    if (!validKeys.includes(normalizedCorrect)) {
      return res.status(400).json({ success: false, message: 'Correct option must be A, B, C, or D' });
    }

    const texts = options.map((o) => (o.text || '').trim().toLowerCase());
    if (texts.some((t) => !t)) {
      return res.status(400).json({ success: false, message: 'All four option choices must contain text' });
    }
    if (new Set(texts).size < options.length) {
      return res.status(400).json({ success: false, message: 'All option choices must be mutually distinct' });
    }

    const newQuestion = await AptitudeQuestion.create({
      question: question.trim(),
      options: options.map((o) => ({ key: String(o.key || '').trim().toUpperCase(), text: String(o.text || '').trim() })),
      correctOption: normalizedCorrect,
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

    if (updates.options !== undefined) {
      if (!Array.isArray(updates.options) || updates.options.length !== 4) {
        return res.status(400).json({ success: false, message: 'Exactly four options (A, B, C, D) are required' });
      }
      const texts = updates.options.map((o) => (o.text || '').trim().toLowerCase());
      if (texts.some((t) => !t)) {
        return res.status(400).json({ success: false, message: 'All four option choices must contain text' });
      }
      if (new Set(texts).size < updates.options.length) {
        return res.status(400).json({ success: false, message: 'All option choices must be mutually distinct' });
      }
      updates.options = updates.options.map((o) => ({
        key: String(o.key || '').trim().toUpperCase(),
        text: String(o.text || '').trim(),
      }));
    }

    if (updates.correctOption !== undefined) {
      const validKeys = ['A', 'B', 'C', 'D'];
      const normalizedCorrect = String(updates.correctOption).trim().toUpperCase();
      if (!validKeys.includes(normalizedCorrect)) {
        return res.status(400).json({ success: false, message: 'Correct option must be A, B, C, or D' });
      }
      updates.correctOption = normalizedCorrect;
    }

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

    await logSecurityEvent({
      action: 'admin_update_aptitude_status',
      user: req.user?._id,
      entityType: 'AptitudeQuestion',
      entityId: updated._id.toString(),
      req,
      details: { isActive },
    });

    res.status(200).json({
      success: true,
      message: `Question ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { question: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateAptitudeStatus = async (req, res, next) => {
  try {
    const { ids, isActive } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of question IDs is required' });
    }
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive boolean flag is required' });
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid question IDs provided' });
    }

    const result = await AptitudeQuestion.updateMany(
      { _id: { $in: validIds } },
      { $set: { isActive } }
    );

    await logSecurityEvent({
      action: 'admin_bulk_update_aptitude_status',
      user: req.user?._id,
      entityType: 'AptitudeQuestion',
      req,
      details: { modifiedCount: result.modifiedCount, isActive, targetCount: validIds.length },
    });

    res.status(200).json({
      success: true,
      message: `Successfully ${isActive ? 'activated' : 'deactivated'} ${result.modifiedCount} aptitude question(s)`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAptitudeQuestion = async (req, res, next) => {
  try {
    const question = await AptitudeQuestion.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Protect historical student attempt scorecards and mock tests
    const [hasAttempts, inMockTest] = await Promise.all([
      AptitudeAttempt.exists({
        $or: [
          { questionIds: req.params.id },
          { 'answers.questionId': req.params.id },
        ],
      }),
      MockTest.exists({ 'questions.questionId': req.params.id }),
    ]);

    if (hasAttempts || inMockTest) {
      question.isActive = false;
      await question.save();

      await logSecurityEvent({
        action: 'admin_soft_delete_aptitude_question',
        user: req.user?._id,
        entityType: 'AptitudeQuestion',
        entityId: question._id.toString(),
        req,
      });

      return res.status(200).json({
        success: true,
        message: 'Question has historical student attempt records or mock test references and was deactivated rather than permanently deleted to preserve scorecard integrity.',
        data: { question, softDeleted: true },
      });
    }

    await AptitudeQuestion.findByIdAndDelete(req.params.id);

    await logSecurityEvent({
      action: 'admin_delete_aptitude_question',
      user: req.user?._id,
      entityType: 'AptitudeQuestion',
      entityId: req.params.id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Question deleted permanently',
      data: { softDeleted: false },
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

    await logSecurityEvent({
      action: 'admin_update_coding_problem_status',
      user: req.user?._id,
      entityType: 'CodingProblem',
      entityId: problem._id.toString(),
      req,
      details: { isActive },
    });

    res.status(200).json({
      success: true,
      message: `Problem ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { problem },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateCodingStatus = async (req, res, next) => {
  try {
    const { ids, isActive } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of problem IDs is required' });
    }
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive boolean flag is required' });
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid problem IDs provided' });
    }

    const result = await CodingProblem.updateMany(
      { _id: { $in: validIds } },
      { $set: { isActive } }
    );

    await logSecurityEvent({
      action: 'admin_bulk_update_coding_status',
      user: req.user?._id,
      entityType: 'CodingProblem',
      req,
      details: { modifiedCount: result.modifiedCount, isActive, targetCount: validIds.length },
    });

    res.status(200).json({
      success: true,
      message: `Successfully ${isActive ? 'activated' : 'deactivated'} ${result.modifiedCount} coding problem(s)`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCodingProblem = async (req, res, next) => {
  try {
    const problem = await CodingProblem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Coding problem not found' });
    }

    // Check student submissions or mock tests
    const [hasSubmissions, inMockTest] = await Promise.all([
      CodingSubmission.exists({ problem: req.params.id }),
      MockTest.exists({ 'questions.questionId': req.params.id }),
    ]);

    if (hasSubmissions || inMockTest) {
      problem.isActive = false;
      await problem.save();

      await logSecurityEvent({
        action: 'admin_soft_delete_coding_problem',
        user: req.user?._id,
        entityType: 'CodingProblem',
        entityId: problem._id.toString(),
        req,
      });

      return res.status(200).json({
        success: true,
        message: 'Coding problem has historical student submissions or mock test references and was deactivated rather than permanently deleted to preserve history.',
        data: { problem, softDeleted: true },
      });
    }

    await CodingProblem.findByIdAndDelete(req.params.id);

    await logSecurityEvent({
      action: 'admin_delete_coding_problem',
      user: req.user?._id,
      entityType: 'CodingProblem',
      entityId: req.params.id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Coding problem deleted permanently',
      data: { softDeleted: false },
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

    // Data Quality Completeness Calculation (Phase 39)
    const enrichedCompanies = companies.map((c) => {
      const checks = {
        basicInfo: Boolean(c.name && c.description && c.industry),
        eligibility: Boolean(c.eligibility || (c.eligibilityCriteria && (c.eligibilityCriteria.minCgpa || (c.eligibilityCriteria.allowedBranches && c.eligibilityCriteria.allowedBranches.length > 0)))),
        selectionProcess: Array.isArray(c.selectionProcess) && c.selectionProcess.length > 0,
        aptitude: Array.isArray(c.aptitudeTopics) && c.aptitudeTopics.length > 0,
        coding: Array.isArray(c.codingTopics) && c.codingTopics.length > 0,
        interview: Array.isArray(c.interviewTopics) && c.interviewTopics.length > 0,
        resources: Array.isArray(c.resources) && c.resources.length > 0,
      };
      const totalChecks = Object.keys(checks).length;
      const passedChecks = Object.values(checks).filter(Boolean).length;
      const completenessPercentage = Math.round((passedChecks / totalChecks) * 100);

      return {
        ...c,
        quality: {
          checks,
          completenessPercentage,
          isComplete: completenessPercentage >= 80,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: {
        companies: enrichedCompanies,
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
      eligibilityCriteria,
      selectionProcess,
      aptitudeTopics,
      codingTopics,
      interviewTopics,
      resources,
      isFeatured,
      isActive,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    let finalSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existingSlug = await Company.findOne({ slug: finalSlug });
    if (existingSlug) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

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
      eligibilityCriteria: eligibilityCriteria || null,
      selectionProcess: Array.isArray(selectionProcess) ? selectionProcess : [],
      aptitudeTopics: Array.isArray(aptitudeTopics) ? aptitudeTopics : [],
      codingTopics: Array.isArray(codingTopics) ? codingTopics : [],
      interviewTopics: Array.isArray(interviewTopics) ? interviewTopics : [],
      resources: Array.isArray(resources) ? resources : [],
      isFeatured: Boolean(isFeatured),
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

    if (updates.slug) {
      updates.slug = updates.slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

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

    await logSecurityEvent({
      action: 'admin_update_company_status',
      user: req.user?._id,
      entityType: 'Company',
      entityId: company._id.toString(),
      req,
      details: { isActive, companyName: company.name },
    });

    res.status(200).json({
      success: true,
      message: `Company ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { company },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateCompanyStatus = async (req, res, next) => {
  try {
    const { ids, isActive } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of company IDs is required' });
    }
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive boolean flag is required' });
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid company IDs provided' });
    }

    const result = await Company.updateMany(
      { _id: { $in: validIds } },
      { $set: { isActive } }
    );

    await logSecurityEvent({
      action: 'admin_bulk_update_company_status',
      user: req.user?._id,
      entityType: 'Company',
      req,
      details: { modifiedCount: result.modifiedCount, isActive, targetCount: validIds.length },
    });

    res.status(200).json({
      success: true,
      message: `Successfully ${isActive ? 'activated' : 'deactivated'} ${result.modifiedCount} company profile(s)`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const hasStudentsTargeting = await User.exists({ targetCompanies: company.name });
    if (hasStudentsTargeting) {
      company.isActive = false;
      await company.save();

      await logSecurityEvent({
        action: 'admin_soft_delete_company',
        user: req.user?._id,
        entityType: 'Company',
        entityId: company._id.toString(),
        req,
      });

      return res.status(200).json({
        success: true,
        message: 'Company is targeted by students and was deactivated rather than permanently deleted to preserve student goal data.',
        data: { company, softDeleted: true },
      });
    }

    await Company.findByIdAndDelete(req.params.id);

    await logSecurityEvent({
      action: 'admin_delete_company',
      user: req.user?._id,
      entityType: 'Company',
      entityId: req.params.id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Company deleted permanently',
      data: { softDeleted: false },
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

    const trimmedUrl = String(url).trim();
    const lowerUrl = trimmedUrl.toLowerCase();
    if (
      lowerUrl.startsWith('javascript:') ||
      lowerUrl.startsWith('data:') ||
      lowerUrl.startsWith('vbscript:') ||
      (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://') && !lowerUrl.startsWith('/'))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL. Only HTTP and HTTPS URLs are allowed.',
      });
    }

    const resource = await StudyMaterial.create({
      title: title.trim(),
      description: (description || '').trim(),
      type,
      category: category.trim(),
      topic: topic.trim(),
      url: trimmedUrl,
      fileUrl: fileUrl || '',
      thumbnailUrl: thumbnailUrl || '',
      isActive: isActive !== undefined ? isActive : true,
      uploadedBy: req.user._id,
    });

    if (resource.isActive) {
      notificationService
        .broadcastStudentNotification({
          type: 'new_study_material',
          title: 'New Study Material Published',
          message: `${resource.title} (${resource.category}) is now available in Study Materials.`,
          link: `/resources/${resource._id}`,
          metadata: { entityId: resource._id },
        })
        .catch((err) =>
          console.error('[adminController] Resource notification broadcast error:', err.message)
        );
    }

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

    if (updates.url !== undefined) {
      const trimmedUrl = String(updates.url).trim();
      const lowerUrl = trimmedUrl.toLowerCase();
      if (
        lowerUrl.startsWith('javascript:') ||
        lowerUrl.startsWith('data:') ||
        lowerUrl.startsWith('vbscript:') ||
        (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://') && !lowerUrl.startsWith('/'))
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid URL. Only HTTP and HTTPS URLs are allowed.',
        });
      }
      updates.url = trimmedUrl;
    }

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

    await logSecurityEvent({
      action: 'admin_update_resource_status',
      user: req.user?._id,
      entityType: 'StudyMaterial',
      entityId: resource._id.toString(),
      req,
      details: { isActive, title: resource.title },
    });

    res.status(200).json({
      success: true,
      message: `Resource ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { resource },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateResourceStatus = async (req, res, next) => {
  try {
    const { ids, isActive } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of resource IDs is required' });
    }
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive boolean flag is required' });
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid resource IDs provided' });
    }

    const result = await StudyMaterial.updateMany(
      { _id: { $in: validIds } },
      { $set: { isActive } }
    );

    await logSecurityEvent({
      action: 'admin_bulk_update_resource_status',
      user: req.user?._id,
      entityType: 'StudyMaterial',
      req,
      details: { modifiedCount: result.modifiedCount, isActive, targetCount: validIds.length },
    });

    res.status(200).json({
      success: true,
      message: `Successfully ${isActive ? 'activated' : 'deactivated'} ${result.modifiedCount} study material resource(s)`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteResource = async (req, res, next) => {
  try {
    const resource = await StudyMaterial.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    await StudyMaterial.findByIdAndDelete(req.params.id);

    await logSecurityEvent({
      action: 'admin_delete_resource',
      user: req.user?._id,
      entityType: 'StudyMaterial',
      entityId: req.params.id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Resource deleted permanently',
      data: { softDeleted: false },
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
      .populate('company', 'name slug logoUrl isActive')
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
    const { title, description, durationMinutes, categories, difficulty, instructions, questions, isPublished, company } = req.body;

    if (!title || durationMinutes === undefined || durationMinutes === null) {
      return res.status(400).json({ success: false, message: 'Title and duration in minutes are required' });
    }

    const dur = Number(durationMinutes);
    if (!dur || dur <= 0 || isNaN(dur)) {
      return res.status(400).json({ success: false, message: 'Duration must be greater than 0 minutes' });
    }

    // Validate optional company assignment
    let assignedCompanyId = null;
    if (company !== undefined && company !== null && company !== '') {
      if (!mongoose.Types.ObjectId.isValid(company)) {
        return res.status(400).json({ success: false, message: 'Invalid company ID format' });
      }
      const companyExists = await Company.exists({ _id: company });
      if (!companyExists) {
        return res.status(400).json({ success: false, message: 'Selected company does not exist' });
      }
      assignedCompanyId = company;
    }

    if (Array.isArray(questions) && questions.length > 0) {
      for (const q of questions) {
        if (!q.questionId || !mongoose.Types.ObjectId.isValid(q.questionId)) {
          return res.status(400).json({ success: false, message: `Invalid question ID format: ${q.questionId}` });
        }
        const qType = q.questionType || (q.questionTypeRef === 'CodingProblem' ? 'coding' : 'aptitude');
        let exists = false;
        if (qType === 'coding') {
          exists = await CodingProblem.exists({ _id: q.questionId });
        } else {
          exists = await AptitudeQuestion.exists({ _id: q.questionId });
        }
        if (!exists) {
          return res.status(400).json({ success: false, message: `Question with ID ${q.questionId} does not exist in database` });
        }
      }
    }

    const test = await MockTest.create({
      title: title.trim(),
      description: description || '',
      durationMinutes: dur,
      categories: Array.isArray(categories) ? categories : ['General Aptitude'],
      difficulty: difficulty || 'medium',
      instructions: instructions || 'Read carefully and submit within time limit.',
      questions: Array.isArray(questions) ? questions : [],
      totalQuestions: Array.isArray(questions) ? questions.length : 0,
      isPublished: isPublished !== undefined ? isPublished : true,
      company: assignedCompanyId,
      createdBy: req.user._id,
    });

    await test.populate('company', 'name slug logoUrl isActive');

    if (test.isPublished) {
      notificationService
        .broadcastStudentNotification({
          type: 'new_mock_test',
          title: 'New Mock Assessment Available',
          message: `${test.title} (${test.durationMinutes} mins) is now available to take.`,
          link: `/mock-tests/${test.slug || test._id}`,
          metadata: { entityId: test._id },
        })
        .catch((err) =>
          console.error('[adminController] Mock test notification broadcast error:', err.message)
        );
    }

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
    const mockTest = await MockTest.findById(req.params.id)
      .populate('company', 'name slug logoUrl isActive');
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

    if (updates.durationMinutes !== undefined) {
      const dur = Number(updates.durationMinutes);
      if (!dur || dur <= 0 || isNaN(dur)) {
        return res.status(400).json({ success: false, message: 'Duration must be greater than 0 minutes' });
      }
      updates.durationMinutes = dur;
    }

    // Validate optional company assignment update (or detachment)
    if (updates.company !== undefined) {
      if (updates.company === null || updates.company === '') {
        updates.company = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(updates.company)) {
          return res.status(400).json({ success: false, message: 'Invalid company ID format' });
        }
        const companyExists = await Company.exists({ _id: updates.company });
        if (!companyExists) {
          return res.status(400).json({ success: false, message: 'Selected company does not exist' });
        }
      }
    }

    if (updates.questions && Array.isArray(updates.questions)) {
      for (const q of updates.questions) {
        if (!q.questionId || !mongoose.Types.ObjectId.isValid(q.questionId)) {
          return res.status(400).json({ success: false, message: `Invalid question ID format: ${q.questionId}` });
        }
        const qType = q.questionType || (q.questionTypeRef === 'CodingProblem' ? 'coding' : 'aptitude');
        let exists = false;
        if (qType === 'coding') {
          exists = await CodingProblem.exists({ _id: q.questionId });
        } else {
          exists = await AptitudeQuestion.exists({ _id: q.questionId });
        }
        if (!exists) {
          return res.status(400).json({ success: false, message: `Question with ID ${q.questionId} does not exist in database` });
        }
      }
      updates.totalQuestions = updates.questions.length;
    }

    const mockTest = await MockTest.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    ).populate('company', 'name slug logoUrl isActive');

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

    const testDoc = await MockTest.findById(req.params.id);
    if (!testDoc) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }

    if (isPublished && (!testDoc.questions || testDoc.questions.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish mock test without questions configured. Please add questions before publishing.',
      });
    }

    testDoc.isPublished = isPublished;
    await testDoc.save();

    await logSecurityEvent({
      action: 'admin_update_mock_test_status',
      user: req.user?._id,
      entityType: 'MockTest',
      entityId: testDoc._id.toString(),
      req,
      details: { isPublished, title: testDoc.title },
    });

    res.status(200).json({
      success: true,
      message: `Mock test ${isPublished ? 'published' : 'unpublished'} successfully`,
      data: { mockTest: testDoc },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateMockTestStatus = async (req, res, next) => {
  try {
    const { ids, isPublished } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of mock test IDs is required' });
    }
    if (typeof isPublished !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isPublished boolean flag is required' });
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid mock test IDs provided' });
    }

    if (isPublished) {
      // Validate that all target mock tests have questions configured before publishing
      const emptyTests = await MockTest.find({
        _id: { $in: validIds },
        $or: [{ questions: { $exists: false } }, { questions: { $size: 0 } }],
      }).select('title');

      if (emptyTests.length > 0) {
        const titles = emptyTests.map((t) => t.title).join(', ');
        return res.status(400).json({
          success: false,
          message: `Cannot publish mock test(s) without questions configured: ${titles}`,
        });
      }
    }

    const result = await MockTest.updateMany(
      { _id: { $in: validIds } },
      { $set: { isPublished } }
    );

    await logSecurityEvent({
      action: 'admin_bulk_update_mock_test_status',
      user: req.user?._id,
      entityType: 'MockTest',
      req,
      details: { modifiedCount: result.modifiedCount, isPublished, targetCount: validIds.length },
    });

    res.status(200).json({
      success: true,
      message: `Successfully ${isPublished ? 'published' : 'unpublished'} ${result.modifiedCount} mock test(s)`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMockTest = async (req, res, next) => {
  try {
    const mockTest = await MockTest.findById(req.params.id);
    if (!mockTest) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }

    const hasAttempts = await MockTestAttempt.exists({ mockTest: req.params.id });
    if (hasAttempts) {
      mockTest.isPublished = false;
      await mockTest.save();

      await logSecurityEvent({
        action: 'admin_soft_delete_mock_test',
        user: req.user?._id,
        entityType: 'MockTest',
        entityId: mockTest._id.toString(),
        req,
      });

      return res.status(200).json({
        success: true,
        message: 'Mock test has historical student attempts and was unpublished rather than permanently deleted to preserve scorecard history.',
        data: { mockTest, softDeleted: true },
      });
    }

    await MockTest.findByIdAndDelete(req.params.id);

    await logSecurityEvent({
      action: 'admin_delete_mock_test',
      user: req.user?._id,
      entityType: 'MockTest',
      entityId: req.params.id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Mock test deleted permanently',
      data: { softDeleted: false },
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

    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      Review.countDocuments({ status: 'pending' }),
      Review.countDocuments({ status: 'approved' }),
      Review.countDocuments({ status: 'rejected' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        counts: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          all: pendingCount + approvedCount + rejectedCount,
        },
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

    await logSecurityEvent({
      action: 'admin_approve_review',
      user: req.user?._id,
      entityType: 'Review',
      entityId: review._id.toString(),
      req,
    });

    // Notify the student that their review was approved
    if (review.user) {
      await notificationService.createNotification({
        recipient: review.user,
        type: 'review_approved',
        title: 'Review Approved',
        message: 'Your RecruitReady review has been approved and is now visible to the community.',
        link: '/reviews',
        metadata: { entityId: review._id.toString() },
      });
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

    await logSecurityEvent({
      action: 'admin_reject_review',
      user: req.user?._id,
      entityType: 'Review',
      entityId: review._id.toString(),
      req,
    });

    // Notify the student that their review was not approved
    if (review.user) {
      await notificationService.createNotification({
        recipient: review.user,
        type: 'review_rejected',
        title: 'Review Update',
        message: 'Your review was not approved during moderation.',
        link: '/reviews',
        metadata: { entityId: review._id.toString() },
      });
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

export const bulkUpdateReviewStatus = async (req, res, next) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of review IDs is required' });
    }
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid review IDs provided' });
    }

    const result = await Review.updateMany(
      { _id: { $in: validIds } },
      { $set: { status, moderatedAt: new Date(), moderatedBy: req.user._id } }
    );

    await logSecurityEvent({
      action: 'admin_bulk_moderate_reviews',
      user: req.user?._id,
      entityType: 'Review',
      req,
      details: { modifiedCount: result.modifiedCount, status, targetCount: validIds.length },
    });

    res.status(200).json({
      success: true,
      message: `Successfully set ${result.modifiedCount} review(s) to ${status}`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await logSecurityEvent({
      action: 'admin_delete_review',
      user: req.user?._id,
      entityType: 'Review',
      entityId: req.params.id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Review deleted permanently',
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
  getAdminHealth,
  getAdminAuditLogs,
  getStudents,
  exportStudentsCsv,
  getStudentById,
  updateStudentStatus,
  bulkUpdateStudentStatus,
  getAdminAptitudeQuestions,
  createAptitudeQuestion,
  getAptitudeQuestionById,
  updateAptitudeQuestion,
  updateAptitudeQuestionStatus,
  bulkUpdateAptitudeStatus,
  deleteAptitudeQuestion,
  getAdminCodingProblems,
  createCodingProblem,
  getAdminCodingProblemById,
  updateCodingProblem,
  updateCodingProblemStatus,
  bulkUpdateCodingStatus,
  deleteCodingProblem,
  getAdminCompanies,
  createCompany,
  getAdminCompanyById,
  updateCompany,
  updateCompanyStatus,
  bulkUpdateCompanyStatus,
  deleteCompany,
  getAdminResources,
  createResource,
  getAdminResourceById,
  updateResource,
  updateResourceStatus,
  bulkUpdateResourceStatus,
  deleteResource,
  getAdminMockTests,
  createMockTest,
  getAdminMockTestById,
  updateMockTest,
  updateMockTestStatus,
  bulkUpdateMockTestStatus,
  deleteMockTest,
  getAdminReviews,
  approveReview,
  rejectReview,
  bulkUpdateReviewStatus,
  deleteAdminReview,
  getAdminAnalytics,
};
