import mongoose from 'mongoose';
import PreparationGoal, {
  normalizeGoalText,
  resolveGoalTemplate,
  PREDEFINED_GOAL_CATALOG,
} from '../models/PreparationGoal.js';
import User from '../models/User.js';
import {
  syncActiveGoalTextsToUser,
  calculateGoalsProgress,
  reconcileGoalsFromStringArray,
} from '../services/goalService.js';

/**
 * GET /api/goals
 * Returns authenticated student's active preparation goals with authoritative,
 * calculated live progress and self-reported completion states.
 * IDEMPOTENT: Never mutates goal or manual completion state.
 */
export const getGoals = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch active goals - strictly read-only, never mutates database during GET
    const activeGoals = await PreparationGoal.find({ user: userId, isActive: true })
      .sort({ createdAt: 1 })
      .lean();

    const { goals, summary } = await calculateGoalsProgress(userId, activeGoals);

    res.status(200).json({
      success: true,
      data: {
        goals,
        summary,
        catalog: Object.values(PREDEFINED_GOAL_CATALOG),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/goals
 * Creates a new preparation goal or reactivates an existing soft-deleted one.
 * Prevents active duplicate goals. Enforces maximum length and validation.
 */
export const createGoal = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { text, templateKey = null } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, message: 'Goal text is required' });
    }

    const cleanText = text.trim().replace(/\s+/g, ' ');
    if (!cleanText) {
      return res.status(400).json({ success: false, message: 'Goal text cannot be blank' });
    }

    if (cleanText.length > 100) {
      return res.status(400).json({ success: false, message: 'Goal text cannot exceed 100 characters' });
    }

    const normalizedKey = normalizeGoalText(cleanText);

    // Check if goal already exists for user
    const existing = await PreparationGoal.findOne({ user: userId, normalizedKey });

    if (existing && existing.isActive) {
      return res.status(409).json({
        success: false,
        message: 'A goal with this description is already active on your profile',
      });
    }

    let goalDoc;
    if (existing && !existing.isActive) {
      // Reactivate existing soft-deleted goal document
      existing.isActive = true;
      existing.text = cleanText;
      existing.manualCompleted = false; // Reset manual completion on re-add
      existing.manualCompletedAt = null;
      await existing.save();
      goalDoc = existing;
    } else {
      // Create new goal record
      const template = resolveGoalTemplate(cleanText, templateKey);
      goalDoc = await PreparationGoal.create({
        user: userId,
        text: cleanText,
        normalizedKey,
        templateKey: template.templateKey,
        category: template.category,
        targetMetric: {
          metricType: template.metricType,
          targetValue: template.targetValue,
          unit: template.unit,
          minSessions: template.minSessions,
        },
        isActive: true,
        manualCompleted: false,
      });
    }

    // Synchronize User.preparationGoals string array
    await syncActiveGoalTextsToUser(userId);

    // Return created goal enriched with progress
    const { goals } = await calculateGoalsProgress(userId, [goalDoc.toObject ? goalDoc.toObject() : goalDoc]);

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: {
        goal: goals[0],
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A goal with this description is already active on your profile',
      });
    }
    next(error);
  }
};

/**
 * PATCH /api/goals/:id
 * Edits permitted goal fields (text).
 * Prevents arbitrary manipulation of ownership or metric calculations.
 */
export const updateGoal = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID' });
    }

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, message: 'Goal text is required' });
    }

    const cleanText = text.trim().replace(/\s+/g, ' ');
    if (!cleanText) {
      return res.status(400).json({ success: false, message: 'Goal text cannot be blank' });
    }

    if (cleanText.length > 100) {
      return res.status(400).json({ success: false, message: 'Goal text cannot exceed 100 characters' });
    }

    const goal = await PreparationGoal.findOne({ _id: id, user: userId, isActive: true });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const newNormalizedKey = normalizeGoalText(cleanText);

    // If changing text to a normalized key that matches another active goal
    if (newNormalizedKey !== goal.normalizedKey) {
      const conflict = await PreparationGoal.findOne({
        user: userId,
        normalizedKey: newNormalizedKey,
        isActive: true,
        _id: { $ne: goal._id },
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: 'Another active goal already exists with this description',
        });
      }

      goal.text = cleanText;
      goal.normalizedKey = newNormalizedKey;
    } else {
      goal.text = cleanText;
    }

    // Re-evaluate server-authoritative catalog mapping for the updated text
    // If the text no longer matches a predefined catalog entry, strictly downgrade to custom/manual_checkbox
    const reevaluated = resolveGoalTemplate(cleanText);
    goal.templateKey = reevaluated.templateKey;
    goal.category = reevaluated.category;
    goal.targetMetric = {
      metricType: reevaluated.metricType,
      targetValue: reevaluated.targetValue,
      unit: reevaluated.unit,
      minSessions: reevaluated.minSessions,
    };

    await goal.save();

    // Synchronize User.preparationGoals string array
    await syncActiveGoalTextsToUser(userId);

    const { goals } = await calculateGoalsProgress(userId, [goal.toObject ? goal.toObject() : goal]);

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: {
        goal: goals[0],
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Another active goal already exists with this description',
      });
    }
    next(error);
  }
};

/**
 * PATCH /api/goals/:id/toggle
 * Updates explicitly self-reported completion state (complete/reopen).
 * Does not mutate assessment records or calculated metric values.
 */
export const toggleGoal = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { completed } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID' });
    }

    if (!req.body || typeof completed !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Explicit boolean field "completed" (true or false) is required',
      });
    }

    const goal = await PreparationGoal.findOne({ _id: id, user: userId, isActive: true });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    // Idempotent assignment: setting the explicit requested state
    goal.manualCompleted = completed;
    goal.manualCompletedAt = completed ? (goal.manualCompletedAt || new Date()) : null;
    await goal.save();

    const { goals } = await calculateGoalsProgress(userId, [goal.toObject ? goal.toObject() : goal]);

    res.status(200).json({
      success: true,
      message: completed ? 'Goal marked as complete' : 'Goal reopened',
      data: {
        goal: goals[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/goals/:id
 * Soft-deletes a goal (isActive: false) and updates User.preparationGoals array.
 */
export const deleteGoal = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID' });
    }

    const goal = await PreparationGoal.findOne({ _id: id, user: userId, isActive: true });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    goal.isActive = false;
    await goal.save();

    // Synchronize User.preparationGoals string array
    await syncActiveGoalTextsToUser(userId);

    res.status(200).json({
      success: true,
      message: 'Goal removed successfully',
      data: {
        deletedId: id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/goals/sync
 * Controlled write-path recovery endpoint to reconcile PreparationGoal documents
 * with User.preparationGoals string array if any discrepancy occurred.
 * Safe, idempotent, and retryable.
 */
export const syncGoals = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userDoc = await User.findById(userId).select('preparationGoals').lean();
    const rawStrings = Array.isArray(userDoc?.preparationGoals) ? userDoc.preparationGoals : [];

    await reconcileGoalsFromStringArray(userId, rawStrings);

    const activeGoals = await PreparationGoal.find({ user: userId, isActive: true })
      .sort({ createdAt: 1 })
      .lean();

    const { goals, summary } = await calculateGoalsProgress(userId, activeGoals);

    res.status(200).json({
      success: true,
      message: 'Goals reconciled successfully',
      data: {
        goals,
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};
