import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analyticsService.js';
import { TrackingService } from '../services/trackingService.js';
import { LinkClick } from '../models/LinkClick.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuthRequest } from '../middleware/auth.js';

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await AnalyticsService.getDashboardStats(req.user!.userId);
    return sendSuccess(res, 'Analytics dashboard metrics retrieved', stats);
  } catch (error) {
    next(error);
  }
};

export const getCampaignReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const report = await AnalyticsService.getCampaignReport(id);
    return sendSuccess(res, 'Campaign analytics report retrieved', report);
  } catch (error) {
    next(error);
  }
};

export const getContactTimeline = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const timeline = await AnalyticsService.getContactTimeline(id);
    return sendSuccess(res, 'Contact interaction timeline retrieved', timeline);
  } catch (error) {
    next(error);
  }
};

export const listLinkClicks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const clicks = await LinkClick.find().sort({ createdAt: -1 }).limit(50);
    return sendSuccess(res, 'Link clicks retrieved', clicks);
  } catch (error) {
    next(error);
  }
};

export const handleShortUrlRedirect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shortCode } = req.params;
    const targetUrl = await TrackingService.recordLinkClick(`voxora.co/${shortCode}`, req.ip, req.headers['user-agent']);
    if (targetUrl) {
      return res.redirect(targetUrl);
    }
    return res.status(404).send('Short URL not found or expired');
  } catch (error) {
    next(error);
  }
};
