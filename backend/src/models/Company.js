import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    type: { type: String, trim: true, default: 'link' },
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Company slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    industry: {
      type: String,
      trim: true,
      default: 'Technology',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    careersUrl: {
      type: String,
      trim: true,
      default: '',
    },
    roles: {
      type: [String],
      default: [],
    },
    eligibility: {
      type: String,
      trim: true,
      default: 'BE / B.Tech / MCA / Equivalent degree with 60% or 6.5+ CGPA',
    },
    selectionProcess: {
      type: [String],
      default: [
        'Online Aptitude & Coding Round',
        'Technical Interview 1',
        'Technical Interview 2 / Managerial',
        'HR Interview',
      ],
    },
    aptitudeTopics: {
      type: [String],
      default: [],
    },
    codingTopics: {
      type: [String],
      default: [],
    },
    interviewTopics: {
      type: [String],
      default: [],
    },
    resources: {
      type: [resourceSchema],
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

companySchema.index({ industry: 1, isActive: 1 });

const Company = mongoose.model('Company', companySchema);

export default Company;
