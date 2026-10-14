import mongoose from 'mongoose';

/**
 * Predefined Goal Catalog Definitions
 * Explicit, stable template keys mapped directly from frontend suggestion items.
 * Guaranteed conservative: ambiguous or unmatched custom text defaults to 'manual_checkbox'.
 */
export const PREDEFINED_GOAL_CATALOG = {
  // Coding & DSA
  'solve_100_dsa': {
    templateKey: 'solve_100_dsa',
    canonicalText: 'Solve 100+ DSA and algorithmic problems',
    category: 'coding_dsa',
    metricType: 'coding_distinct_solved',
    targetValue: 100,
    unit: 'problems solved',
  },
  'master_dp_graphs': {
    templateKey: 'master_dp_graphs',
    canonicalText: 'Master Dynamic Programming and Graphs',
    category: 'coding_dsa',
    metricType: 'manual_checkbox',
    targetValue: 1,
    unit: 'topic mastery',
  },
  'practice_array_patterns': {
    templateKey: 'practice_array_patterns',
    canonicalText: 'Practice array, string, and matrix patterns',
    category: 'coding_dsa',
    metricType: 'manual_checkbox',
    targetValue: 1,
    unit: 'topic mastery',
  },
  'proficiency_trees_recursion': {
    templateKey: 'proficiency_trees_recursion',
    canonicalText: 'Achieve proficiency in Trees and Recursion',
    category: 'coding_dsa',
    metricType: 'manual_checkbox',
    targetValue: 1,
    unit: 'topic mastery',
  },

  // Aptitude & Reasoning
  'aptitude_80_accuracy': {
    templateKey: 'aptitude_80_accuracy',
    canonicalText: 'Achieve 80%+ accuracy in Quantitative Aptitude',
    category: 'aptitude',
    metricType: 'aptitude_aggregate_accuracy',
    targetValue: 80,
    unit: '% aggregate accuracy',
    minSessions: 3,
  },
  'master_logical_reasoning': {
    templateKey: 'master_logical_reasoning',
    canonicalText: 'Master Logical Reasoning and Analytical Puzzles',
    category: 'aptitude',
    metricType: 'manual_checkbox',
    targetValue: 1,
    unit: 'topic mastery',
  },
  'improve_verbal_ability': {
    templateKey: 'improve_verbal_ability',
    canonicalText: 'Improve Verbal Ability and Reading Comprehension',
    category: 'aptitude',
    metricType: 'manual_checkbox',
    targetValue: 1,
    unit: 'topic mastery',
  },

  // Mock Tests & Speed
  'complete_5_mocks': {
    templateKey: 'complete_5_mocks',
    canonicalText: 'Complete 5 full-length placement mock tests',
    category: 'mock_tests',
    metricType: 'mock_submitted_count',
    targetValue: 5,
    unit: 'mock tests submitted',
  },
  'practice_speed_solving': {
    templateKey: 'practice_speed_solving',
    canonicalText: 'Practice speed solving under strict 60-minute timers',
    category: 'mock_tests',
    metricType: 'manual_checkbox',
    targetValue: 1,
    unit: 'milestone',
  },
  'benchmark_test_performance': {
    templateKey: 'benchmark_test_performance',
    canonicalText: 'Benchmark test performance against college cohort',
    category: 'mock_tests',
    metricType: 'manual_checkbox',
    targetValue: 1,
    unit: 'milestone',
  },

  // Core Computer Science
  'review_os_concurrency': {
    templateKey: 'review_os_concurrency',
    canonicalText: 'Review Operating Systems and Concurrency concepts',
    category: 'core_cs',
    metricType: 'manual_checkbox',
    targetValue: 1,
    unit: 'topic review',
  },
  'master_dbms_sql': {
    templateKey: 'master_dbms_sql',
    canonicalText: 'Master DBMS, SQL queries, and Indexing',
    category: 'core_cs',
    metricType: 'manual_checkbox',
    targetValue: 1,
    unit: 'topic review',
  },
  'revise_cn_web': {
    templateKey: 'revise_cn_web',
    canonicalText: 'Revise Computer Networks and Web protocols',
    category: 'core_cs',
    metricType: 'manual_checkbox',
    targetValue: 1,
    unit: 'topic review',
  },
};

/**
 * Deterministic text normalizer for goal matching and deduplication.
 * Compresses whitespace and forces lower-case.
 */
export const normalizeGoalText = (str) =>
  String(str || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

// Pre-computed normalized lookup map for catalog items
const CATALOG_BY_NORMALIZED_TEXT = new Map();
Object.values(PREDEFINED_GOAL_CATALOG).forEach((item) => {
  CATALOG_BY_NORMALIZED_TEXT.set(normalizeGoalText(item.canonicalText), item);
});

/**
 * Resolves template key and metric configuration for a given raw text string.
 * Strictly conservative: if not recognized in catalog, defaults to custom manual_checkbox.
 */
export const resolveGoalTemplate = (text, requestedTemplateKey = null) => {
  const normalized = normalizeGoalText(text);

  // If a templateKey is provided, verify that text actually matches that catalog item
  if (requestedTemplateKey && PREDEFINED_GOAL_CATALOG[requestedTemplateKey]) {
    const catalogItem = PREDEFINED_GOAL_CATALOG[requestedTemplateKey];
    const canonicalNormalized = normalizeGoalText(catalogItem.canonicalText);
    if (normalized === canonicalNormalized) {
      return {
        templateKey: catalogItem.templateKey,
        category: catalogItem.category,
        metricType: catalogItem.metricType,
        targetValue: catalogItem.targetValue,
        unit: catalogItem.unit,
        minSessions: catalogItem.minSessions || 0,
      };
    }
    // If text does not match the requested templateKey, fall through to text match or custom fallback
  }

  // Authoritative text matching against catalog
  const matched = CATALOG_BY_NORMALIZED_TEXT.get(normalized);
  if (matched) {
    return {
      templateKey: matched.templateKey,
      category: matched.category,
      metricType: matched.metricType,
      targetValue: matched.targetValue,
      unit: matched.unit,
      minSessions: matched.minSessions || 0,
    };
  }

  // Conservative fallback: custom self-reported goal
  return {
    templateKey: null,
    category: 'custom',
    metricType: 'manual_checkbox',
    targetValue: 1,
    unit: 'milestone',
    minSessions: 0,
  };
};

const preparationGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Goal text is required'],
      trim: true,
      maxlength: [100, 'Goal text cannot exceed 100 characters'],
    },
    normalizedKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    templateKey: {
      type: String,
      default: null,
      trim: true,
    },
    category: {
      type: String,
      enum: ['coding_dsa', 'aptitude', 'mock_tests', 'core_cs', 'custom'],
      default: 'custom',
    },
    targetMetric: {
      metricType: {
        type: String,
        enum: [
          'coding_distinct_solved',
          'aptitude_aggregate_accuracy',
          'mock_submitted_count',
          'manual_checkbox',
        ],
        default: 'manual_checkbox',
      },
      targetValue: {
        type: Number,
        default: 1,
      },
      unit: {
        type: String,
        default: 'milestone',
      },
      minSessions: {
        type: Number,
        default: 0,
      },
    },
    manualCompleted: {
      type: Boolean,
      default: false,
    },
    manualCompletedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound partial unique index preventing duplicate active goals per student
preparationGoalSchema.index(
  { user: 1, normalizedKey: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

// Query optimization index
preparationGoalSchema.index({ user: 1, isActive: 1, createdAt: 1 });

const PreparationGoal = mongoose.model('PreparationGoal', preparationGoalSchema);

export default PreparationGoal;
