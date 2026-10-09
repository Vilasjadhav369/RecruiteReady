import mongoose from 'mongoose';

const codingSubmissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingProblem',
      required: [true, 'Problem reference is required'],
      index: true,
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Code submission cannot be empty'],
    },
    status: {
      type: String,
      enum: [
        'pending',
        'accepted',
        'wrong_answer',
        'compile_error',
        'runtime_error',
        'time_limit',
        'execution_unavailable',
        'error',
      ],
      default: 'pending',
      index: true,
    },
    passedTests: {
      type: Number,
      default: 0,
    },
    totalTests: {
      type: Number,
      default: 0,
    },
    runtime: {
      type: Number,
      default: 0, // In milliseconds
    },
    memory: {
      type: Number,
      default: 0, // In KB
    },
    executionMessage: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

codingSubmissionSchema.index({ user: 1, problem: 1, submittedAt: -1 });
codingSubmissionSchema.index({ user: 1, status: 1 });
codingSubmissionSchema.index({ user: 1, submittedAt: -1 });

const CodingSubmission = mongoose.model('CodingSubmission', codingSubmissionSchema);

export default CodingSubmission;
