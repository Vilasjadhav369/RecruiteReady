import PreparationGoal, {
  normalizeGoalText,
  resolveGoalTemplate,
} from '../models/PreparationGoal.js';
import User from '../models/User.js';
import CodingSubmission from '../models/CodingSubmission.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import MockTestAttempt from '../models/MockTestAttempt.js';

/**
 * Synchronize User.preparationGoals string array with active PreparationGoal documents.
 * Ensures the primary 8-field profile completion contract is never broken.
 * Retry-safe and idempotent.
 */
export const syncActiveGoalTextsToUser = async (userId) => {
  const activeGoals = await PreparationGoal.find({ user: userId, isActive: true })
    .sort({ createdAt: 1 })
    .select('text')
    .lean();

  const goalTexts = activeGoals.map((g) => g.text);

  await User.findByIdAndUpdate(
    userId,
    { $set: { preparationGoals: goalTexts } },
    { returnDocument: 'after' }
  );

  return goalTexts;
};

/**
 * Reconciles an incoming string array from legacy PUT /api/auth/profile with PreparationGoal documents.
 * Handles additions, soft-deletions, and reactivations cleanly without multi-document transactions.
 */
export const reconcileGoalsFromStringArray = async (userId, incomingStrings = []) => {
  const sanitizedStrings = (Array.isArray(incomingStrings) ? incomingStrings : [])
    .map((s) => String(s || '').trim().replace(/\s+/g, ' '))
    .filter(Boolean);

  // Build map of incoming normalized keys to display strings
  const incomingMap = new Map();
  sanitizedStrings.forEach((text) => {
    const key = normalizeGoalText(text);
    if (!incomingMap.has(key)) {
      incomingMap.set(key, text);
    }
  });

  // Fetch all existing goal documents for user (both active and inactive)
  const existingDocs = await PreparationGoal.find({ user: userId });
  const existingMap = new Map();
  existingDocs.forEach((doc) => existingMap.set(doc.normalizedKey, doc));

  // 1. Soft-delete active goals that are no longer in incoming array
  for (const doc of existingDocs) {
    if (doc.isActive && !incomingMap.has(doc.normalizedKey)) {
      doc.isActive = false;
      await doc.save();
    }
  }

  // 2. Reactivate or create goals present in incoming array
  for (const [key, text] of incomingMap.entries()) {
    const existing = existingMap.get(key);
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        // Text might have minor casing changes
        existing.text = text;
        // Re-adding a deleted goal resets manual completion
        existing.manualCompleted = false;
        existing.manualCompletedAt = null;
        await existing.save();
      }
    } else {
      // Create new goal record
      const template = resolveGoalTemplate(text);
      await PreparationGoal.create({
        user: userId,
        text,
        normalizedKey: key,
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
  }

  // Synchronize string array on User model to maintain exact parity
  await syncActiveGoalTextsToUser(userId);
};

/**
 * Computes live, verified progress metrics for an array of active goals for a student.
 * Strictly adheres to verified evidence rules:
 * - Coding: Distinct accepted problems.
 * - Aptitude: Aggregate accuracy (sum of correct / sum of total questions) on submitted sessions; min 3 sessions.
 * - Mock Tests: Submitted attempts count.
 * - Manual: Self-reported checklist.
 */
export const calculateGoalsProgress = async (userId, activeGoals = []) => {
  if (!activeGoals || activeGoals.length === 0) {
    return {
      goals: [],
      summary: {
        totalGoals: 0,
        completedGoals: 0,
        overallPercentage: 0,
      },
    };
  }

  // Check if any goals require automated metrics
  const hasCodingMetric = activeGoals.some((g) => g.targetMetric?.metricType === 'coding_distinct_solved');
  const hasAptitudeMetric = activeGoals.some((g) => g.targetMetric?.metricType === 'aptitude_aggregate_accuracy');
  const hasMockMetric = activeGoals.some((g) => g.targetMetric?.metricType === 'mock_submitted_count');

  // Parallel fetch of authoritative student activity records
  const [distinctSolvedProblems, submittedAptAttempts, submittedMockAttemptsCount] = await Promise.all([
    hasCodingMetric
      ? CodingSubmission.distinct('problem', { user: userId, status: 'accepted' })
      : Promise.resolve([]),
    hasAptitudeMetric
      ? AptitudeAttempt.find({ user: userId, status: 'submitted' })
          .select('correctAnswers totalQuestions score percentage')
          .lean()
      : Promise.resolve([]),
    hasMockMetric
      ? MockTestAttempt.countDocuments({ user: userId, status: 'submitted' })
      : Promise.resolve(0),
  ]);

  // 1. Coding Solved Count
  const codingSolvedCount = Array.isArray(distinctSolvedProblems) ? distinctSolvedProblems.length : 0;

  // 2. Aptitude Aggregate Accuracy
  let aptitudeSessionCount = 0;
  let aptitudeTotalQuestions = 0;
  let aptitudeTotalCorrect = 0;
  let aptitudeAggregateAccuracy = null;

  if (Array.isArray(submittedAptAttempts) && submittedAptAttempts.length > 0) {
    aptitudeSessionCount = submittedAptAttempts.length;
    submittedAptAttempts.forEach((att) => {
      aptitudeTotalQuestions += Number(att.totalQuestions) || 0;
      aptitudeTotalCorrect += Number(att.correctAnswers) || 0;
    });

    if (aptitudeTotalQuestions > 0) {
      aptitudeAggregateAccuracy = Math.round((aptitudeTotalCorrect / aptitudeTotalQuestions) * 100);
    }
  }

  // 3. Mock Tests Count
  const mockSubmittedCount = Number(submittedMockAttemptsCount) || 0;

  let completedGoalsCount = 0;

  const enrichedGoals = activeGoals.map((g) => {
    const metricType = g.targetMetric?.metricType || 'manual_checkbox';
    const targetVal = Number(g.targetMetric?.targetValue) || 1;
    const unit = g.targetMetric?.unit || 'milestone';
    const minSessions = Number(g.targetMetric?.minSessions) || 0;

    let calculatedProgress = null;
    let isMetricSatisfied = false;

    if (metricType === 'coding_distinct_solved') {
      const current = codingSolvedCount;
      const pct = Math.min(100, Math.max(0, Math.round((current / targetVal) * 100)));
      isMetricSatisfied = current >= targetVal;

      calculatedProgress = {
        metricType,
        current,
        target: targetVal,
        percentage: pct,
        unit,
        isSatisfied: isMetricSatisfied,
        statusNote: `${current} of ${targetVal} ${unit}`,
      };
    } else if (metricType === 'aptitude_aggregate_accuracy') {
      const currentAcc = aptitudeAggregateAccuracy !== null ? aptitudeAggregateAccuracy : 0;
      const hasEnoughSample = aptitudeSessionCount >= minSessions;
      const pct = Math.min(100, Math.max(0, currentAcc));
      isMetricSatisfied = hasEnoughSample && currentAcc >= targetVal;

      let statusNote = '';
      if (!hasEnoughSample) {
        statusNote = `Sample building: ${aptitudeSessionCount}/${minSessions} tests (Current: ${currentAcc}%)`;
      } else {
        statusNote = `${currentAcc}% aggregate accuracy across ${aptitudeSessionCount} tests`;
      }

      calculatedProgress = {
        metricType,
        current: currentAcc,
        target: targetVal,
        percentage: pct,
        unit,
        sessionCount: aptitudeSessionCount,
        minSessionsRequired: minSessions,
        hasSufficientSample: hasEnoughSample,
        isSatisfied: isMetricSatisfied,
        statusNote,
      };
    } else if (metricType === 'mock_submitted_count') {
      const current = mockSubmittedCount;
      const pct = Math.min(100, Math.max(0, Math.round((current / targetVal) * 100)));
      isMetricSatisfied = current >= targetVal;

      calculatedProgress = {
        metricType,
        current,
        target: targetVal,
        percentage: pct,
        unit,
        isSatisfied: isMetricSatisfied,
        statusNote: `${current} of ${targetVal} ${unit}`,
      };
    }

    // Determine effective completion status
    const isManuallyCompleted = Boolean(g.manualCompleted);
    const isCompleted = isMetricSatisfied || isManuallyCompleted;

    if (isCompleted) {
      completedGoalsCount++;
    }

    let statusLabel = 'In Progress';
    if (isMetricSatisfied) {
      statusLabel = 'Completed (Verified)';
    } else if (isManuallyCompleted) {
      statusLabel = 'Completed (Self-Reported)';
    } else if (!calculatedProgress) {
      statusLabel = 'Not Started';
    }

    return {
      _id: g._id,
      id: g._id,
      text: g.text,
      category: g.category,
      templateKey: g.templateKey,
      evaluationType: calculatedProgress ? 'automated' : 'self_reported',
      calculatedProgress,
      manualCompleted: isManuallyCompleted,
      manualCompletedAt: g.manualCompletedAt || null,
      isCompleted,
      statusLabel,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    };
  });

  const overallPercentage =
    activeGoals.length > 0
      ? Math.round((completedGoalsCount / activeGoals.length) * 100)
      : 0;

  return {
    goals: enrichedGoals,
    summary: {
      totalGoals: activeGoals.length,
      completedGoals: completedGoalsCount,
      overallPercentage,
    },
  };
};
