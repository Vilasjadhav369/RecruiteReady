import mongoose from 'mongoose';
import Company from '../models/Company.js';

/**
 * GET /api/companies
 * List all active companies with search and filters.
 */
export const getCompanies = async (req, res, next) => {
  try {
    const { search = '', industry = '', page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { roles: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    if (industry && industry !== 'all') {
      query.industry = industry;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const total = await Company.countDocuments(query);
    const companies = await Company.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        companies,
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
 * Retrieve company details by ID or slug.
 */
export const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let company;

    if (mongoose.Types.ObjectId.isValid(id)) {
      company = await Company.findOne({ _id: id, isActive: true });
    } else {
      company = await Company.findOne({ slug: id, isActive: true });
    }

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company profile not found' });
    }

    res.status(200).json({
      success: true,
      data: { company },
    });
  } catch (error) {
    next(error);
  }
};
