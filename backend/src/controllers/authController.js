import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import notificationService from '../services/notificationService.js';
import googleAuthService from '../services/googleAuthService.js';
import githubAuthService from '../services/githubAuthService.js';
import emailService from '../services/emailService.js';
import sessionService from '../services/sessionService.js';
import securityLogger from '../services/securityLogger.js';
import { reconcileGoalsFromStringArray } from '../services/goalService.js';

/**
 * Strips all sensitive credentials and internal tokens from user payload.
 */
export const serializeUser = (user) => {
  if (!user) return null;
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.passwordResetTokenHash;
  delete userObj.passwordResetExpiresAt;
  delete userObj.emailVerificationTokenHash;
  delete userObj.emailVerificationExpiresAt;
  return userObj;
};

/**
 * Helper to resolve the primary client URL even if CLIENT_URL has multiple comma-separated origins.
 */
const getPrimaryClientUrl = () => {
  return process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',')[0].trim()
    : 'http://localhost:5173';
};

/**
 * Creates an active database session and issues a cryptographically signed JWT.
 */
export const issueSessionAndToken = async (user, req) => {
  const session = await sessionService.createSession({ user, req });
  const token = generateToken(user, session._id);
  await sessionService.attachTokenHashToSession(session._id, token);
  return { session, token };
};

/**
 * POST /api/auth/register
 * Registers a new student account.
 */
