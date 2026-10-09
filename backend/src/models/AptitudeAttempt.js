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
    answers: {
      type: [aptitudeAnswerSchema],
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

const AptitudeAttempt = mongoose.model('AptitudeAttempt', aptitudeAttemptSchema);

export default AptitudeAttempt;
