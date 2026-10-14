import mongoose from 'mongoose';

const aptitudeAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AptitudeQuestion',
      required: true,
    },
    selectedOption: {
      type: String,
      enum: ['A', 'B', 'C', 'D', ''],
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

const questionSnapshotSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    questionType: {
      type: String,
      default: 'aptitude',
    },
    question: {
      type: String,
      required: true,
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
      required: true,
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
  },
  { _id: false }
);

const aptitudeAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AptitudeQuestion',
      },
    ],
    questionSnapshots: {
      type: [questionSnapshotSchema],
      default: [],
    },
    answers: {
      type: [aptitudeAnswerSchema],
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
    category: {
      type: String,
      trim: true,
      default: 'General Aptitude',
    },
    topic: {
      type: String,
      trim: true,
      default: 'Mixed Topics',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      default: 'medium',
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
      min: 60,
    },
  },
  {
    timestamps: true,
  }
);

aptitudeAttemptSchema.index({ user: 1, createdAt: -1 });
aptitudeAttemptSchema.index({ user: 1, status: 1, createdAt: -1 });
aptitudeAttemptSchema.index({ user: 1, category: 1 });
aptitudeAttemptSchema.index({ user: 1, topic: 1 });
aptitudeAttemptSchema.index(
  { user: 1, category: 1, topic: 1, difficulty: 1 },
  { unique: true, partialFilterExpression: { status: 'in_progress' } }
);

const AptitudeAttempt = mongoose.model('AptitudeAttempt', aptitudeAttemptSchema);

export default AptitudeAttempt;
