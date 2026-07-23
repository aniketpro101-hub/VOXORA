import { Response, NextFunction } from 'express';
import { MessageLog } from '../models/MessageLog.js';
import { Campaign } from '../models/Campaign.js';
import { Contact } from '../models/Contact.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AuthRequest } from '../middleware/auth.js';

/**
 * Real Database Aggregation for Dashboard Stats (Zero Fake Data)
 * FIXED: Use model-specific filters — Campaign uses {owner}, MessageLog uses {campaignId: {$in}}, Contact uses {createdBy}
 */
export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const isAdmin = req.user?.role === 'admin' || !userId;

    // Model-specific ownership filters
    const campaignFilter = isAdmin ? {} : { owner: userId };
    const contactFilter = isAdmin ? {} : { createdBy: userId };

    let msgFilter: any = {};
    if (!isAdmin && userId) {
      const userCampaigns = await Campaign.find({ owner: userId }).select('_id');
      const campaignIds = userCampaigns.map((c) => c._id);
      msgFilter = { campaignId: { $in: campaignIds } };
    }

    const totalSent = await MessageLog.countDocuments({ status: 'sent', ...msgFilter });
    const totalDelivered = await MessageLog.countDocuments({ status: 'delivered', ...msgFilter });
    const totalRead = await MessageLog.countDocuments({ status: 'read', ...msgFilter });
    const totalFailed = await MessageLog.countDocuments({ status: 'failed', ...msgFilter });
    const totalReplied = await MessageLog.countDocuments({ 'reply.received': true, ...msgFilter });

    const totalCampaigns = await Campaign.countDocuments(campaignFilter);
    const activeCampaigns = await Campaign.countDocuments({ status: 'running', ...campaignFilter });
    const totalContacts = await Contact.countDocuments(contactFilter);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaySent = await MessageLog.countDocuments({
      status: 'sent',
      createdAt: { $gte: startOfToday },
      ...msgFilter,
    });

    const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0';
    const readRate = totalDelivered > 0 ? ((totalRead / totalDelivered) * 100).toFixed(1) : '0';
    const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : '0';

    return sendSuccess(res, 'Dashboard real stats retrieved', {
      totalSent,
      totalDelivered,
      totalRead,
      totalFailed,
      totalReplied,
      totalCampaigns,
      activeCampaigns,
      totalContacts,
      todaySent,
      deliveryRate: Number(deliveryRate),
      readRate: Number(readRate),
      replyRate: Number(replyRate),
      revenue: 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Real System Activity Feed — FIXED: scoped to user's campaigns
 */
export const getRecentActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const isAdmin = req.user?.role === 'admin' || !userId;

    let msgFilter: any = {};
    let campaignFilter: any = {};
    if (!isAdmin && userId) {
      const userCampaigns = await Campaign.find({ owner: userId }).select('_id');
      const campaignIds = userCampaigns.map((c) => c._id);
      msgFilter = { campaignId: { $in: campaignIds } };
      campaignFilter = { owner: userId };
    }

    const recentLogs = await MessageLog.find(msgFilter).sort({ createdAt: -1 }).limit(10);
    const recentCampaigns = await Campaign.find(campaignFilter).sort({ createdAt: -1 }).limit(5);

    const activities = [
      ...recentLogs.map((l) => ({
        id: l._id,
        type: 'message',
        text: `Message to +${l.recipientPhone} - Status: ${l.status}`,
        timestamp: l.createdAt,
      })),
      ...recentCampaigns.map((c) => ({
        id: c._id,
        type: 'campaign',
        text: `Campaign "${c.name}" - Status: ${c.status}`,
        timestamp: c.createdAt,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return sendSuccess(res, 'Recent activity retrieved', activities.slice(0, 10));
  } catch (error) {
    next(error);
  }
};
