/**
 * Shared Profile Completion Calculator for RecruitReady.
 *
 * Evaluates completion strictly from authentic database user fields.
 * Transparent, deterministic, and identical across ProfilePage and Dashboard.
 *
 * Evaluated Fields (8 Total):
 * 1. firstName: string non-empty
 * 2. lastName: string non-empty
 * 3. profilePhoto: string non-empty
 * 4. college: string non-empty
 * 5. branch: string non-empty
 * 6. graduationYear: valid year between 2000 and 2100
 * 7. targetCompanies: array with length > 0
 * 8. preparationGoals: array with length > 0
 */
export function calculateProfileCompletion(user) {
  if (!user) {
    return {
      percentage: 0,
      completedCount: 0,
      totalCount: 8,
      fields: [],
      isComplete: false,
    };
  }

  const fields = [
    {
      key: 'firstName',
      label: 'First Name',
      category: 'Personal',
      completed: Boolean(user.firstName?.trim()),
    },
    {
      key: 'lastName',
      label: 'Last Name',
      category: 'Personal',
      completed: Boolean(user.lastName?.trim()),
    },
    {
      key: 'profilePhoto',
      label: 'Profile Photo',
      category: 'Personal',
      completed: Boolean(user.profilePhoto?.trim()),
    },
    {
      key: 'college',
      label: 'College / University',
      category: 'Academic',
      completed: Boolean(user.college?.trim()),
    },
    {
      key: 'branch',
      label: 'Branch / Department',
      category: 'Academic',
      completed: Boolean(user.branch?.trim()),
    },
    {
      key: 'graduationYear',
      label: 'Graduation Year',
      category: 'Academic',
      completed: Boolean(
        user.graduationYear &&
        !isNaN(Number(user.graduationYear)) &&
        Number(user.graduationYear) >= 2000 &&
        Number(user.graduationYear) <= 2100
      ),
    },
    {
      key: 'preparationLevel',
      label: 'Preparation Level',
      category: 'Preparation',
      completed: Boolean(user.preparationLevel?.trim()),
    },
    {
      key: 'targetCompanies',
      label: 'Target Companies',
      category: 'Preparation',
      completed: Array.isArray(user.targetCompanies) && user.targetCompanies.length > 0,
    },
    {
      key: 'preparationGoals',
      label: 'Preparation Goals',
      category: 'Preparation',
      completed: Array.isArray(user.preparationGoals) && user.preparationGoals.length > 0,
    },
  ];

  const completedCount = fields.filter((f) => f.completed).length;
  const totalCount = fields.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return {
    percentage,
    completedCount,
    totalCount,
    fields,
    isComplete: completedCount === totalCount,
  };
}

export default calculateProfileCompletion;
