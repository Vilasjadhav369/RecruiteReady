import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import sessionService from '../services/sessionService.js';

/**
 * protect — Middleware to protect routes requiring authentication.
 * Validates the Authorization Bearer token, enforces session status/revocation,
 * and attaches user and session identifiers to req.
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Invalid token format.',
      });
    }

    // Verify token cryptographic signature and algorithm
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Invalid or expired token.',
      });
    }

    // Server-side session verification if token is bound to a session
    if (decoded.sessionId) {
      const activeSession = await sessionService.verifySession(decoded.sessionId, decoded.id);
      if (!activeSession) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed. Session has been revoked or expired.',
        });
      }
      req.sessionId = decoded.sessionId;
      req.session = activeSession;
    }

    // Find active user (password is automatically excluded by select: false)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. User no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Account has been deactivated.',
      });
    }

    // Attach user and raw token to request object
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * optionalAuth — Middleware for public routes that optionally enrich the request
 * with the authenticated user if a valid Bearer token is provided.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    const token = authHeader.split(' ')[1];
    if (!token) return next();

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return next();
    }

    if (decoded?.id) {
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      }
    }
    next();
  } catch {
    next();
  }
};

export default protect;

