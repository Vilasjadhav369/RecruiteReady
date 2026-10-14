/**
 * Shared Profile Completion Calculator for RecruitReady.
 *
 * Implements the authoritative 8-field weighted completion contract (100% total):
 * 1. firstName: string non-empty (10%)
 * 2. lastName: string non-empty (10%)
 * 3. college: string non-empty (15%)
 * 4. branch: string non-empty (15%)
 * 5. graduationYear: valid year between 2000 and 2100 (10%)
 * 6. preparationLevel: string non-empty (15%)
 * 7. targetCompanies: array with length > 0 (15%)
 * 8. preparationGoals: array with length > 0 (10%)
 *
 * Excluded from profile completion:
 * - profilePhoto: Optional visual asset, does not block 100% completeness.
 * - cgpa & backlogs: Academic eligibility criteria, not base completeness requirements.
 */

export const PROFILE_COMPLETION_FIELDS = [
  {
    key: 'firstName',
    label: 'First Name',
    category: 'Personal',
    weight: 10,
    check: (user) => typeof user?.firstName === 'string' && user.firstName.trim().length > 0,
  },
  {
    key: 'lastName',
    label: 'Last Name',
    category: 'Personal',
    weight: 10,
    check: (user) => typeof user?.lastName === 'string' && user.lastName.trim().length > 0,
  },
  {
    key: 'college',
    label: 'College / University',
    category: 'Academic',
    weight: 15,
    check: (user) => typeof user?.college === 'string' && user.college.trim().length > 0,
  },
  {
    key: 'branch',
    label: 'Branch / Department',
    category: 'Academic',
    weight: 15,
    check: (user) => typeof user?.branch === 'string' && user.branch.trim().length > 0,
  },
  {
    key: 'graduationYear',
    label: 'Graduation Year',
    category: 'Academic',
    weight: 10,
    check: (user) => {
      if (user?.graduationYear === null || user?.graduationYear === undefined || user?.graduationYear === '') {
        return false;
      }
      const num = Number(user.graduationYear);
      return !isNaN(num) && Number.isInteger(num) && num >= 2000 && num <= 2100;
    },
  },
  {
    key: 'preparationLevel',
    label: 'Preparation Level',
    category: 'Preparation',
    weight: 15,
    check: (user) => typeof user?.preparationLevel === 'string' && user.preparationLevel.trim().length > 0,
  },
  {
    key: 'targetCompanies',
    label: 'Target Companies',
    category: 'Preparation',
    weight: 15,
    check: (user) => {
      if (!Array.isArray(user?.targetCompanies) || user.targetCompanies.length === 0) return false;
      return user.targetCompanies.some((item) => {
        if (!item) return false;
        if (typeof item === 'string') return item.trim().length > 0;
        if (typeof item === 'object') return Boolean(item._id || (typeof item.name === 'string' && item.name.trim().length > 0));
        return true;
      });
    },
  },
  {
    key: 'preparationGoals',
    label: 'Preparation Goals',
    category: 'Preparation',
    weight: 10,
    check: (user) => {
      if (!Array.isArray(user?.preparationGoals) || user.preparationGoals.length === 0) return false;
      return user.preparationGoals.some((item) => {
        if (!item) return false;
        if (typeof item === 'string') return item.trim().length > 0;
        return true;
      });
    },
  },
];

/**
 * Calculates profile completion percentage, completed counts, and field breakdowns.
 * Transparent, deterministic, and identical across ProfilePage, Dashboard, and Progress analytics.
 *
 * @param {Object} user - User record or draft user object
 * @returns {Object} Completion details
 */
export function calculateProfileCompletion(user) {
  if (!user) {
    return {
      percentage: 0,
      completedCount: 0,
      totalCount: PROFILE_COMPLETION_FIELDS.length,
      fields: PROFILE_COMPLETION_FIELDS.map((f) => ({
        key: f.key,
        label: f.label,
        category: f.category,
        weight: f.weight,
        completed: false,
      })),
      completedFields: [],
      missingFields: PROFILE_COMPLETION_FIELDS.map((f) => ({
        key: f.key,
        label: f.label,
        weight: f.weight,
      })),
      isComplete: false,
    };
  }

  let earnedPercentage = 0;
  const completedFields = [];
  const missingFields = [];

  const fields = PROFILE_COMPLETION_FIELDS.map((f) => {
    const isCompleted = Boolean(f.check(user));
    if (isCompleted) {
      earnedPercentage += f.weight;
      completedFields.push({ key: f.key, label: f.label, weight: f.weight });
    } else {
      missingFields.push({ key: f.key, label: f.label, weight: f.weight });
    }

    return {
      key: f.key,
      label: f.label,
      category: f.category,
      weight: f.weight,
      completed: isCompleted,
    };
  });

  const completedCount = completedFields.length;
  const totalCount = PROFILE_COMPLETION_FIELDS.length;
  const percentage = Math.min(100, Math.round(earnedPercentage));

  return {
    percentage,
    completedCount,
    totalCount,
    fields,
    completedFields,
    missingFields,
    isComplete: completedCount === totalCount && percentage === 100,
  };
}

/**
 * Returns list of missing profile fields for quick checklist reference.
 *
 * @param {Object} user - User record
 * @returns {Array} Array of missing field objects
 */
export function getMissingProfileFields(user) {
  return calculateProfileCompletion(user).missingFields;
}

export default calculateProfileCompletion;
