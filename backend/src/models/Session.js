import mongoose from 'mongoose';

/**
 * Session Schema
 * Tracks active user sessions, device metadata, and supports server-side revocation.
 */
const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
      select: false,
    },
    userAgent: {
      type: String,
      default: 'Unknown Device',
      trim: true,
    },
    ipAddress: {
      type: String,
      default: 'unknown',
      trim: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active sessions by user
sessionSchema.index({ user: 1, revokedAt: 1, expiresAt: 1 });

const Session = mongoose.model('Session', sessionSchema);

export default Session;
