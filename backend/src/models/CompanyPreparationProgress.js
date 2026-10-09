import mongoose from 'mongoose';

/**
 * CompanyPreparationProgress Schema
 * Tracks student-specific preparation checklist items and verified milestone completions
 * for targeted campus recruitment preparation.
 *
 * Persists granular completion states for:
 *  - aptitude topics reviewed / practiced
 *  - coding problem sets completed
 *  - technical and HR interview rounds prepared
 *  - company preparation resources reviewed
 */
const companyPreparationProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      enum: {
        values: ['aptitude', 'coding', 'interview', 'resources', 'general'],
        message: 'Section must be one of: aptitude, coding, interview, resources, general',
      },
    },
    itemKey: {
      type: String,
      required: [true, 'Item key is required'],
      trim: true,
    },
    completed: {
      type: Boolean,
      default: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index prevents duplicate progress records per user, company, section, and item
companyPreparationProgressSchema.index(
  { user: 1, company: 1, section: 1, itemKey: 1 },
  { unique: true }
);

// Compound index for querying a student's full progress on a particular company
companyPreparationProgressSchema.index({ user: 1, company: 1 });

const CompanyPreparationProgress = mongoose.model(
  'CompanyPreparationProgress',
  companyPreparationProgressSchema
);

export default CompanyPreparationProgress;
