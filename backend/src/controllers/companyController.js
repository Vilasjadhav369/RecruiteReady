import mongoose from 'mongoose';
import Company from '../models/Company.js';
import User from '../models/User.js';
import StudyMaterial from '../models/StudyMaterial.js';
import CompanyPreparationProgress from '../models/CompanyPreparationProgress.js';
import Bookmark from '../models/Bookmark.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import CodingProblem from '../models/CodingProblem.js';
import CodingSubmission from '../models/CodingSubmission.js';
import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';

/**
 * Helper: Find active company by ObjectId or slug
 */
async function findActiveCompany(idOrSlug) {
  if (!idOrSlug || typeof idOrSlug !== 'string') return null;
  const cleanId = idOrSlug.trim();
  if (mongoose.Types.ObjectId.isValid(cleanId)) {
    return await Company.findOne({ _id: cleanId, isActive: true });
  }
  return await Company.findOne({ slug: cleanId.toLowerCase(), isActive: true });
}

/**
 * Helper: Evaluate student eligibility against company criteria
 * Never claims hiring guarantees.
 */
function evaluateEligibility(user, company) {
  const criteria = company.eligibilityCriteria || {};
  const hasMinCgpa = criteria.minCgpa !== null && criteria.minCgpa !== undefined;
  const hasBranches = Array.isArray(criteria.allowedBranches) && criteria.allowedBranches.length > 0;
  const hasYears = Array.isArray(criteria.allowedGraduationYears) && criteria.allowedGraduationYears.length > 0;
  const hasMaxBacklogs = criteria.maxBacklogs !== null && criteria.maxBacklogs !== undefined;

  const hasConfiguredCriteria = hasMinCgpa || hasBranches || hasYears || hasMaxBacklogs;

  if (!hasConfiguredCriteria) {
    return {
      status: 'incomplete_data',
      statusLabel: 'Eligibility information incomplete',
      message: 'This company has not configured specific automated eligibility parameters. Please refer to the general criteria description.',
      details: [],
      disclaimer: 'Based on the information currently available. Does not guarantee campus hiring eligibility.',
    };
  }

  const details = [];
  let allPass = true;
  let hasIncompleteStudentData = false;

  // 1. Branch check
  if (hasBranches) {
    if (!user.branch || !user.branch.trim()) {
      hasIncompleteStudentData = true;
      details.push({
        criterion: 'Branch / Stream',
        required: criteria.allowedBranches.join(', '),
        actual: 'Not specified in profile',
        met: null,
      });
    } else {
      const userBranchLower = user.branch.toLowerCase().trim();
      const branchMatch = criteria.allowedBranches.some((b) => {
        const bLower = b.toLowerCase().trim();
        return userBranchLower === bLower || userBranchLower.includes(bLower) || bLower.includes(userBranchLower);
      });
      details.push({
        criterion: 'Branch / Stream',
        required: criteria.allowedBranches.join(', '),
        actual: user.branch,
        met: branchMatch,
      });
      if (!branchMatch) allPass = false;
    }
  }

  // 2. Graduation Year check
  if (hasYears) {
    if (!user.graduationYear) {
      hasIncompleteStudentData = true;
      details.push({
        criterion: 'Graduation Year',
        required: criteria.allowedGraduationYears.join(', '),
        actual: 'Not specified in profile',
        met: null,
      });
    } else {
      const yearMatch = criteria.allowedGraduationYears.includes(Number(user.graduationYear));
      details.push({
        criterion: 'Graduation Year',
        required: criteria.allowedGraduationYears.join(', '),
        actual: String(user.graduationYear),
        met: yearMatch,
      });
      if (!yearMatch) allPass = false;
    }
  }

  // 3. CGPA check
  if (hasMinCgpa) {
    if (user.cgpa === null || user.cgpa === undefined) {
      hasIncompleteStudentData = true;
      details.push({
        criterion: 'Minimum CGPA',
        required: `${criteria.minCgpa} / 10`,
        actual: 'Not specified in profile',
        met: null,
      });
    } else {
      const cgpaMatch = Number(user.cgpa) >= Number(criteria.minCgpa);
      details.push({
        criterion: 'Minimum CGPA',
        required: `${criteria.minCgpa} / 10`,
        actual: `${user.cgpa} / 10`,
        met: cgpaMatch,
      });
      if (!cgpaMatch) allPass = false;
    }
  }

  // 4. Backlogs check
  if (hasMaxBacklogs) {
    const userBacklogs = user.backlogs !== null && user.backlogs !== undefined ? Number(user.backlogs) : 0;
    const backlogMatch = userBacklogs <= Number(criteria.maxBacklogs);
    details.push({
      criterion: 'Maximum Active Backlogs',
      required: String(criteria.maxBacklogs),
      actual: String(userBacklogs),
      met: backlogMatch,
    });
    if (!backlogMatch) allPass = false;
  }

  if (hasIncompleteStudentData) {
    return {
      status: 'incomplete_data',
      statusLabel: 'Eligibility information incomplete',
      message: 'Some academic details (such as CGPA, Branch, or Graduation Year) are missing from your profile.',
      details,
      disclaimer: 'Based on the information currently available. Does not guarantee campus hiring eligibility.',
    };
  }

  if (allPass) {
    return {
      status: 'likely_eligible',
      statusLabel: 'Likely Eligible',
      message: 'Your profile matches the listed campus recruitment criteria for this company.',
      details,
      disclaimer: 'Based on the information currently available. Actual eligibility is subject to enterprise verification.',
    };
  }

  return {
    status: 'may_not_meet',
    statusLabel: 'May Not Meet Eligibility',
    message: 'One or more profile parameters do not meet the listed cutoff requirements.',
    details,
    disclaimer: 'Based on the information currently available. Requirements may vary by campus drive or role.',
  };
}