export const register = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      college,
      branch,
      graduationYear,
    } = req.body;

    // 1. Validation
    if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
      return res.status(400).json({ success: false, message: 'First name is required and must be text' });
    }
    if (!lastName || typeof lastName !== 'string' || !lastName.trim()) {
      return res.status(400).json({ success: false, message: 'Last name is required and must be text' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required and must be valid' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    if (req.body.consent !== true) {
      return res.status(400).json({
        success: false,
        message: 'You must accept the Terms of Service and Privacy Policy to create an account.',
      });
    }

    // Optional string fields type validation
    if (college !== undefined && typeof college !== 'string') {
      return res.status(400).json({ success: false, message: 'College must be text' });
    }
    if (branch !== undefined && typeof branch !== 'string') {
      return res.status(400).json({ success: false, message: 'Branch must be text' });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // 3. Hash password using bcryptjs with 12 salt rounds
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Generate email verification token (SHA-256 hashed in database, raw in email)
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');

    // 5. Create user — strictly enforce role: 'student' (never accept role from public body)
    const newUser = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'student',
      college: college ? college.trim() : '',
      branch: branch ? branch.trim() : '',
      graduationYear: graduationYear ? Number(graduationYear) : undefined,
      emailVerified: false,
      emailVerificationTokenHash: hashedVerificationToken,
      emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      consentAcceptedAt: new Date(),
      consentVersion: '1.0-test',
    });

    // 6. Send verification email
    try {
      const clientUrl = getPrimaryClientUrl();
      const verifyUrl = `${clientUrl}/verify-email?token=${rawVerificationToken}`;
      await emailService.sendVerificationEmail({
        email: newUser.email,
        firstName: newUser.firstName,
        verifyUrl,
        expiresInHours: 24,
      });
    } catch {
      // Non-blocking email dispatch
    }

    // 7. Generate session and JWT token
    const { token } = await issueSessionAndToken(newUser, req);

    await securityLogger.logSecurityEvent({
      action: 'auth.register',
      user: newUser,
      req,
      details: { email: newUser.email, authProvider: 'local' },
    });

    // 8. Return safe user data without password
    const userResponse = serializeUser(newUser);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email address.',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticates user credentials and returns JWT token.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validation & NoSQL Injection Protection
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Find user by email and explicitly select password (since select: false)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // Generic error message for both non-existent user and incorrect password
    const invalidCredentialsMsg = 'Invalid email or password';

    if (!user) {
      await securityLogger.logSecurityEvent({
        action: 'auth.login_failure',
        req,
        details: { email: normalizedEmail, reason: 'user_not_found' },
        severity: 'warning',
      });
      return res.status(401).json({
        success: false,
        message: invalidCredentialsMsg,
      });
    }

    if (!user.isActive) {
      await securityLogger.logSecurityEvent({
        action: 'auth.login_deactivated',
        user,
        req,
        severity: 'warning',
      });
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // 3. Compare password using bcryptjs
    // If account was created via social OAuth and has no local password set, fail safely with generic message
    if (!user.password) {
      await securityLogger.logSecurityEvent({
        action: 'auth.login_failure',
        user,
        req,
        details: { reason: 'social_only_account_no_password' },
        severity: 'warning',
      });
      return res.status(401).json({
        success: false,
        message: invalidCredentialsMsg,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await securityLogger.logSecurityEvent({
        action: 'auth.login_failure',
        user,
        req,
        details: { reason: 'wrong_password' },
        severity: 'warning',
      });
      return res.status(401).json({
        success: false,
        message: invalidCredentialsMsg,
      });
    }

    // 4. Generate database-backed session and token
    const { token } = await issueSessionAndToken(user, req);

    await securityLogger.logSecurityEvent({
      action: 'auth.login_success',
      user,
      req,
    });

    // 5. Return safe user data
    const userResponse = serializeUser(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Retrieves current authenticated user.
 */
export const getCurrentUser = async (req, res) => {
  const userObj = req.user?.toObject ? req.user.toObject() : { ...req.user };
  delete userObj.password;

  res.status(200).json({
    success: true,
    data: {
      user: userObj,
    },
  });
};

/**
 * PUT /api/auth/profile
 * Updates allowed student profile fields for authenticated user.
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      firstName,
      lastName,
      college,
      branch,
      graduationYear,
      cgpa,
      backlogs,
      preparationLevel,
      targetCompanies,
      preparationGoals,
      profilePhoto,
    } = req.body;

    // Validations
    if (firstName !== undefined && (typeof firstName !== 'string' || !firstName.trim())) {
      return res.status(400).json({ success: false, message: 'First name cannot be empty and must be text' });
    }
    if (lastName !== undefined && (typeof lastName !== 'string' || !lastName.trim())) {
      return res.status(400).json({ success: false, message: 'Last name cannot be empty and must be text' });
    }
    if (college !== undefined && college !== null && college !== '' && typeof college !== 'string') {
      return res.status(400).json({ success: false, message: 'College must be text' });
    }
    if (branch !== undefined && branch !== null && branch !== '' && typeof branch !== 'string') {
      return res.status(400).json({ success: false, message: 'Branch must be text' });
    }

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName.trim();
    if (lastName !== undefined) updates.lastName = lastName.trim();
    if (college !== undefined) updates.college = college ? String(college).trim() : '';
    if (branch !== undefined) updates.branch = branch ? String(branch).trim() : '';
    if (graduationYear !== undefined) {
      if (graduationYear === '' || graduationYear === null) {
        updates.graduationYear = undefined;
      } else {
        const gradYearNum = Number(graduationYear);
        if (isNaN(gradYearNum) || gradYearNum < 2000 || gradYearNum > 2100) {
          return res.status(400).json({ success: false, message: 'Please provide a valid graduation year between 2000 and 2100' });
        }
        updates.graduationYear = gradYearNum;
      }
    }
    if (cgpa !== undefined) {
      if (cgpa === '' || cgpa === null) {
        updates.cgpa = null;
      } else {
        const cgpaNum = Number(cgpa);
        if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
          return res.status(400).json({ success: false, message: 'CGPA must be a valid number between 0 and 10' });
        }
        updates.cgpa = Math.round(cgpaNum * 100) / 100;
      }
    }
    if (backlogs !== undefined) {
      if (backlogs === '' || backlogs === null) {
        updates.backlogs = 0;
      } else {
        const backlogsNum = Number(backlogs);
        if (isNaN(backlogsNum) || !Number.isInteger(backlogsNum) || backlogsNum < 0) {
          return res.status(400).json({ success: false, message: 'Backlogs must be a non-negative whole number (0 or greater)' });
        }
        updates.backlogs = backlogsNum;
      }
    }
    if (targetCompanies !== undefined && Array.isArray(targetCompanies)) {
      updates.targetCompanies = targetCompanies.map((c) => String(c).trim()).filter(Boolean);
    }
    if (preparationGoals !== undefined && Array.isArray(preparationGoals)) {
      updates.preparationGoals = preparationGoals.map((g) => String(g).trim()).filter(Boolean);
    }
    if (preparationLevel !== undefined) {
      const allowedLevels = ['Just Starting', 'Beginner', 'Intermediate', 'Advanced', 'Placement Ready', ''];
      if (!allowedLevels.includes(preparationLevel)) {
        return res.status(400).json({ success: false, message: 'Invalid preparation level value provided' });
      }
      updates.preparationLevel = preparationLevel;
    }
    if (profilePhoto !== undefined) updates.profilePhoto = String(profilePhoto).trim();

    // Security check: NEVER update role, isActive, email, or password here
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Recoverable synchronization of PreparationGoal documents if preparationGoals was passed
    let goalSyncPending = false;
    if (preparationGoals !== undefined && Array.isArray(preparationGoals)) {
      try {
        await reconcileGoalsFromStringArray(userId, updates.preparationGoals);
      } catch (syncErr) {
        goalSyncPending = true;
        // Log error but do not fail the profile update request (non-blocking, recoverable)
        console.error('Recoverable warning: Failed to reconcile PreparationGoal documents:', syncErr);
      }
    }

    const userResponse = updatedUser.toObject ? updatedUser.toObject() : { ...updatedUser };
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userResponse,
        goalSyncPending,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/auth/change-password
 * Securely changes authenticated user password after verifying current password.
 */
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required',
      });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
      });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password',
      });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Your account was created using social sign-in and does not have a local password set.',
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Your current password is incorrect',
      });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Revoke all other active sessions for this user except current session
    await sessionService.revokeAllSessions(user._id, req.sessionId);

    // Generate security notification for the user
    await notificationService.createNotification({
      recipient: user._id,
      type: 'security_alert',
      title: 'Password Changed',
      message: 'Your account password was successfully updated.',
      link: '/profile',
      metadata: { action: 'password_change' },
    });

    await securityLogger.logSecurityEvent({
      action: 'auth.password_change',
      user,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Secure session revocation and logout confirmation.
 */
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = verifyToken(token);
        if (decoded?.sessionId) {
          await sessionService.revokeSession(decoded.sessionId, decoded.id);
          await securityLogger.logSecurityEvent({
            action: 'auth.logout',
            user: decoded.id,
            req,
            details: { sessionId: decoded.sessionId },
          });
        }
      } catch {
        // Token was invalid or expired
      }
    }
  } catch {
    // Non-blocking logout error
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * POST /api/auth/google
 * Authenticates or registers a user via Google Identity Services ID token credential.
 */
export const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential || typeof credential !== 'string' || !credential.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Google credential token is required',
      });
    }

    // 1. Cryptographically verify Google ID token
    let googleUser;
    try {
      googleUser = await googleAuthService.verifyGoogleIdToken(credential.trim());
    } catch (err) {
      const status = err.statusCode || 401;
      return res.status(status).json({
        success: false,
        message: err.message || 'Invalid or expired Google credential',
      });
    }

    const { sub, email, emailVerified, name, givenName, familyName, picture } = googleUser;

    if (!emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Google account email could not be verified',
      });
    }

    // 2. Lookup existing user by Google ID (subject)
    let user = await User.findOne({ googleId: sub });

    if (user) {
      // Existing Google user found
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
        });
      }

      // Optionally sync photo if not set
      if (!user.profilePhoto && picture) {
        user.profilePhoto = picture;
        await user.save();
      }

      const { token } = await issueSessionAndToken(user, req);
      await securityLogger.logSecurityEvent({
        action: 'auth.google_login',
        user,
        req,
      });

      return res.status(200).json({
        success: true,
        message: 'Google sign-in successful',
        data: {
          user: serializeUser(user),
          token,
        },
      });
    }

    // 3. Lookup existing user by verified email (Safe Account Linking)
    const existingEmailUser = await User.findOne({ email });

    if (existingEmailUser) {
      if (!existingEmailUser.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
        });
      }

      // Check if already linked to a different Google account
      if (existingEmailUser.googleId && existingEmailUser.googleId !== sub) {
        return res.status(409).json({
          success: false,
          message: 'This account is already linked to a different Google identity.',
        });
      }

      // Safely link Google identity to existing account (role and permissions preserved)
      existingEmailUser.googleId = sub;
      const wasUnverified = !existingEmailUser.emailVerified;
      if (wasUnverified) {
        existingEmailUser.emailVerified = true;
        existingEmailUser.emailVerifiedAt = new Date();
        // Clear old unverified password/reset tokens to prevent takeover via previously set password
        existingEmailUser.password = undefined;
        existingEmailUser.passwordResetTokenHash = undefined;
        existingEmailUser.passwordResetExpiresAt = undefined;
        existingEmailUser.emailVerificationTokenHash = undefined;
        existingEmailUser.emailVerificationExpiresAt = undefined;
        // Invalidate all previously active sessions to eject any pre-existing unverified sessions
        await sessionService.revokeAllSessions(existingEmailUser._id);
      }
      if (!existingEmailUser.profilePhoto && picture) {
        existingEmailUser.profilePhoto = picture;
      }
      await existingEmailUser.save();

      const { token } = await issueSessionAndToken(existingEmailUser, req);
      await securityLogger.logSecurityEvent({
        action: 'auth.google_login_linked',
        user: existingEmailUser,
        req,
      });

      return res.status(200).json({
        success: true,
        message: 'Google account linked and sign-in successful',
        data: {
          user: serializeUser(existingEmailUser),
          token,
        },
      });
    }

    // 4. Create new student user (STRICT role: 'student', ignore any client-provided role)
    const firstName = (givenName || name.split(' ')[0] || 'Student').trim();
    const lastName = (familyName || name.split(' ').slice(1).join(' ') || 'User').trim();

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      googleId: sub,
      authProvider: 'google',
      role: 'student', // Security requirement: Never allow admin creation via Google
      profilePhoto: picture || '',
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    const { token } = await issueSessionAndToken(newUser, req);
    await securityLogger.logSecurityEvent({
      action: 'auth.google_signup',
      user: newUser,
      req,
    });

    // Send welcome notification
    try {
      await notificationService.createNotification({
        recipient: newUser._id,
        type: 'system_announcement',
        title: 'Welcome to RecruitReady',
        message: 'Your account was successfully created via Google Sign-In.',
        link: '/profile',
        metadata: { action: 'google_signup' },
      });
    } catch {
      // Non-blocking notification failure
    }

    return res.status(201).json({
      success: true,
      message: 'Google registration successful',
      data: {
        user: serializeUser(newUser),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/github
 * Initiates GitHub OAuth authentication by creating a secure state and redirecting to GitHub.
 */
export const githubLogin = async (req, res, next) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientBaseUrl = getPrimaryClientUrl();

    if (!clientId || clientId === 'your_github_client_id_here') {
      if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
        return res.status(500).json({
          success: false,
          message: 'GitHub authentication is not configured on the server.',
        });
      }
      return res.redirect(`${clientBaseUrl}/login?error=${encodeURIComponent('GitHub authentication is not configured on the server.')}`);
    }

    const state = githubAuthService.createOAuthState();
    const authUrl = githubAuthService.getAuthorizationUrl(state);

    if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
      return res.status(200).json({
        success: true,
        data: {
          url: authUrl,
          state,
        },
      });
    }

    return res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/github/callback
 * Handles GitHub OAuth authorization callback, exchanges code, retrieves profile/emails,
 * safely links or creates user, and returns JWT session.
 */
export const githubCallback = async (req, res, next) => {
  const clientBaseUrl = getPrimaryClientUrl();

  const respondWithError = (statusCode, message) => {
    if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
      return res.status(statusCode).json({
        success: false,
        message,
      });
    }
    return res.redirect(`${clientBaseUrl}/login?error=${encodeURIComponent(message)}`);
  };

  try {
    const { code, state, error, error_description } = req.query;

    // 1. Handle GitHub authorization rejection / cancellation
    if (error) {
      const userMsg = error === 'access_denied'
        ? 'GitHub sign-in was cancelled.'
        : (error_description || "We couldn't complete GitHub sign-in. Please try again.");
      return respondWithError(400, userMsg);
    }

    // 2. Validate OAuth state parameter (Strict CSRF / Replay Protection)
    if (!state || !githubAuthService.verifyOAuthState(state)) {
      return respondWithError(400, 'Invalid or expired authorization state. Please try again.');
    }

    // 3. Validate presence of authorization code
    if (!code || typeof code !== 'string') {
      return respondWithError(400, 'Missing authorization code from GitHub.');
    }

    // 4. Exchange authorization code for GitHub access token
    let accessToken;
    try {
      accessToken = await githubAuthService.exchangeCodeForToken(code);
    } catch {
      return respondWithError(401, "We couldn't complete GitHub sign-in. Please try again.");
    }

    // 5. Fetch user profile and verified email
    let profile;
    let email;
    try {
      profile = await githubAuthService.getGitHubUserProfile(accessToken);
      email = await githubAuthService.getGitHubVerifiedEmail(accessToken, profile.publicEmail);
    } catch (err) {
      const status = err.statusCode || 400;
      return respondWithError(status, err.message || "We couldn't verify an email address for your GitHub account.");
    }

    const githubId = String(profile.id);

    // 6. Lookup existing user by GitHub ID (subject)
    let user = await User.findOne({ githubId });

    if (user) {
      if (!user.isActive) {
        return respondWithError(401, 'Your account has been deactivated. Please contact support.');
      }

      if (!user.profilePhoto && profile.avatarUrl) {
        user.profilePhoto = profile.avatarUrl;
        await user.save();
      }

      const { token } = await issueSessionAndToken(user, req);
      await securityLogger.logSecurityEvent({
        action: 'auth.github_login',
        user,
        req,
      });

      if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
        return res.status(200).json({
          success: true,
          message: 'GitHub sign-in successful',
          data: { user: serializeUser(user), token },
        });
      }

      return res.redirect(`${clientBaseUrl}/auth/callback?token=${encodeURIComponent(token)}`);
    }

    // 7. Lookup existing user by verified email (Safe Account Linking)
    const existingEmailUser = await User.findOne({ email });

    if (existingEmailUser) {
      if (!existingEmailUser.isActive) {
        return respondWithError(401, 'Your account has been deactivated. Please contact support.');
      }

      if (existingEmailUser.githubId && existingEmailUser.githubId !== githubId) {
        return respondWithError(409, 'This account is already linked to a different GitHub identity.');
      }

      // Safely link GitHub ID to existing account (role and permissions preserved)
      existingEmailUser.githubId = githubId;
      const wasUnverified = !existingEmailUser.emailVerified;
      if (wasUnverified) {
        existingEmailUser.emailVerified = true;
        existingEmailUser.emailVerifiedAt = new Date();
        // Clear old unverified password/reset tokens to prevent takeover via previously set password
        existingEmailUser.password = undefined;
        existingEmailUser.passwordResetTokenHash = undefined;
        existingEmailUser.passwordResetExpiresAt = undefined;
        existingEmailUser.emailVerificationTokenHash = undefined;
        existingEmailUser.emailVerificationExpiresAt = undefined;
        // Invalidate all previously active sessions to eject any pre-existing unverified sessions
        await sessionService.revokeAllSessions(existingEmailUser._id);
      }
      if (!existingEmailUser.profilePhoto && profile.avatarUrl) {
        existingEmailUser.profilePhoto = profile.avatarUrl;
      }
      await existingEmailUser.save();

      const { token } = await issueSessionAndToken(existingEmailUser, req);
      await securityLogger.logSecurityEvent({
        action: 'auth.github_login_linked',
        user: existingEmailUser,
        req,
      });

      if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
        return res.status(200).json({
          success: true,
          message: 'GitHub account linked and sign-in successful',
          data: { user: serializeUser(existingEmailUser), token },
        });
      }

      return res.redirect(`${clientBaseUrl}/auth/callback?token=${encodeURIComponent(token)}`);
    }

    // 8. Create new student user (STRICT role: 'student', ignore any client role parameters)
    const rawName = (profile.name || profile.login || 'GitHub User').trim();
    const nameParts = rawName.split(' ');
    const firstName = nameParts[0] || 'GitHub';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      githubId,
      authProvider: 'github',
      role: 'student', // Security requirement: Never allow admin creation via GitHub
      profilePhoto: profile.avatarUrl || '',
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    const { token } = await issueSessionAndToken(newUser, req);
    await securityLogger.logSecurityEvent({
      action: 'auth.github_signup',
      user: newUser,
      req,
    });

    // Send welcome notification
    try {
      await notificationService.createNotification({
        recipient: newUser._id,
        type: 'system_announcement',
        title: 'Welcome to RecruitReady',
        message: 'Your account was successfully created via GitHub Login.',
        link: '/profile',
        metadata: { action: 'github_signup' },
      });
    } catch {
      // Non-blocking notification failure
    }

    if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
      return res.status(201).json({
        success: true,
        message: 'GitHub registration successful',
        data: { user: serializeUser(newUser), token },
      });
    }

    return res.redirect(`${clientBaseUrl}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Initiates password recovery. Protects against account enumeration with generic response.
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const genericMsg = 'If an account exists for this email, a password reset link has been sent.';

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(200).json({ success: true, message: genericMsg });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Anti-enumeration: return identical generic message if user doesn't exist
    if (!user || !user.isActive) {
      return res.status(200).json({ success: true, message: genericMsg });
    }

    // Generate cryptographically secure random token (64 hex characters)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Save hashed token and expiry in database (20 minutes lifetime)
    user.passwordResetTokenHash = hashedToken;
    user.passwordResetExpiresAt = new Date(Date.now() + 20 * 60 * 1000);
    await user.save();

    const clientUrl = getPrimaryClientUrl();
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

    try {
      await emailService.sendPasswordResetEmail({
        email: user.email,
        firstName: user.firstName,
        resetUrl,
        expiresInMinutes: 20,
      });
    } catch {
      // Non-blocking email dispatch failure
    }

    return res.status(200).json({
      success: true,
      message: genericMsg,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Resets user password using validated one-time reset token.
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is required.',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    // Hash incoming raw token to compare against stored SHA-256 hash
    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      passwordResetTokenHash: hashedToken,
    }).select('+passwordResetTokenHash +password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset link. Please request a new one.',
      });
    }

    // Check expiration
    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Password reset link has expired. Please request a new one.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Hash new password using bcryptjs with 12 salt rounds
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);

    // One-time use: Invalidate reset token immediately
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    // Revoke all existing active sessions for this user upon password reset
    await sessionService.revokeAllSessions(user._id);

    // Security alert notification
    try {
      await notificationService.createNotification({
        recipient: user._id,
        type: 'security_alert',
        title: 'Password Reset Successful',
        message: 'Your account password was successfully reset.',
        link: '/profile',
        metadata: { action: 'password_reset' },
      });
    } catch {
      // Non-blocking notification failure
    }

    return res.status(200).json({
      success: true,
      message: 'Your password has been updated. You can now sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-email
 * Validates email verification token and marks user emailVerified = true.
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const token = req.body?.token || req.query?.token;

    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      emailVerificationTokenHash: hashedToken,
    }).select('+emailVerificationTokenHash');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification link.',
      });
    }

    if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
      user.emailVerificationTokenHash = undefined;
      user.emailVerificationExpiresAt = undefined;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Verification link has expired. Please request a new verification email.',
      });
    }

    // Mark email as verified and clear token (one-time use)
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();

    try {
      await notificationService.createNotification({
        recipient: user._id,
        type: 'system_announcement',
        title: 'Email Verified',
        message: 'Your email address has been successfully verified.',
        link: '/profile',
        metadata: { action: 'email_verified' },
      });
    } catch {
      // Non-blocking notification failure
    }

    return res.status(200).json({
      success: true,
      message: 'Your email has been verified.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/resend-verification
 * Resends email verification link. Protects against account enumeration with generic response.
 */
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const genericMsg = 'If your account requires verification, a new verification email has been sent.';

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(200).json({ success: true, message: genericMsg });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Anti-enumeration: return identical generic message if user not found, deactivated, or already verified
    if (!user || user.emailVerified || !user.isActive) {
      return res.status(200).json({ success: true, message: genericMsg });
    }

    // Generate new raw token and SHA-256 hash (24 hours lifetime)
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');

    user.emailVerificationTokenHash = hashedVerificationToken;
    user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const clientUrl = getPrimaryClientUrl();
    const verifyUrl = `${clientUrl}/verify-email?token=${rawVerificationToken}`;

    try {
      await emailService.sendVerificationEmail({
        email: user.email,
        firstName: user.firstName,
        verifyUrl,
        expiresInHours: 24,
      });
    } catch {
      // Non-blocking email dispatch failure
    }

    return res.status(200).json({
      success: true,
      message: genericMsg,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/sessions
 * Returns all active sessions for authenticated user with device metadata.
 */
export const getActiveSessions = async (req, res, next) => {
  try {
    const sessions = await sessionService.getUserSessions(req.user._id, req.sessionId);
    res.status(200).json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/auth/sessions/:id
 * Revokes a single session owned by authenticated user.
 */
export const revokeSingleSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    const revoked = await sessionService.revokeSession(id, req.user._id);
    if (!revoked) {
      return res.status(404).json({ success: false, message: 'Session not found or already revoked' });
    }

    await securityLogger.logSecurityEvent({
      action: 'auth.session_revoked',
      user: req.user,
      req,
      details: { sessionId: id },
    });

    res.status(200).json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout-all
 * Revokes all other active sessions for authenticated user.
 */
export const logoutAllSessions = async (req, res, next) => {
  try {
    const revokedCount = await sessionService.revokeAllSessions(req.user._id, req.sessionId);

    await securityLogger.logSecurityEvent({
      action: 'auth.logout_all',
      user: req.user,
      req,
      details: { revokedCount },
    });

    res.status(200).json({
      success: true,
      message: 'All other active sessions have been logged out successfully',
      data: { revokedCount },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT/PATCH /api/auth/onboarding
 * Completes or updates student onboarding information.
 * Whitelists safe fields, rejects privilege escalation attempts.
 */
export const submitOnboarding = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      firstName,
      lastName,
      profilePhoto,
      college,
      branch,
      graduationYear,
      preparationLevel,
      targetCompanies,
      preparationGoals,
      skipped,
    } = req.body;

    if (!skipped) {
      if (firstName !== undefined && !firstName.trim()) {
        return res.status(400).json({ success: false, message: 'First name cannot be empty' });
      }
      if (lastName !== undefined && !lastName.trim()) {
        return res.status(400).json({ success: false, message: 'Last name cannot be empty' });
      }
    }

    const updates = {
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
    };

    if (firstName !== undefined && firstName.trim()) {
      updates.firstName = firstName.trim();
    }
    if (lastName !== undefined && lastName.trim()) {
      updates.lastName = lastName.trim();
    }
    if (profilePhoto !== undefined) {
      updates.profilePhoto = String(profilePhoto).trim();
    }
    if (college !== undefined) {
      updates.college = String(college).trim();
    }
    if (branch !== undefined) {
      updates.branch = String(branch).trim();
    }
    if (graduationYear !== undefined && graduationYear !== '' && graduationYear !== null) {
      const yr = Number(graduationYear);
      if (!isNaN(yr) && yr >= 2000 && yr <= 2100) {
        updates.graduationYear = yr;
      }
    }
    if (preparationLevel !== undefined) {
      const allowedLevels = ['Just Starting', 'Beginner', 'Intermediate', 'Advanced', 'Placement Ready', ''];
      if (allowedLevels.includes(preparationLevel)) {
        updates.preparationLevel = preparationLevel;
      }
    }
    if (Array.isArray(targetCompanies)) {
      updates.targetCompanies = targetCompanies.map((c) => String(c).trim()).filter(Boolean);
    }
    if (Array.isArray(preparationGoals)) {
      updates.preparationGoals = preparationGoals.map((g) => String(g).trim()).filter(Boolean);
    }

    // Security invariant: Critical fields (role, isActive, email, password, emailVerified)
    // are strictly omitted from updates, preventing privilege escalation or account takeover.
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    await securityLogger.logSecurityEvent({
      action: 'auth.onboarding_completed',
      user: updatedUser,
      req,
      details: { skipped: Boolean(skipped) },
    });

    return res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        user: serializeUser(updatedUser),
      },
    });
  } catch (error) {
    next(error);
  }
};


/**
 * POST /api/auth/consent
 * Records consent for authenticated users (e.g. first-time Google/GitHub sign-ups).
 */
export const recordConsent = async (req, res, next) => {
  try {
    const { consent } = req.body;
    if (consent !== true) {
      return res.status(400).json({
        success: false,
        message: 'Consent is required.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.consentAcceptedAt = new Date();
    user.consentVersion = '1.0-test';
    await user.save();

    await securityLogger.logSecurityEvent({
      action: 'auth.consent_accepted',
      user,
      req,
      details: { consentVersion: '1.0-test' },
    });

    res.status(200).json({
      success: true,
      message: 'Consent recorded successfully',
      data: {
        user: serializeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  googleLogin,
  githubLogin,
  githubCallback,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  getCurrentUser,
  updateProfile,
  submitOnboarding,
  changePassword,
  logout,
  getActiveSessions,
  revokeSingleSession,
  logoutAllSessions,
  recordConsent,
};


