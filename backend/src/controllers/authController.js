import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

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
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ success: false, message: 'First name is required' });
    }
    if (!lastName || !lastName.trim()) {
      return res.status(400).json({ success: false, message: 'Last name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
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

    // 4. Create user — strictly enforce role: 'student' (never accept role from public body)
    const newUser = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'student',
      college: college ? college.trim() : '',
      branch: branch ? branch.trim() : '',
      graduationYear: graduationYear ? Number(graduationYear) : undefined,
    });

    // 5. Generate JWT token
    const token = generateToken(newUser);

    // 6. Return safe user data without password
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Registration successful',
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

    // 1. Validation
    if (!email || !password) {
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
      return res.status(401).json({
        success: false,
        message: invalidCredentialsMsg,
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // 3. Compare password using bcryptjs
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: invalidCredentialsMsg,
      });
    }

    // 4. Generate token
    const token = generateToken(user);

    // 5. Return safe user data
    const userResponse = user.toObject();
    delete userResponse.password;

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
      targetCompanies,
      preparationGoals,
      profilePhoto,
    } = req.body;

    // Validations
    if (firstName !== undefined && !firstName.trim()) {
      return res.status(400).json({ success: false, message: 'First name cannot be empty' });
    }
    if (lastName !== undefined && !lastName.trim()) {
      return res.status(400).json({ success: false, message: 'Last name cannot be empty' });
    }

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName.trim();
    if (lastName !== undefined) updates.lastName = lastName.trim();
    if (college !== undefined) updates.college = college.trim();
    if (branch !== undefined) updates.branch = branch.trim();
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
    if (targetCompanies !== undefined && Array.isArray(targetCompanies)) {
      updates.targetCompanies = targetCompanies.map((c) => String(c).trim()).filter(Boolean);
    }
    if (preparationGoals !== undefined && Array.isArray(preparationGoals)) {
      updates.preparationGoals = preparationGoals.map((g) => String(g).trim()).filter(Boolean);
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

    const userResponse = updatedUser.toObject ? updatedUser.toObject() : { ...updatedUser };
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userResponse,
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
 * Stateless logout confirmation.
 */
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

export default {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
};
