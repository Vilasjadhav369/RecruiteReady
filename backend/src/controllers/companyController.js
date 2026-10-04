import mongoose from 'mongoose';
import Company from '../models/Company.js';
import User from '../models/User.js';
import StudyMaterial from '../models/StudyMaterial.js';

/**
 * GET /api/companies
 * List all active companies with search, filters, available industries, and target status.
 */
export const getCompanies = async (req, res, next) => {
  try {
    const { search = '', industry = '', targetOnly = 'false', page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    const cleanSearch = (search && search !== 'undefined' && search !== 'null') ? search.trim() : '';
    if (cleanSearch) {
      query.$or = [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { roles: { $regex: cleanSearch, $options: 'i' } },
        { industry: { $regex: cleanSearch, $options: 'i' } },
        { aptitudeTopics: { $regex: cleanSearch, $options: 'i' } },
        { codingTopics: { $regex: cleanSearch, $options: 'i' } },
      ];
    }
    if (industry && industry !== 'all' && industry !== 'undefined' && industry !== 'null') {
      query.industry = industry;
    }

    const userTargets = (req.user && Array.isArray(req.user.targetCompanies)) ? req.user.targetCompanies : [];

    if (targetOnly === 'true') {
      query.name = { $in: userTargets };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [total, rawCompanies, availableIndustries] = await Promise.all([
      Company.countDocuments(query),
      Company.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Company.distinct('industry', { isActive: true }),
    ]);

    // Attach real target company state derived from user profile
    const companies = rawCompanies.map((c) => ({
      ...c,
      isTarget: userTargets.includes(c.name),
    }));

    res.status(200).json({
      success: true,
      data: {
        companies,
        availableIndustries: availableIndustries.filter(Boolean).sort(),
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
 * Retrieve company details by ID or slug with real target status and linked resources.
 */
export const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let company;

    if (mongoose.Types.ObjectId.isValid(id)) {
      company = await Company.findOne({ _id: id, isActive: true }).lean();
    } else {
      company = await Company.findOne({ slug: id, isActive: true }).lean();
    }

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company profile not found' });
    }

    const userTargets = (req.user && Array.isArray(req.user.targetCompanies)) ? req.user.targetCompanies : [];
    const isTarget = userTargets.includes(company.name);

    // Look up any matching study materials associated with this company or topics
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

    res.status(200).json({
      success: true,
      data: { 
        company: {
          ...company,
          isTarget,
          relatedMaterials: relatedMaterials || [],
        },
      },
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
    let company;

    if (mongoose.Types.ObjectId.isValid(id)) {
      company = await Company.findOne({ _id: id, isActive: true });
    } else {
      company = await Company.findOne({ slug: id, isActive: true });
    }

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
      updatedTargets = [...currentTargets, company.name];
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
          targetCompanies: updatedTargets,
          preparationGoals: user.preparationGoals,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
