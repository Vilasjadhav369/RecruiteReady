import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: function () {
        // Password is only mandatory for local accounts without social auth
        return this.authProvider === 'local' && !this.googleId && !this.githubId;
      },
      select: false, // Never return password in queries by default
    },
    authProvider: {
      type: String,
      enum: {
        values: ['local', 'google', 'github'],
        message: 'Auth provider must be local, google, or github',
      },
      default: 'local',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'admin'],
        message: 'Role must be either student or admin',
      },
      default: 'student',
    },
    college: {
      type: String,
      trim: true,
      default: '',
    },
    branch: {
      type: String,
      trim: true,
      default: '',
    },
    graduationYear: {
      type: Number,
      min: [2000, 'Graduation year must be valid'],
      max: [2100, 'Graduation year must be valid'],
    },
    cgpa: {
      type: Number,
      default: null,
      min: [0, 'CGPA must be at least 0'],
      max: [10, 'CGPA cannot exceed 10'],
    },
    backlogs: {
      type: Number,
      default: 0,
      min: [0, 'Backlogs cannot be negative'],
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    targetCompanies: {
      type: [String],
      default: [],
    },
    preparationGoals: {
      type: [String],
      default: [],
    },
    preparationLevel: {
      type: String,
      enum: {
        values: ['Just Starting', 'Beginner', 'Intermediate', 'Advanced', 'Placement Ready', ''],
        message: 'Invalid preparation level',
      },
      default: '',
      trim: true,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    onboardingCompletedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
    },
    emailVerificationTokenHash: {
      type: String,
      select: false,
    },
    emailVerificationExpiresAt: {
      type: Date,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
    },
    consentAcceptedAt: {
      type: Date,
      default: null,
    },
    consentVersion: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes supporting student directory querying, filtering, and sorting
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ role: 1, branch: 1, graduationYear: 1 });

const User = mongoose.model('User', userSchema);

export default User;