/**
 * GET /api/companies
 * List all active companies with search, filters, available industries, and target/bookmark status.
 */
export const getCompanies = async (req, res, next) => {
  try {
    const {
      search = '',
      industry = '',
      role = '',
      targetOnly = 'false',
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isActive: true };

    const cleanSearch = search && search !== 'undefined' && search !== 'null' ? search.trim() : '';
    if (cleanSearch) {
      query.$or = [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { roles: { $regex: cleanSearch, $options: 'i' } },
        { industry: { $regex: cleanSearch, $options: 'i' } },
        { aptitudeTopics: { $regex: cleanSearch, $options: 'i' } },
        { codingTopics: { $regex: cleanSearch, $options: 'i' } },
        { interviewTopics: { $regex: cleanSearch, $options: 'i' } },
      ];
    }

    if (industry && industry !== 'all' && industry !== 'undefined' && industry !== 'null') {
      query.industry = industry;
    }

    if (role && role !== 'all' && role !== 'undefined' && role !== 'null') {
      query.roles = { $regex: role.trim(), $options: 'i' };
    }

    const userId = req.user?._id;
    const userTargets = (req.user && Array.isArray(req.user.targetCompanies)) ? req.user.targetCompanies : [];

    if (targetOnly === 'true') {
      query.name = { $in: userTargets };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Parallel fetch: count, companies, distinct industries, distinct roles, user bookmarks
    const [total, rawCompanies, availableIndustries, availableRoles, userBookmarks] = await Promise.all([
      Company.countDocuments(query),
      Company.find(query)
        .select('name slug logoUrl description industry website careersUrl roles eligibility aptitudeTopics codingTopics interviewTopics resources isFeatured createdAt')
        .sort({ isFeatured: -1, name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Company.distinct('industry', { isActive: true }),
      Company.distinct('roles', { isActive: true }),
      userId
        ? Bookmark.find({ user: userId, itemType: 'company' }).select('itemId').lean()
        : Promise.resolve([]),
    ]);

    const bookmarkedIds = new Set(userBookmarks.map((b) => b.itemId.toString()));

    // Attach preparation area flags and student state
    const companies = rawCompanies.map((c) => {
      const hasAptitude = Array.isArray(c.aptitudeTopics) && c.aptitudeTopics.length > 0;
      const hasCoding = Array.isArray(c.codingTopics) && c.codingTopics.length > 0;
      const hasInterview = Array.isArray(c.interviewTopics) && c.interviewTopics.length > 0;
      const hasResources = Array.isArray(c.resources) && c.resources.length > 0;

      return {
        ...c,
        isTarget: userTargets.includes(c.name),
        isBookmarked: bookmarkedIds.has(c._id.toString()),
        preparationAreas: {
          hasAptitude,
          hasCoding,
          hasInterview,
          hasResources,
          totalAreas: [hasAptitude, hasCoding, hasInterview, hasResources].filter(Boolean).length,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: {
        companies,
        availableIndustries: availableIndustries.filter(Boolean).sort(),
        availableRoles: availableRoles.filter(Boolean).sort(),
        userTargets,
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
 * GET /api/companies/:id
 * Retrieve sanitized company details with target status, bookmark status, and related materials.
 */
export const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await findActiveCompany(id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const userId = req.user?._id;
    const userTargets = (req.user && Array.isArray(req.user.targetCompanies)) ? req.user.targetCompanies : [];
    const isTarget = userTargets.includes(company.name);

    // Check bookmark status
    const isBookmarked = userId
      ? Boolean(await Bookmark.exists({ user: userId, itemType: 'company', itemId: company._id }))
      : false;

    // Look up any matching study materials associated with company name or topics
    const searchTopics = [
      company.name,
      ...(company.aptitudeTopics || []),
      ...(company.codingTopics || []),
    ].filter(Boolean);

    const relatedMaterials = await StudyMaterial.find({
      isActive: true,
      $or: [
        { topic: { $in: searchTopics } },
        { category: { $regex: company.name, $options: 'i' } },
      ],
    })
      .select('title description type category topic url fileUrl')
      .limit(6)
      .lean();

    // Prepare clean student-facing payload (no internal moderation/admin fields)
    const sanitizedCompany = {
      _id: company._id,
      name: company.name,
      slug: company.slug,
      logoUrl: company.logoUrl || '',
      description: company.description || '',
      industry: company.industry || 'Technology',
      website: company.website || '',
      careersUrl: company.careersUrl || '',
      roles: company.roles || [],
      eligibility: company.eligibility || '',
      eligibilityCriteria: company.eligibilityCriteria || null,
      selectionProcess: company.selectionProcess || [],
      aptitudeTopics: company.aptitudeTopics || [],
      codingTopics: company.codingTopics || [],
      interviewTopics: company.interviewTopics || [],
      resources: (company.resources || []).map((r) => ({
        title: r.title,
        url: r.url,
        type: r.type || 'link',
      })),
      isFeatured: Boolean(company.isFeatured),
      isTarget,
      isTargetCompany: isTarget,
      isBookmarked,
      relatedMaterials: relatedMaterials || [],
    };

    res.status(200).json({
      success: true,
      data: {
        company: sanitizedCompany,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/companies/:id/preparation
 * Structured Company Preparation 2.0 Engine.
 * Returns complete roadmap, matching topic practice status, verified progress, and eligibility check.
 */
export const getCompanyPreparation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await findActiveCompany(id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const userId = req.user._id;

    // Parallel fetch:
    // 1. User full academic profile for eligibility
    // 2. Saved checklist records from CompanyPreparationProgress
    // 3. Student's aptitude practice history
    // 4. Student's coding practice history
    // 5. Existing question count per aptitude topic
    // 6. Existing problem count per coding topic
    // 7. User bookmark status
    const [
      user,
      checklistRecords,
      userAptAttempts,
      userCodeSubmissions,
      aptQuestionCounts,
      codingProblemCounts,
      bookmarkExists,
      companyMockTests,
    ] = await Promise.all([
      User.findById(userId).lean(),
      CompanyPreparationProgress.find({ user: userId, company: company._id }).lean(),
      AptitudeAttempt.find({ user: userId, status: { $in: ['submitted', 'expired'] } })
        .select('topic category score totalQuestions percentage')
        .lean(),
      CodingSubmission.find({ user: userId })
        .populate('problem', 'title difficulty topics category')
        .select('problem status language submittedAt')
        .lean(),
      AptitudeQuestion.aggregate([
        { $match: { topic: { $in: company.aptitudeTopics || [] } } },
        { $group: { _id: '$topic', count: { $sum: 1 } } },
      ]),
      CodingProblem.aggregate([
        { $match: { $or: [{ topics: { $in: company.codingTopics || [] } }, { category: { $in: company.codingTopics || [] } }] } },
        { $project: { topics: 1, category: 1 } },
      ]),
      Bookmark.exists({ user: userId, itemType: 'company', itemId: company._id }),
      MockTest.find({ company: company._id, isPublished: true })
        .select('title description durationMinutes totalQuestions categories difficulty instructions questions createdAt')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Query attempts only if company has associated mock tests
    const companyMockTestIds = (companyMockTests || []).map((t) => t._id);
    let studentMockAttempts = [];
    if (companyMockTestIds.length > 0) {
      studentMockAttempts = await MockTestAttempt.find({
        user: userId,
        mockTest: { $in: companyMockTestIds },
      })
        .select('mockTest status score percentage submittedAt startedAt timeLimitSeconds')
        .sort({ createdAt: -1 })
        .lean();
    }

    // Fast lookup maps
    const completedChecklistKeys = new Set(
      checklistRecords.filter((r) => r.completed).map((r) => `${r.section}::${r.itemKey}`)
    );

    const aptQuestionCountMap = new Map();
    aptQuestionCounts.forEach((q) => aptQuestionCountMap.set(q._id, q.count));

    // Map practiced topics from AptitudeAttempt
    const studentPracticedAptTopics = new Set();
    userAptAttempts.forEach((att) => {
      if (att.topic) studentPracticedAptTopics.add(att.topic.toLowerCase().trim());
      if (att.category) studentPracticedAptTopics.add(att.category.toLowerCase().trim());
    });

    // Map coding solved and attempted topics
    const studentSolvedCodingTopics = new Set();
    const studentAttemptedCodingTopics = new Set();
    userCodeSubmissions.forEach((sub) => {
      const pTopics = Array.isArray(sub.problem?.topics)
        ? sub.problem.topics
        : sub.problem?.category
        ? [sub.problem.category]
        : [];
      pTopics.forEach((t) => {
        const tLower = t.toLowerCase().trim();
        studentAttemptedCodingTopics.add(tLower);
        if (sub.status === 'accepted') {
          studentSolvedCodingTopics.add(tLower);
        }
      });
    });

    // 1. Aptitude Preparation Items
    const aptitudeItems = (company.aptitudeTopics || []).map((topic) => {
      const tLower = topic.toLowerCase().trim();
      const hasActualAttempts = studentPracticedAptTopics.has(tLower);
      const isMarked = completedChecklistKeys.has(`aptitude::${topic}`);
      const isCompleted = hasActualAttempts || isMarked;
      const availableQuestions = aptQuestionCountMap.get(topic) || 0;

      return {
        topic,
        isCompleted,
        verifiedByActivity: hasActualAttempts,
        manuallyMarked: isMarked,
        availableQuestions,
        practiceUrl: `/aptitude?topic=${encodeURIComponent(topic)}`,
      };
    });

    // 2. Coding Preparation Items
    const codingItems = (company.codingTopics || []).map((topic) => {
      const tLower = topic.toLowerCase().trim();
      const hasSolvedProblems = studentSolvedCodingTopics.has(tLower);
      const hasAttemptedProblems = studentAttemptedCodingTopics.has(tLower);
      const isMarked = completedChecklistKeys.has(`coding::${topic}`);
      const isCompleted = hasSolvedProblems || isMarked;

      return {
        topic,
        isCompleted,
        verifiedByActivity: hasSolvedProblems,
        attempted: hasAttemptedProblems,
        manuallyMarked: isMarked,
        practiceUrl: `/coding?topic=${encodeURIComponent(topic)}`,
      };
    });

    // 3. Interview Preparation Items
    const interviewItems = (company.interviewTopics || []).map((topic) => {
      const isMarked = completedChecklistKeys.has(`interview::${topic}`);
      return {
        topic,
        isCompleted: isMarked,
        manuallyMarked: isMarked,
      };
    });

    // 4. Resources Items
    const resourceItems = (company.resources || []).map((res, idx) => {
      const itemKey = res.title || `resource_${idx}`;
      const isMarked = completedChecklistKeys.has(`resources::${itemKey}`);
      return {
        itemKey,
        title: res.title,
        url: res.url,
        type: res.type || 'link',
        isCompleted: isMarked,
      };
    });

    // 5. Company-Specific Mock Assessments
    const mockTestItems = (companyMockTests || []).map((test) => {
      const trueTotalQuestions = (test.questions && test.questions.length > 0) ? test.questions.length : (test.totalQuestions || 0);
      const latestAttempt = studentMockAttempts.find(
        (a) => a.mockTest.toString() === test._id.toString()
      );

      // Must be a submitted attempt according to product rules (not expired/abandoned)
      const isSubmitted = latestAttempt?.status === 'submitted';
      const isCompleted = isSubmitted;

      let attemptStatus = 'not_started';
      if (latestAttempt) {
        attemptStatus = latestAttempt.status;
      }

      return {
        _id: test._id,
        title: test.title,
        description: test.description || '',
        durationMinutes: test.durationMinutes,
        totalQuestions: trueTotalQuestions,
        difficulty: test.difficulty,
        categories: test.categories || [],
        isCompleted,
        verifiedByActivity: isSubmitted,
        attemptStatus,
        score: latestAttempt?.score ?? null,
        percentage: latestAttempt?.percentage ?? null,
        submittedAt: latestAttempt?.submittedAt || null,
        practiceUrl: `/mock-tests/${test._id}`,
      };
    });

    // Real Trackable Calculation
    const completedAptitudeCount = aptitudeItems.filter((i) => i.isCompleted).length;
    const completedCodingCount = codingItems.filter((i) => i.isCompleted).length;
    const completedInterviewCount = interviewItems.filter((i) => i.isCompleted).length;
    const completedResourceCount = resourceItems.filter((i) => i.isCompleted).length;
    const completedMockTestCount = mockTestItems.filter((i) => i.isCompleted).length;

    const totalTrackableItems =
      aptitudeItems.length +
      codingItems.length +
      interviewItems.length +
      resourceItems.length +
      mockTestItems.length;

    const totalCompletedItems =
      completedAptitudeCount +
      completedCodingCount +
      completedInterviewCount +
      completedResourceCount +
      completedMockTestCount;

    const progressPercentage =
      totalTrackableItems > 0 ? Math.round((totalCompletedItems / totalTrackableItems) * 100) : null;

    const userTargets = Array.isArray(user?.targetCompanies) ? user.targetCompanies : [];
    const isTarget = userTargets.includes(company.name);

    // Evaluate student eligibility
    const eligibilityResult = evaluateEligibility(user || {}, company);

    // Preparation Roadmap Steps (Constructed strictly from actual company fields)
    const roadmapSteps = [];

    // Step 1: Understand Company & Requirements
    roadmapSteps.push({
      stepNumber: 1,
      id: 'overview',
      title: 'Company Profile & Roles',
      description: `Review ${company.name}'s industry focus (${company.industry || 'Technology'}), eligible roles, and campus recruitment criteria.`,
      status: isTarget ? 'completed' : 'in_progress',
      isCompleted: isTarget,
      actionUrl: `#company-overview`,
      actionLabel: isTarget ? 'Target Set' : 'Set as Target',
    });

    // Step 2: Aptitude Preparation
    if (aptitudeItems.length > 0) {
      roadmapSteps.push({
        stepNumber: roadmapSteps.length + 1,
        id: 'aptitude',
        title: 'Master Aptitude & Quantitative Topics',
        description: `Prepare core topics: ${company.aptitudeTopics.slice(0, 3).join(', ')}${company.aptitudeTopics.length > 3 ? '...' : ''}.`,
        status: completedAptitudeCount === aptitudeItems.length ? 'completed' : completedAptitudeCount > 0 ? 'in_progress' : 'pending',
        isCompleted: completedAptitudeCount === aptitudeItems.length,
        completedCount: completedAptitudeCount,
        totalCount: aptitudeItems.length,
        actionUrl: '/aptitude',
        actionLabel: 'Practice Aptitude',
      });
    }

    // Step 3: Coding Preparation
    if (codingItems.length > 0) {
      roadmapSteps.push({
        stepNumber: roadmapSteps.length + 1,
        id: 'coding',
        title: 'Algorithmic Problem Solving',
        description: `Solve problems on key domains: ${company.codingTopics.slice(0, 3).join(', ')}${company.codingTopics.length > 3 ? '...' : ''}.`,
        status: completedCodingCount === codingItems.length ? 'completed' : completedCodingCount > 0 ? 'in_progress' : 'pending',
        isCompleted: completedCodingCount === codingItems.length,
        completedCount: completedCodingCount,
        totalCount: codingItems.length,
        actionUrl: '/coding',
        actionLabel: 'Solve Coding',
      });
    }

    // Step 4: Technical & HR Interview
    if (interviewItems.length > 0) {
      roadmapSteps.push({
        stepNumber: roadmapSteps.length + 1,
        id: 'interview',
        title: 'Technical & CS Interview Preparation',
        description: `Review fundamental concepts: ${company.interviewTopics.slice(0, 3).join(', ')}${company.interviewTopics.length > 3 ? '...' : ''}.`,
        status: completedInterviewCount === interviewItems.length ? 'completed' : completedInterviewCount > 0 ? 'in_progress' : 'pending',
        isCompleted: completedInterviewCount === interviewItems.length,
        completedCount: completedInterviewCount,
        totalCount: interviewItems.length,
        actionUrl: '#interview-prep',
        actionLabel: 'Review Topics',
      });
    }

    // Step 5: Study Resources
    if (resourceItems.length > 0) {
      roadmapSteps.push({
        stepNumber: roadmapSteps.length + 1,
        id: 'resources',
        title: 'Official Preparation Materials',
        description: `Study through ${resourceItems.length} curated preparation links and study guides.`,
        status: completedResourceCount === resourceItems.length ? 'completed' : completedResourceCount > 0 ? 'in_progress' : 'pending',
        isCompleted: completedResourceCount === resourceItems.length,
        completedCount: completedResourceCount,
        totalCount: resourceItems.length,
        actionUrl: '#company-resources',
        actionLabel: 'Open Resources',
      });
    }

    // Step 6: Full-Length Company Mock Assessments (included only when company-specific mock tests exist)
    if (mockTestItems.length > 0) {
      roadmapSteps.push({
        stepNumber: roadmapSteps.length + 1,
        id: 'mock-tests',
        title: 'Full-Length Company Mock Assessments',
        description: `Simulate actual ${company.name} recruitment rounds with ${mockTestItems.length} curated mock assessment${mockTestItems.length > 1 ? 's' : ''}.`,
        status: completedMockTestCount === mockTestItems.length ? 'completed' : completedMockTestCount > 0 ? 'in_progress' : 'pending',
        isCompleted: completedMockTestCount === mockTestItems.length,
        completedCount: completedMockTestCount,
        totalCount: mockTestItems.length,
        actionUrl: '#company-mock-tests',
        actionLabel: 'Take Mock Tests',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        company: {
          _id: company._id,
          name: company.name,
          slug: company.slug,
          logoUrl: company.logoUrl || '',
          description: company.description || '',
          industry: company.industry || 'Technology',
          website: company.website || '',
          careersUrl: company.careersUrl || '',
          roles: company.roles || [],
          eligibility: company.eligibility || '',
          eligibilityCriteria: company.eligibilityCriteria || null,
          selectionProcess: company.selectionProcess || [],
          isFeatured: Boolean(company.isFeatured),
        },
        eligibility: eligibilityResult,
        roadmap: roadmapSteps,
        sections: {
          aptitude: {
            total: aptitudeItems.length,
            completed: completedAptitudeCount,
            items: aptitudeItems,
          },
          coding: {
            total: codingItems.length,
            completed: completedCodingCount,
            items: codingItems,
          },
          interview: {
            total: interviewItems.length,
            completed: completedInterviewCount,
            items: interviewItems,
          },
          resources: {
            total: resourceItems.length,
            completed: completedResourceCount,
            items: resourceItems,
          },
          mockTests: {
            total: mockTestItems.length,
            completed: completedMockTestCount,
            items: mockTestItems,
          },
        },
        studentProgress: {
          totalTrackableItems,
          completedItems: totalCompletedItems,
          percentage: progressPercentage,
          isTarget,
          isBookmarked: Boolean(bookmarkExists),
          hasStartedPreparation: isTarget || totalCompletedItems > 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/companies/:id/progress
 * Get student's current progress records for this company.
 */
export const getCompanyProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await findActiveCompany(id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const userId = req.user._id;
    const records = await CompanyPreparationProgress.find({
      user: userId,
      company: company._id,
    }).lean();

    res.status(200).json({
      success: true,
      data: {
        companyId: company._id,
        records,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/companies/:id/progress
 * Toggle or update student preparation checklist item in CompanyPreparationProgress.
 */
export const updateCompanyProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { section, itemKey, completed = true } = req.body;

    const company = await findActiveCompany(id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const validSections = ['aptitude', 'coding', 'interview', 'resources', 'general'];
    if (!section || !validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: `Invalid section. Must be one of: ${validSections.join(', ')}`,
      });
    }

    if (!itemKey || typeof itemKey !== 'string' || !itemKey.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid itemKey string is required',
      });
    }

    const userId = req.user._id;

    const progressRecord = await CompanyPreparationProgress.findOneAndUpdate(
      {
        user: userId,
        company: company._id,
        section,
        itemKey: itemKey.trim(),
      },
      {
        completed: Boolean(completed),
        completedAt: new Date(),
      },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      }
    );

    // If student just checked an item, ensure company is recognized in preparation
    res.status(200).json({
      success: true,
      message: 'Preparation progress updated successfully',
      data: {
        record: progressRecord,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/companies/:id/check-eligibility
 * Compare student's profile (or submitted academic criteria) against company's stored criteria.
 */
export const checkStudentEligibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await findActiveCompany(id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const user = await User.findById(req.user._id).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    // Optional override values sent by student during interactive check
    const { cgpa, branch, graduationYear, backlogs } = req.body || {};
    const evalUser = {
      ...user,
      cgpa: cgpa !== undefined ? cgpa : user.cgpa,
      branch: branch !== undefined ? branch : user.branch,
      graduationYear: graduationYear !== undefined ? graduationYear : user.graduationYear,
      backlogs: backlogs !== undefined ? backlogs : user.backlogs,
    };

    const result = evaluateEligibility(evalUser, company);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/companies/:id/target
 * Atomically toggle target company status for authenticated student.
 */
export const toggleTargetCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await findActiveCompany(id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentTargets = Array.isArray(user.targetCompanies) ? user.targetCompanies : [];
    const isCurrentlyTarget = currentTargets.includes(company.name);

    let updatedTargets;
    if (isCurrentlyTarget) {
      updatedTargets = currentTargets.filter((c) => c !== company.name);
    } else {
      updatedTargets = [...new Set([...currentTargets, company.name])];
    }

    user.targetCompanies = updatedTargets;
    await user.save();

    res.status(200).json({
      success: true,
      message: isCurrentlyTarget
        ? `${company.name} removed from your target companies`
        : `${company.name} added to your target companies`,
      data: {
        isTarget: !isCurrentlyTarget,
        companyName: company.name,
        targetCompanies: updatedTargets,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          college: user.college,
          branch: user.branch,
          graduationYear: user.graduationYear,
          cgpa: user.cgpa,
          targetCompanies: updatedTargets,
          preparationGoals: user.preparationGoals,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getCompanies,
  getCompanyById,
  getCompanyPreparation,
  getCompanyProgress,
  updateCompanyProgress,
  checkStudentEligibility,
  toggleTargetCompany,
};
