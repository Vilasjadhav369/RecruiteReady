import mongoose from 'mongoose';
import StudyMaterial from '../models/StudyMaterial.js';

/**
 * GET /api/resources
 * List active study materials with search, type, category, and topic filters.
 */
export const getResources = async (req, res, next) => {
  try {
    const { search = '', type = '', category = '', topic = '', page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    const cleanSearch = (search && search !== 'undefined' && search !== 'null') ? search.trim() : '';
    if (cleanSearch) {
      query.$or = [
        { title: { $regex: cleanSearch, $options: 'i' } },
        { description: { $regex: cleanSearch, $options: 'i' } },
        { topic: { $regex: cleanSearch, $options: 'i' } },
      ];
    }
    if (type && type !== 'all' && type !== 'undefined' && type !== 'null') {
      query.type = type.toLowerCase();
    }
    if (category && category !== 'all' && category !== 'undefined' && category !== 'null') {
      query.category = category;
    }
    if (topic && topic !== 'all' && topic !== 'undefined' && topic !== 'null') {
      query.topic = topic;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
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
 * GET /api/resources/:id
 * Retrieve a single resource.
 */
export const getResourceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID' });
    }

    const resource = await StudyMaterial.findOne({ _id: id, isActive: true });
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    res.status(200).json({
      success: true,
      data: { resource },
    });
  } catch (error) {
    next(error);
  }
};
