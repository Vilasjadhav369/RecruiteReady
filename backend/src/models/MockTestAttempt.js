import mongoose from 'mongoose';

const mockTestAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    questionType: {
      type: String,
      enum: ['aptitude', 'coding'],
      default: 'aptitude',
    },
    selectedOption: {
      type: String,
      default: '',
    },
    version: {
      type: Number,
      default: 1,
    },
    clientTimestamp: {
      type: Date,
      default: null,
    },
    codeSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingSubmission',
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: null,
    },
    marksObtained: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const mockTestQuestionSnapshotSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    questionType: {
      type: String,
      enum: ['aptitude', 'coding'],
      default: 'aptitude',
    },
    question: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    options: [
      {
        key: { type: String, required: true },
        text: { type: String, required: true },
        originalKey: { type: String, default: '' },
      },
    ],
    correctOption: {
      type: String,
      default: '',
    },
    explanation: {
      type: String,
      default: '',
    },
    marks: {
      type: Number,
      default: 1,
    },
    category: {
      type: String,
      default: '',
    },
    topic: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      default: 'medium',
    },
    starterCode: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    examples: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    constraints: {
      type: [String],
      default: [],
    },
    supportedLanguages: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const mockTestAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    mockTest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockTest',
      required: [true, 'MockTest reference is required'],
      index: true,
    },
    questionSnapshots: {
      type: [mockTestQuestionSnapshotSchema],
      default: [],
    },
    answers: {
      type: [mockTestAnswerSchema],
      default: [],
    },
    integrityEvents: {
      type: [
        {
          eventType: {
            type: String,
            enum: ['tab_hidden', 'tab_visible', 'window_blur', 'window_focus', 'fullscreen_exit'],
            required: true,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
          metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
          },
        },
      ],
      default: [],
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    wrongAnswers: {
      type: Number,
      default: 0,
    },
    unanswered: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'expired'],
      default: 'in_progress',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    timeLimitSeconds: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

mockTestAttemptSchema.index({ user: 1, createdAt: -1 });
mockTestAttemptSchema.index({ user: 1, mockTest: 1, createdAt: -1 });
mockTestAttemptSchema.index({ user: 1, status: 1, createdAt: -1 });
mockTestAttemptSchema.index(
  { user: 1, mockTest: 1 },
  { unique: true, partialFilterExpression: { status: 'in_progress' } }
);

const MockTestAttempt = mongoose.model('MockTestAttempt', mockTestAttemptSchema);

export default MockTestAttempt;
