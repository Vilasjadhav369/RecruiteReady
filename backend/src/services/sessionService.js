import crypto from 'crypto';
import Session from '../models/Session.js';

/**
 * Human-friendly parser for User-Agent strings without external dependencies.
 */
export const parseUserAgent = (uaString = '') => {
  if (!uaString || uaString === 'unknown' || uaString === 'Unknown Device') {
    return { browser: 'Unknown Browser', os: 'Unknown OS', deviceType: 'desktop' };
  }

  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let deviceType = 'desktop';

  // Device detection
  if (/mobile|iphone|ipod|android.*mobile/i.test(uaString)) {
    deviceType = 'mobile';
  } else if (/ipad|tablet|android(?!.*mobile)/i.test(uaString)) {
    deviceType = 'tablet';
  }

  // OS detection
  if (/windows nt 10/i.test(uaString)) os = 'Windows 10/11';
  else if (/windows nt/i.test(uaString)) os = 'Windows';
  else if (/mac os x/i.test(uaString)) os = 'macOS';
  else if (/android/i.test(uaString)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(uaString)) os = 'iOS';
  else if (/linux/i.test(uaString)) os = 'Linux';

  // Browser detection
  if (/edg\//i.test(uaString)) browser = 'Microsoft Edge';
  else if (/chrome|crios/i.test(uaString)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(uaString)) browser = 'Firefox';
  else if (/safari/i.test(uaString) && !/chrome/i.test(uaString)) browser = 'Safari';
  else if (/opera|opr\//i.test(uaString)) browser = 'Opera';

  return { browser, os, deviceType };
};

/**
 * Mask IP address for privacy.
 */
export const maskIp = (ip = '') => {
  if (!ip || ip === 'unknown') return 'unknown';
  if (ip === '::1' || ip === '127.0.0.1') return 'localhost';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  return ip.substring(0, Math.min(ip.length, 8)) + '***';
};

/**
 * Creates an active session record in the database.
 */
export const createSession = async ({ user, req, token = null, tokenHash = null, expiresInMs = 7 * 24 * 60 * 60 * 1000 }) => {
  const userAgent = req?.headers?.['user-agent'] || 'Unknown Device';
  const ipAddress = req?.ip || req?.socket?.remoteAddress || 'unknown';

  const expiresAt = new Date(Date.now() + expiresInMs);
  let resolvedHash = tokenHash;
  if (!resolvedHash) {
    resolvedHash = token
      ? crypto.createHash('sha256').update(token).digest('hex')
      : crypto.randomBytes(32).toString('hex');
  }

  const session = await Session.create({
    user: user._id,
    tokenHash: resolvedHash,
    userAgent,
    ipAddress,
    lastUsedAt: new Date(),
    expiresAt,
    revokedAt: null,
  });

  return session;
};

/**
 * Associates signed JWT hash with the session.
 */
export const attachTokenHashToSession = async (sessionId, token) => {
  if (!sessionId || !token) return;
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  await Session.findByIdAndUpdate(sessionId, { $set: { tokenHash: hash } });
};

/**
 * Validates whether a session is valid, active, and not revoked.
 * If rawToken is supplied, validates token hash integrity against stored SHA-256 digest.
 */
export const verifySession = async (sessionId, userId, rawToken = null) => {
  if (!sessionId || !userId) return null;

  let session;
  try {
    session = await Session.findById(sessionId).select('+tokenHash');
  } catch {
    return null;
  }
  if (!session) return null;

  // Revocation check
  if (session.revokedAt) return null;

  // Expiration check
  if (session.expiresAt && session.expiresAt < new Date()) {
    session.revokedAt = new Date();
    await session.save();
    return null;
  }

  // User ownership check
  if (session.user.toString() !== userId.toString()) return null;

  // Token hash verification:
  // If rawToken is supplied and stored hash is standard 64-char SHA-256 hex digest
  if (rawToken && session.tokenHash && session.tokenHash.length === 64) {
    const computedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const computedBuf = Buffer.from(computedHash, 'hex');
    const storedBuf = Buffer.from(session.tokenHash, 'hex');
    if (computedBuf.length !== storedBuf.length || !crypto.timingSafeEqual(computedBuf, storedBuf)) {
      return null;
    }
  }

  // Throttle lastUsedAt update: update at most once every 60 seconds
  const now = Date.now();
  if (now - new Date(session.lastUsedAt).getTime() > 60 * 1000) {
    session.lastUsedAt = new Date();
    await session.save();
  }

  return session;
};

/**
 * Revokes a specific session owned by userId.
 */
export const revokeSession = async (sessionId, userId) => {
  const session = await Session.findOneAndUpdate(
    { _id: sessionId, user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
    { returnDocument: 'after' }
  );
  return session;
};

/**
 * Revokes all active sessions for a user, optionally exempting the current session.
 */
export const revokeAllSessions = async (userId, exceptSessionId = null) => {
  const filter = {
    user: userId,
    revokedAt: null,
  };
  if (exceptSessionId) {
    filter._id = { $ne: exceptSessionId };
  }

  const result = await Session.updateMany(filter, {
    $set: { revokedAt: new Date() },
  });

  return result.modifiedCount;
};

/**
 * Lists all active (non-revoked, non-expired) sessions for a user.
 */
export const getUserSessions = async (userId, currentSessionId = null) => {
  const activeSessions = await Session.find({
    user: userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .sort({ lastUsedAt: -1 })
    .lean();

  return activeSessions.map((s) => {
    const { browser, os, deviceType } = parseUserAgent(s.userAgent);
    return {
      _id: s._id,
      browser,
      os,
      deviceType,
      ipAddress: maskIp(s.ipAddress),
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      isCurrent: currentSessionId ? s._id.toString() === currentSessionId.toString() : false,
    };
  });
};

export default {
  createSession,
  attachTokenHashToSession,
  verifySession,
  revokeSession,
  revokeAllSessions,
  getUserSessions,
  parseUserAgent,
  maskIp,
};
