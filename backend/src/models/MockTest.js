import mongoose from 'mongoose';

const mockTestQuestionSchema = new mongoose.Schema(
  {
    questionType: {
      type: String,
      required: true,
      enum: ['aptitude', 'coding'],
      default: 'aptitude',
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'questions.questionTypeRef',
    },
    questionTypeRef: {
      type: String,
      required: true,
      enum: ['AptitudeQuestion', 'CodingProblem'],
      default: 'AptitudeQuestion',
    },
    marks: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { _id: false }
);

const mockTestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Mock test title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    categories: {
      type: [String],
      default: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability'],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'all'],
      default: 'medium',
    },
    instructions: {
      type: String,
      default: 'Read each question carefully before answering. Each question carries marks as indicated. Submit before the timer expires.',
    },
    questions: {
      type: [mockTestQuestionSchema],
      default: [],
    },
    isPublished: {
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

mockTestSchema.index({ isPublished: 1, createdAt: -1 });
mockTestSchema.index({ isPublished: 1, difficulty: 1, createdAt: -1 });

const MockTest = mongoose.model('MockTest', mockTestSchema);

export default MockTest;
