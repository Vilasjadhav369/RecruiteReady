import AuditLog from '../models/AuditLog.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'token',
  'rawtoken',
  'credential',
  'secret',
  'clientsecret',
  'authorization',
  'cookie',
]);

/**
 * Strips sensitive keys recursively from metadata before logging.
 */
const sanitizeMetadata = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeMetadata);

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      clean[key] = sanitizeMetadata(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
};

/**
 * Logs a security event to the AuditLog collection and prints a safe message.
 */
export const logSecurityEvent = async ({
  action,
  user = null,
  entityType = 'auth',
  entityId = null,
  req = null,
  details = {},
  severity = 'info',
}) => {
  try {
    const ipAddress =
      req?.ip ||
      req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      'unknown';

    const userAgent = req?.headers?.['user-agent'] || 'unknown';
    const sanitizedDetails = sanitizeMetadata(details);

    // Save to database
    await AuditLog.create({
      user: user?._id || user || null,
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      ipAddress,
      userAgent,
      details: sanitizedDetails,
      severity,
    });

    if (process.env.NODE_ENV !== 'test') {
      console.log(`[SECURITY AUDIT] [${severity.toUpperCase()}] ${action} - User: ${user?._id || user || 'anonymous'} - IP: ${ipAddress}`);
    }
  } catch (err) {
    // Audit logging must be non-blocking
    console.error(`[SECURITY AUDIT FAILURE] Failed to record audit log: ${err.message}`);
  }
};

export default {
  logSecurityEvent,
};
