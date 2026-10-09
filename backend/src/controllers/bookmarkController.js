import mongoose from 'mongoose';
import Bookmark from '../models/Bookmark.js';
import Company from '../models/Company.js';
import CodingProblem from '../models/CodingProblem.js';
import StudyMaterial from '../models/StudyMaterial.js';
import MockTest from '../models/MockTest.js';

const ALLOWED_ITEM_TYPES = ['company', 'coding_problem', 'study_material', 'mock_test'];

/**
 * Verify that the target entity exists in its respective collection and is active/published.
 */
async function verifyItemExists(itemType, itemId) {
  switch (itemType) {
    case 'company':
      return await Company.findOne({ _id: itemId, isActive: true }).select('_id name slug').lean();
    case 'coding_problem':
      return await CodingProblem.findOne({ _id: itemId, isActive: true }).select('_id title slug').lean();
    case 'study_material':
      return await StudyMaterial.findOne({ _id: itemId, isActive: true }).select('_id title').lean();
    case 'mock_test':
      return await MockTest.findOne({ _id: itemId, isPublished: true }).select('_id title slug').lean();
    default:
      return null;
  }
}

/**
 * POST /api/bookmarks
 * Toggle bookmark state for an item.
 * Creates if not exists, removes if already bookmarked.
 */
