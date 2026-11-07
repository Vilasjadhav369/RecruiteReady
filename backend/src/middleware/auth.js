import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import sessionService from '../services/sessionService.js';
import { generalApiLimiter } from './rateLimiter.js';

/**
 * protect — Middleware to protect routes requiring authentication.
 * Validates the Authorization Bearer token, enforces mandatory session status/revocation,
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

    // Verify token cryptographic signature and pinned HS256 algorithm
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Invalid or expired token.',
      });
    }

    // Mandatory sessionId requirement: tokens without sessionId are rejected
    if (!decoded || !decoded.sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Token is missing required session identifier.',
      });
    }

    // Server-side session verification
    const activeSession = await sessionService.verifySession(decoded.sessionId, decoded.id, token);
    if (!activeSession) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Session has been revoked or expired.',
      });
    }
    req.sessionId = decoded.sessionId;
    req.session = activeSession;

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

    // Apply authenticated general API rate limiter (keyed by authenticated user id)
    return generalApiLimiter(req, res, next);
  } catch (error) {
    next(error);
  }
};

/**
 * optionalAuth — Middleware for public routes that optionally enrich the request
 * with the authenticated user if a valid Bearer token is provided.
 * Rejects tokens without mandatory sessionId, or expired/revoked sessions, with 401.
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
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Invalid or expired token.',
      });
    }

    // Mandatory sessionId requirement: tokens without sessionId are rejected
    if (!decoded || !decoded.sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Token is missing required session identifier.',
      });
    }

    const activeSession = await sessionService.verifySession(decoded.sessionId, decoded.id, token);
    if (!activeSession) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Session has been revoked or expired.',
      });
    }

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

    req.sessionId = decoded.sessionId;
    req.session = activeSession;
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
};

export default protect;
