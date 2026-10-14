import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Option key is required (e.g. A, B, C, D)'],
      trim: true,
      uppercase: true,
    },
    text: {
      type: String,
      required: [true, 'Option text is required'],
      trim: true,
    },
  },
  { _id: false }
);

const aptitudeQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [optionSchema],
      required: [true, 'Options are required'],
      validate: [
        (opts) => Array.isArray(opts) && opts.length === 4,
        'Exactly four options (A, B, C, D) are required',
      ],
    },
    correctOption: {
      type: String,
      required: [true, 'Correct option key (A, B, C, or D) is required'],
      trim: true,
      uppercase: true,
      enum: {
        values: ['A', 'B', 'C', 'D'],
        message: 'Correct option must be A, B, C, or D',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: 'Difficulty must be easy, medium, or hard',
      },
      default: 'medium',
      index: true,
    },
    explanation: {
      type: String,
      required: [true, 'Explanation is required'],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    marks: {
      type: Number,
      default: 1,
      min: [1, 'Marks must be at least 1'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful indexes:
// Standalone index: `topic: 1` is defined directly on schema field (line 55: index: true)
// which powers standalone queries, aggregations, and topic-filtered sessions.
// Compound index covers combined category-topic-difficulty lookups:
aptitudeQuestionSchema.index({ category: 1, topic: 1, difficulty: 1, isActive: 1 });

const AptitudeQuestion = mongoose.model('AptitudeQuestion', aptitudeQuestionSchema);

export default AptitudeQuestion;