export const toggleBookmark = async (req, res, next) => {
  try {
    const { itemType, itemId } = req.body;

    if (!itemType || !ALLOWED_ITEM_TYPES.includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid itemType. Allowed: ${ALLOWED_ITEM_TYPES.join(', ')}`,
      });
    }

    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid itemId format',
      });
    }

    const userId = req.user._id;

    // Check if item exists
    const existingBookmark = await Bookmark.findOne({ user: userId, itemType, itemId });

    if (existingBookmark) {
      await Bookmark.deleteOne({ _id: existingBookmark._id });
      return res.status(200).json({
        success: true,
        isBookmarked: false,
        message: 'Bookmark removed successfully',
      });
    }

    // Verify target item actually exists before creating bookmark
    const targetItem = await verifyItemExists(itemType, itemId);
    if (!targetItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found or no longer active',
      });
    }

    const newBookmark = await Bookmark.create({
      user: userId,
      itemType,
      itemId,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      isBookmarked: true,
      message: 'Bookmark saved successfully',
      data: newBookmark,
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key race condition handled gracefully
      return res.status(200).json({
        success: true,
        isBookmarked: true,
        message: 'Bookmark already saved',
      });
    }
    next(error);
  }
};

/**
 * DELETE /api/bookmarks/:itemType/:itemId
 * Explicitly remove a bookmark.
 */
export const removeBookmark = async (req, res, next) => {
  try {
    const { itemType, itemId } = req.params;

    if (!ALLOWED_ITEM_TYPES.includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid itemType',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid itemId',
      });
    }

    const userId = req.user._id;
    await Bookmark.deleteOne({ user: userId, itemType, itemId });

    res.status(200).json({
      success: true,
      isBookmarked: false,
      message: 'Bookmark removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookmarks/status/:itemType/:itemId
 * Check if the item is bookmarked by the authenticated user.
 */
export const getBookmarkStatus = async (req, res, next) => {
  try {
    const { itemType, itemId } = req.params;

    if (!ALLOWED_ITEM_TYPES.includes(itemType) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(200).json({
        success: true,
        isBookmarked: false,
      });
    }

    const userId = req.user._id;
    const exists = await Bookmark.exists({ user: userId, itemType, itemId });

    res.status(200).json({
      success: true,
      isBookmarked: Boolean(exists),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookmarks
 * List authenticated user's bookmarks with populated item details and category counts.
 */
export const getBookmarks = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { itemType, page = 1, limit = 20 } = req.query;

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (safePage - 1) * safeLimit;

    const filter = { user: userId };
    if (itemType && ALLOWED_ITEM_TYPES.includes(itemType)) {
      filter.itemType = itemType;
    }

    // Run query and counts in parallel
    const [bookmarks, total, countAll, countCompany, countCoding, countResource, countMock] =
      await Promise.all([
        Bookmark.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
        Bookmark.countDocuments(filter),
        Bookmark.countDocuments({ user: userId }),
        Bookmark.countDocuments({ user: userId, itemType: 'company' }),
        Bookmark.countDocuments({ user: userId, itemType: 'coding_problem' }),
        Bookmark.countDocuments({ user: userId, itemType: 'study_material' }),
        Bookmark.countDocuments({ user: userId, itemType: 'mock_test' }),
      ]);

    // Group itemIds by type for batch lookups
    const idsByType = {
      company: [],
      coding_problem: [],
      study_material: [],
      mock_test: [],
    };

    bookmarks.forEach((b) => {
      if (idsByType[b.itemType]) {
        idsByType[b.itemType].push(b.itemId);
      }
    });

    // Batch fetch details
    const [companies, codingProblems, studyMaterials, mockTests] = await Promise.all([
      idsByType.company.length
        ? Company.find({ _id: { $in: idsByType.company } })
            .select('name slug industry description logoUrl isActive')
            .lean()
        : [],
      idsByType.coding_problem.length
        ? CodingProblem.find({ _id: { $in: idsByType.coding_problem } })
            .select('title slug difficulty category isActive')
            .lean()
        : [],
      idsByType.study_material.length
        ? StudyMaterial.find({ _id: { $in: idsByType.study_material } })
            .select('title category topic type description isActive')
            .lean()
        : [],
      idsByType.mock_test.length
        ? MockTest.find({ _id: { $in: idsByType.mock_test } })
            .select('title slug durationMinutes totalQuestions categories difficulty isPublished')
            .lean()
        : [],
    ]);

    const companyMap = new Map(companies.map((c) => [c._id.toString(), c]));
    const codingMap = new Map(codingProblems.map((c) => [c._id.toString(), c]));
    const resourceMap = new Map(studyMaterials.map((r) => [r._id.toString(), r]));
    const mockMap = new Map(mockTests.map((m) => [m._id.toString(), m]));

    // Format bookmarks
    const formatted = bookmarks
      .map((b) => {
        const idStr = b.itemId.toString();
        let itemData = null;
        let formattedItem = null;

        if (b.itemType === 'company') {
          itemData = companyMap.get(idStr);
          if (itemData) {
            formattedItem = {
              title: itemData.name,
              subtitle: itemData.industry || 'Technology',
              description: itemData.description ? itemData.description.slice(0, 120) + '...' : '',
              link: `/companies/${itemData.slug || itemData._id}`,
              metaBadge: 'Company',
              isActive: itemData.isActive !== false,
            };
          }
        } else if (b.itemType === 'coding_problem') {
          itemData = codingMap.get(idStr);
          if (itemData) {
            formattedItem = {
              title: itemData.title,
              subtitle: `${itemData.category || 'Algorithms'} • ${itemData.difficulty || 'Medium'}`,
              description: '',
              link: `/coding/problem/${itemData.slug || itemData._id}`,
              metaBadge: itemData.difficulty || 'Problem',
              isActive: itemData.isActive !== false,
            };
          }
        } else if (b.itemType === 'study_material') {
          itemData = resourceMap.get(idStr);
          if (itemData) {
            formattedItem = {
              title: itemData.title,
              subtitle: `${itemData.category || 'General'} • ${itemData.type ? itemData.type.toUpperCase() : 'RESOURCE'}`,
              description: itemData.description ? itemData.description.slice(0, 120) + '...' : '',
              link: `/resources/${itemData._id}`,
              metaBadge: itemData.type || 'Resource',
              isActive: itemData.isActive !== false,
            };
          }
        } else if (b.itemType === 'mock_test') {
          itemData = mockMap.get(idStr);
          if (itemData) {
            formattedItem = {
              title: itemData.title,
              subtitle: `${itemData.durationMinutes} mins • ${itemData.totalQuestions} Questions • ${itemData.difficulty || 'Medium'}`,
              description: '',
              link: `/mock-tests/${itemData.slug || itemData._id}`,
              metaBadge: 'Mock Test',
              isActive: itemData.isPublished !== false,
            };
          }
        }

        return {
          id: b._id,
          itemType: b.itemType,
          itemId: b.itemId,
          createdAt: b.createdAt,
          item: formattedItem,
        };
      })
      .filter((b) => b.item !== null); // Drop references to items that no longer exist

    const totalPages = Math.ceil(total / safeLimit) || 1;

    res.status(200).json({
      success: true,
      data: {
        items: formatted,
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        counts: {
          all: countAll,
          company: countCompany,
          coding_problem: countCoding,
          study_material: countResource,
          mock_test: countMock,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  toggleBookmark,
  removeBookmark,
  getBookmarkStatus,
  getBookmarks,
};
