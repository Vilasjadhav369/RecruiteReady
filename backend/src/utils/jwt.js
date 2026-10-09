import jwt from 'jsonwebtoken';

const DEFAULT_ALGORITHM = 'HS256';

/**
 * generateToken — Signs a JWT containing minimal user identifiers and optional sessionId.
 * Strictly uses HS256 algorithm and server-side secret.
 *
 * @param {Object} user - User document or object with _id and role
 * @param {string|null} sessionId - Optional database session ID
 * @returns {string} - Signed JWT token string
 */
export const generateToken = (user, sessionId = null) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined.');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  const payload = {
    id: user._id,
    role: user.role,
  };

  if (sessionId) {
    payload.sessionId = String(sessionId);
  }

  return jwt.sign(payload, secret, {
    algorithm: DEFAULT_ALGORITHM,
    expiresIn,
  });
};

/**
 * verifyToken — Verifies and decodes a JWT token.
 * Strictly enforces HS256 algorithm to block algorithm confusion and "none" attacks.
 *
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined.');
  }

  return jwt.verify(token, secret, {
    algorithms: [DEFAULT_ALGORITHM],
  });
};

export default {
  generateToken,
  verifyToken,
};
