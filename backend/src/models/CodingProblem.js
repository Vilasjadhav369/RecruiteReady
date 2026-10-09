import mongoose from 'mongoose';

const exampleSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const codingProblemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
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
    category: {
      type: String,
      default: 'Core Data Structures',
      trim: true,
    },
    topics: {
      type: [String],
      default: [],
    },
    constraints: {
      type: [String],
      default: [],
    },
    inputFormat: {
      type: String,
      default: '',
    },
    outputFormat: {
      type: String,
      default: '',
    },
    examples: {
      type: [exampleSchema],
      default: [],
    },
    starterCode: {
      type: Map,
      of: String,
      default: {
        javascript: '// Write your solution here\nfunction solution(input) {\n  return 0;\n}',
        python: '# Write your solution here\ndef solution(input):\n    return 0',
        java: '// Write your solution here\nclass Solution {\n    public static int solve(String input) {\n        return 0;\n    }\n}',
        cpp: '// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint solve() {\n    return 0;\n}',
      },
    },
    solutionExplanation: {
      type: String,
      default: '',
    },
    testCases: {
      type: [testCaseSchema],
      default: [],
    },
    supportedLanguages: {
      type: [String],
      default: ['javascript', 'python', 'java', 'cpp'],
    },
    companies: {
      type: [String],
      default: [],
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

codingProblemSchema.index({ difficulty: 1, isActive: 1 });
codingProblemSchema.index({ isActive: 1, createdAt: -1 });
codingProblemSchema.index({ category: 1, isActive: 1 });
codingProblemSchema.index({ topics: 1, isActive: 1 });

const CodingProblem = mongoose.model('CodingProblem', codingProblemSchema);

export default CodingProblem;
