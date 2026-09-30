import jwt from 'jsonwebtoken';

/**
 * generateToken — Signs a JWT containing minimal user identifiers (id, role).
 *
 * @param {Object} user - User document or object with _id and role
 * @returns {string} - Signed JWT token string
 */
export const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined.');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    secret,
    {
      expiresIn,
    }
  );
};

/**
 * verifyToken — Verifies and decodes a JWT token.
 *
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined.');
  }

  return jwt.verify(token, secret);
};

export default {
  generateToken,
  verifyToken,
};
