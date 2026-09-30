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
    answers: {
      type: [mockTestAnswerSchema],
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

mockTestAttemptSchema.index({ user: 1, mockTest: 1, createdAt: -1 });

const MockTestAttempt = mongoose.model('MockTestAttempt', mockTestAttemptSchema);

export default MockTestAttempt;
