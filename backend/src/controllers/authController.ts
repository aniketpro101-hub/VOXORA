import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../services/jwtService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least 1 number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least 1 special character'),
    phone: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least 1 number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least 1 special character'),
  }),
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, phone } = req.body;

    let existingUser = null;
    try {
      existingUser = await User.findOne({ email });
    } catch (e) {}

    if (existingUser) {
      return sendError(res, 'User with this email already exists', 400);
    }

    let userCount = 0;
    try {
      userCount = await User.countDocuments();
    } catch (e) {}

    const role = userCount === 0 ? 'admin' : 'agent';

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
    });

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(
      res,
      `User registered successfully as ${role}`,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
        },
        accessToken,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    let user = null;
    try {
      user = await User.findOne({ email }).select('+password');
    } catch (e) {}

    // Auto-seed default admin if database is empty or credentials match admin@voxora.com
    if (!user) {
      let count = 0;
      try {
        count = await User.countDocuments();
      } catch (e) {}

      if (count === 0 && (email === 'admin@voxora.com' || email === 'aniket@voxora.com')) {
        user = await User.create({
          name: 'Aniket Samant',
          email,
          password: password || 'Admin@1234',
          role: 'admin',
          isActive: true,
        });
      }
    }

    if (!user) {
      return sendError(res, 'Invalid credentials. Please register your admin account.', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Account is deactivated. Please contact an admin.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, 'Logged in successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) {
      return sendError(res, 'Refresh token required', 401);
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return sendError(res, 'Invalid refresh token', 401);
    }

    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return sendSuccess(res, 'Token refreshed', { accessToken: newAccessToken });
  } catch (error) {
    return sendError(res, 'Invalid or expired refresh token', 401);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.clearCookie('refreshToken');
    return sendSuccess(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Not authenticated', 401);
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, 'Current user profile', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return sendError(res, 'Not authenticated', 401);

    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, phone, avatar },
      { new: true }
    );

    return sendSuccess(res, 'Profile updated', user);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return sendError(res, 'Not authenticated', 401);

    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) return sendError(res, 'User not found', 404);

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return sendError(res, 'Invalid old password', 400);

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};
