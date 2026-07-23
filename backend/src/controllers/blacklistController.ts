import { Response, NextFunction } from 'express';
import { BlacklistNumber } from '../models/BlacklistNumber.js';
import { OptOutKeyword } from '../models/OptOutKeyword.js';
import { BlacklistEngine } from '../services/blacklistService.js';
import { DuplicateDetector } from '../services/duplicateService.js';
import { PhoneNormalizer } from '../utils/phoneNormalizer.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuthRequest } from '../middleware/auth.js';

export const listBlacklist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const query: any = {};
    if (category) query.category = category;
    if (search) query.phone = new RegExp(search, 'i');

    const numbers = await BlacklistNumber.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await BlacklistNumber.countDocuments(query);

    return sendSuccess(res, 'Blacklisted numbers retrieved', {
      numbers,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

export const banNumber = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { phone, reason, category } = req.body;
    if (!phone) return sendError(res, 'Phone number is required', 400);

    const record = await BlacklistEngine.banNumber(phone, {
      reason: reason || 'Manual Ban',
      category: category || 'manual',
      addedBy: req.user?.userId,
    });

    return sendSuccess(res, 'Number blacklisted successfully', record, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to ban number', 400);
  }
};

export const unbanNumber = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.params;
    if (req.user?.role !== 'admin') {
      return sendError(res, 'Access denied. Admin role required to unban numbers.', 403);
    }

    const result = await BlacklistEngine.unbanNumber(phone, req.user!.userId, req.body.reason);
    return sendSuccess(res, 'Number unbanned successfully', result);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to unban number', 400);
  }
};

export const bulkBan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { phones, reason, category } = req.body;
    if (!phones || !Array.isArray(phones)) return sendError(res, 'Phones array required', 400);

    const result = await BlacklistEngine.bulkBan(phones, reason || 'Bulk Manual Ban', category || 'manual', req.user?.userId);
    return sendSuccess(res, `Banned ${result.count} numbers`, result);
  } catch (error) {
    next(error);
  }
};

export const bulkUnban = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { phones, reason } = req.body;
    if (req.user?.role !== 'admin') {
      return sendError(res, 'Access denied. Admin role required.', 403);
    }
    const result = await BlacklistEngine.bulkUnban(phones, req.user!.userId, reason);
    return sendSuccess(res, `Unbanned ${result.count} numbers`, result);
  } catch (error) {
    next(error);
  }
};

export const listKeywords = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const keywords = await OptOutKeyword.find().sort({ createdAt: -1 });
    return sendSuccess(res, 'Opt-out keywords retrieved', keywords);
  } catch (error) {
    next(error);
  }
};

export const addKeyword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { keyword, language, category, severity } = req.body;
    if (!keyword) return sendError(res, 'Keyword required', 400);

    const kw = await OptOutKeyword.create({
      keyword: keyword.toLowerCase(),
      language: language || 'english',
      category: category || 'opt_out',
      severity: severity || 'high',
      customizedBy: req.user?.userId,
    });

    return sendSuccess(res, 'Custom opt-out keyword added', kw, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to add keyword', 400);
  }
};

export const checkDuplicates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { contacts } = req.body;
    if (!contacts || !Array.isArray(contacts)) return sendError(res, 'Contacts array required', 400);

    const report = await DuplicateDetector.detectInList(contacts);
    return sendSuccess(res, 'Duplicate check complete', report);
  } catch (error) {
    next(error);
  }
};
