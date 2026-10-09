import mongoose from 'mongoose';

/**
 * AuditLog Schema
 * Provides immutable audit records for security and administrative events.
 */
const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    action: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    entityType: {
      type: String,
      trim: true,
      default: 'system',
    },
    entityId: {
      type: String,
      trim: true,
      default: null,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: 'unknown',
    },
    userAgent: {
      type: String,
      trim: true,
      default: 'unknown',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
