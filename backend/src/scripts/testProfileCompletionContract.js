/**
 * Unit Test Suite for Profile Completion Utilities (P1.2B-3)
 *
 * Validates the authoritative 8-field weighted contract across Frontend, Dashboard, and Progress:
 * - firstName: 10%
 * - lastName: 10%
 * - college: 15%
 * - branch: 15%
 * - graduationYear: 10%
 * - preparationLevel: 15%
 * - targetCompanies: 15%
 * - preparationGoals: 10%
 * Total: 100%
 *
 * Checks:
 * 1. Graduation years: 1999 (invalid), 2000 (valid boundary), 2100 (valid boundary), 2101 (invalid).
 * 2. Empty arrays, arrays containing only whitespace/falsy strings, and arrays with at least one valid entry.
 * 3. Whitespace-only strings across all string fields.
 * 4. Complete profile without photo returning 100%.
 * 5. Identical percentages across frontend, dashboard controller logic, and progress controller logic for edge cases.
 */

import { calculateProfileCompletion, getMissingProfileFields, PROFILE_COMPLETION_FIELDS } from '../../../frontend/src/utils/profileCompletion.js';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName}: ${details}`);
  }
}

// Emulate backend calculation logic exactly as written in dashboardController & progressController
function calculateBackendDashboardPercentage(user) {
  if (!user) return 0;
  const profileFields = [
    { key: 'firstName', weight: 10, check: typeof user.firstName === 'string' && user.firstName.trim().length > 0 },
    { key: 'lastName', weight: 10, check: typeof user.lastName === 'string' && user.lastName.trim().length > 0 },
    { key: 'college', weight: 15, check: typeof user.college === 'string' && user.college.trim().length > 0 },
    { key: 'branch', weight: 15, check: typeof user.branch === 'string' && user.branch.trim().length > 0 },
    {
      key: 'graduationYear',
      weight: 10,
      check: (() => {
        if (user.graduationYear === null || user.graduationYear === undefined || user.graduationYear === '') return false;
        const num = Number(user.graduationYear);
        return !isNaN(num) && Number.isInteger(num) && num >= 2000 && num <= 2100;
      })(),
    },
    { key: 'preparationLevel', weight: 15, check: typeof user.preparationLevel === 'string' && user.preparationLevel.trim().length > 0 },
    {
      key: 'targetCompanies',
      weight: 15,
      check: Array.isArray(user.targetCompanies) && user.targetCompanies.some((item) => {
        if (!item) return false;
        if (typeof item === 'string') return item.trim().length > 0;
        if (typeof item === 'object') return Boolean(item._id || (typeof item.name === 'string' && item.name.trim().length > 0));
        return true;
      }),
    },
    {
      key: 'preparationGoals',
      weight: 10,
      check: Array.isArray(user.preparationGoals) && user.preparationGoals.some((item) => {
        if (!item) return false;
        if (typeof item === 'string') return item.trim().length > 0;
        return true;
      }),
    },
  ];
  let total = 0;
  profileFields.forEach((f) => {
    if (f.check) total += f.weight;
  });
  return Math.min(100, Math.round(total));
}

function calculateBackendProgressPercentage(user) {
  if (!user) return 0;
  const profileFields = [
    { key: 'firstName', weight: 10, check: typeof user?.firstName === 'string' && user.firstName.trim().length > 0 },
    { key: 'lastName', weight: 10, check: typeof user?.lastName === 'string' && user.lastName.trim().length > 0 },
    { key: 'college', weight: 15, check: typeof user?.college === 'string' && user.college.trim().length > 0 },
    { key: 'branch', weight: 15, check: typeof user?.branch === 'string' && user.branch.trim().length > 0 },
    {
      key: 'graduationYear',
      weight: 10,
      check: (() => {
        if (user?.graduationYear === null || user?.graduationYear === undefined || user?.graduationYear === '') return false;
        const num = Number(user.graduationYear);
        return !isNaN(num) && Number.isInteger(num) && num >= 2000 && num <= 2100;
      })(),
    },
    { key: 'preparationLevel', weight: 15, check: typeof user?.preparationLevel === 'string' && user.preparationLevel.trim().length > 0 },
    {
      key: 'targetCompanies',
      weight: 15,
      check: Array.isArray(user?.targetCompanies) && user.targetCompanies.some((item) => {
        if (!item) return false;
        if (typeof item === 'string') return item.trim().length > 0;
        if (typeof item === 'object') return Boolean(item._id || (typeof item.name === 'string' && item.name.trim().length > 0));
        return true;
      }),
    },
    {
      key: 'preparationGoals',
      weight: 10,
      check: Array.isArray(user?.preparationGoals) && user.preparationGoals.some((item) => {
        if (!item) return false;
        if (typeof item === 'string') return item.trim().length > 0;
        return true;
      }),
    },
  ];
  let total = 0;
  profileFields.forEach((f) => {
    if (f.check) total += f.weight;
  });
  return Math.min(100, Math.round(total));
}

console.log('===============================================================');
console.log(' PROFILE COMPLETION CONTRACT & CROSS-SURFACE ALIGNMENT TESTS');
console.log('===============================================================\n');

// 1. Structure & Weights Validation
console.log('--- SECTION 1: Contract Structure & Weights ---');
assert(PROFILE_COMPLETION_FIELDS.length === 8, 'Contract defines exactly 8 fields');
const totalWeight = PROFILE_COMPLETION_FIELDS.reduce((sum, f) => sum + f.weight, 0);
assert(totalWeight === 100, `Sum of field weights is exactly 100% (actual: ${totalWeight}%)`);
assert(PROFILE_COMPLETION_FIELDS.find((f) => f.key === 'profilePhoto') === undefined, 'profilePhoto excluded from fields');
assert(PROFILE_COMPLETION_FIELDS.find((f) => f.key === 'cgpa') === undefined, 'cgpa excluded from fields');
assert(PROFILE_COMPLETION_FIELDS.find((f) => f.key === 'backlogs') === undefined, 'backlogs excluded from fields');

// 2. Empty Profile
console.log('\n--- SECTION 2: Empty & Null Profile ---');
const emptyRes = calculateProfileCompletion(null);
assert(emptyRes.percentage === 0, 'Null user returns 0%');
assert(calculateBackendDashboardPercentage(null) === 0, 'Backend dashboard returns 0% for null');
assert(calculateBackendProgressPercentage(null) === 0, 'Backend progress returns 0% for null');

// 3. Complete Profile Without Photo
console.log('\n--- SECTION 3: Complete Profile Without Photo ---');
const completeUserWithoutPhoto = {
  firstName: 'Jane',
  lastName: 'Doe',
  college: 'IIT Madras',
  branch: 'Computer Science',
  graduationYear: 2026,
  preparationLevel: 'Intermediate',
  targetCompanies: ['Google', 'Microsoft'],
  preparationGoals: ['Ace Algorithms', 'Mock Interviews'],
  profilePhoto: null,
};
const fullNoPhoto = calculateProfileCompletion(completeUserWithoutPhoto);
assert(fullNoPhoto.percentage === 100, 'Frontend scores complete user without photo as 100%');
assert(calculateBackendDashboardPercentage(completeUserWithoutPhoto) === 100, 'Dashboard scores complete user without photo as 100%');
assert(calculateBackendProgressPercentage(completeUserWithoutPhoto) === 100, 'Progress scores complete user without photo as 100%');

// 4. Graduation Year Boundary Testing (1999, 2000, 2100, 2101)
console.log('\n--- SECTION 4: Graduation Year Boundary Tests ---');
const userYear1999 = { ...completeUserWithoutPhoto, graduationYear: 1999 };
const userYear2000 = { ...completeUserWithoutPhoto, graduationYear: 2000 };
const userYear2100 = { ...completeUserWithoutPhoto, graduationYear: 2100 };
const userYear2101 = { ...completeUserWithoutPhoto, graduationYear: 2101 };
const userYearFloat = { ...completeUserWithoutPhoto, graduationYear: 2024.5 };

assert(calculateProfileCompletion(userYear1999).percentage === 90, 'Year 1999 is invalid (-10% -> 90%)');
assert(calculateBackendDashboardPercentage(userYear1999) === 90, 'Dashboard year 1999 is 90%');
assert(calculateBackendProgressPercentage(userYear1999) === 90, 'Progress year 1999 is 90%');

assert(calculateProfileCompletion(userYear2000).percentage === 100, 'Year 2000 boundary is valid (100%)');
assert(calculateBackendDashboardPercentage(userYear2000) === 100, 'Dashboard year 2000 boundary is 100%');
assert(calculateBackendProgressPercentage(userYear2000) === 100, 'Progress year 2000 boundary is 100%');

assert(calculateProfileCompletion(userYear2100).percentage === 100, 'Year 2100 boundary is valid (100%)');
assert(calculateBackendDashboardPercentage(userYear2100) === 100, 'Dashboard year 2100 boundary is 100%');
assert(calculateBackendProgressPercentage(userYear2100) === 100, 'Progress year 2100 boundary is 100%');

assert(calculateProfileCompletion(userYear2101).percentage === 90, 'Year 2101 is invalid (-10% -> 90%)');
assert(calculateBackendDashboardPercentage(userYear2101) === 90, 'Dashboard year 2101 is 90%');
assert(calculateBackendProgressPercentage(userYear2101) === 90, 'Progress year 2101 is 90%');

assert(calculateProfileCompletion(userYearFloat).percentage === 90, 'Non-integer year 2024.5 is invalid (-10% -> 90%)');

// 5. Target Companies & Preparation Goals Array Validation
console.log('\n--- SECTION 5: Target Companies & Preparation Goals Validation ---');
const userEmptyArrays = {
  ...completeUserWithoutPhoto,
  targetCompanies: [],
  preparationGoals: [],
};
assert(calculateProfileCompletion(userEmptyArrays).percentage === 75, 'Empty arrays deduct 25% (100 - 15 - 10 = 75%)');
assert(calculateBackendDashboardPercentage(userEmptyArrays) === 75, 'Dashboard empty arrays = 75%');
assert(calculateBackendProgressPercentage(userEmptyArrays) === 75, 'Progress empty arrays = 75%');

const userWhitespaceArrays = {
  ...completeUserWithoutPhoto,
  targetCompanies: ['   ', '\t', ''],
  preparationGoals: ['   ', ''],
};
assert(calculateProfileCompletion(userWhitespaceArrays).percentage === 75, 'Whitespace-only arrays deduct 25% (actual 75%)');
assert(calculateBackendDashboardPercentage(userWhitespaceArrays) === 75, 'Dashboard whitespace arrays = 75%');
assert(calculateBackendProgressPercentage(userWhitespaceArrays) === 75, 'Progress whitespace arrays = 75%');

const userOneValidTarget = {
  ...completeUserWithoutPhoto,
  targetCompanies: ['   ', 'Amazon', ''],
  preparationGoals: ['  '], // only goals missing
};
// 100 - 10 = 90%
assert(calculateProfileCompletion(userOneValidTarget).percentage === 90, 'Array with 1 valid target company counts (+15%, goals missing -> 90%)');
assert(calculateBackendDashboardPercentage(userOneValidTarget) === 90, 'Dashboard matches 90%');
assert(calculateBackendProgressPercentage(userOneValidTarget) === 90, 'Progress matches 90%');

// 6. Whitespace Strings Across All Fields
console.log('\n--- SECTION 6: Whitespace-Only Strings Across Fields ---');
const allWhitespaceUser = {
  firstName: '   ',
  lastName: '  \n  ',
  college: '     ',
  branch: '\t',
  graduationYear: 2026, // valid
  preparationLevel: '  ',
  targetCompanies: ['   '],
  preparationGoals: ['   '],
};
// Only graduationYear (10%) should count
assert(calculateProfileCompletion(allWhitespaceUser).percentage === 10, 'All whitespace strings rejected; only graduationYear counts (10%)');
assert(calculateBackendDashboardPercentage(allWhitespaceUser) === 10, 'Dashboard all-whitespace = 10%');
assert(calculateBackendProgressPercentage(allWhitespaceUser) === 10, 'Progress all-whitespace = 10%');

// 7. Representative Profiles Cross-Surface Equality
console.log('\n--- SECTION 7: Cross-Surface Exact Equality Across Representative Profiles ---');
const testProfiles = [
  {
    name: 'Personal Only',
    user: { firstName: 'Alice', lastName: 'Smith' },
    expected: 20,
  },
  {
    name: 'Academic Only',
    user: { firstName: 'Alice', lastName: 'Smith', college: 'BITS Pilani', branch: 'ECE', graduationYear: 2025 },
    expected: 60,
  },
  {
    name: 'Onboarding Step 2',
    user: { firstName: 'Alice', lastName: 'Smith', preparationLevel: 'Intermediate', targetCompanies: ['Google'] },
    expected: 50,
  },
  {
    name: 'Everything Except Goals',
    user: {
      firstName: 'Alice',
      lastName: 'Smith',
      college: 'BITS Pilani',
      branch: 'ECE',
      graduationYear: 2025,
      preparationLevel: 'Advanced',
      targetCompanies: ['Apple'],
      preparationGoals: [],
    },
    expected: 90,
  },
];

for (const p of testProfiles) {
  const frontPct = calculateProfileCompletion(p.user).percentage;
  const dashPct = calculateBackendDashboardPercentage(p.user);
  const progPct = calculateBackendProgressPercentage(p.user);

  assert(
    frontPct === p.expected && dashPct === p.expected && progPct === p.expected,
    `Profile "${p.name}": Frontend (${frontPct}%) === Dashboard (${dashPct}%) === Progress (${progPct}%) === Expected (${p.expected}%)`
  );
}

console.log('\n===============================================================');
console.log(` RESULTS: ${passed} PASSED / ${failed} FAILED (TOTAL: ${passed + failed})`);
console.log('===============================================================\n');

if (failed > 0) {
  process.exit(1);
}
