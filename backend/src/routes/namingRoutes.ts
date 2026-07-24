import { Router } from 'express';
import { AutoNamingService } from '../services/autoNamingService.js';
import { GoogleContactsService } from '../services/googleContactsService.js';
import { VCardExportService } from '../services/vcardExportService.js';
import { BaileysEngine } from '../services/baileysEngine.js';
import { Contact } from '../models/Contact.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const router = Router();

router.use(authenticateToken);

// 1. Get Naming Config
router.get('/config', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const config = await AutoNamingService.getOrCreateConfig(userId);
    return sendSuccess(res, 'Auto-naming configuration retrieved', config);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch auto-naming config', 500);
  }
});

// 2. Update Naming Config
router.put('/config', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const config = await AutoNamingService.updateConfig(userId, req.body);
    return sendSuccess(res, 'Auto-naming configuration updated successfully', config);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to update auto-naming config', 500);
  }
});

// 3. Bulk Auto-Name Contacts
router.post('/auto-name', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const { contactIds } = req.body;
    if (!Array.isArray(contactIds) || !contactIds.length) {
      return sendError(res, 'Array of contactIds is required', 400);
    }
    const results = await AutoNamingService.bulkAutoName(contactIds, userId);
    return sendSuccess(res, 'Bulk auto-naming completed', results);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to execute bulk auto-naming', 500);
  }
});

// 4. Preview Generated Names
router.post('/preview', async (req: any, res: any) => {
  try {
    const preview = AutoNamingService.previewNames(req.body, 5);
    return sendSuccess(res, 'Name previews generated', { preview });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to generate name preview', 500);
  }
});

// 5. WhatsApp Contact Sync
router.post('/sync/whatsapp', async (req: any, res: any) => {
  try {
    const { instanceId, contactIds } = req.body;
    if (!instanceId || !Array.isArray(contactIds)) {
      return sendError(res, 'instanceId and contactIds are required', 400);
    }

    const contacts = await Contact.find({ _id: { $in: contactIds } });
    const formatted = contacts.map((c) => ({ phone: c.phone, name: c.name || c.displayName || c.phone }));

    const results = await BaileysEngine.bulkSaveContactsToWhatsApp(instanceId, formatted);

    // Update DB sync status
    await Contact.updateMany(
      { _id: { $in: contactIds } },
      {
        $set: {
          'whatsappSync.isSynced': true,
          'whatsappSync.syncedAt': new Date(),
          'whatsappSync.lastSyncStatus': 'success',
        },
      }
    );

    return sendSuccess(res, 'WhatsApp contact sync completed', results);
  } catch (err: any) {
    return sendError(res, err.message || 'WhatsApp contact sync failed', 500);
  }
});

// 6. Google OAuth URL
router.get('/auth/google', (_req: any, res: any) => {
  const url = GoogleContactsService.getAuthUrl();
  return sendSuccess(res, 'Google Auth URL generated', { authUrl: url });
});

// 7. Google Contacts Sync
router.post('/sync/google', async (req: any, res: any) => {
  try {
    const { contactIds } = req.body;
    if (!Array.isArray(contactIds) || !contactIds.length) {
      return sendError(res, 'contactIds array is required', 400);
    }
    const results = await GoogleContactsService.bulkSaveToGoogle(contactIds);
    return sendSuccess(res, 'Google Contacts sync completed', results);
  } catch (err: any) {
    return sendError(res, err.message || 'Google Contacts sync failed', 500);
  }
});

// 8. Export vCard (.vcf)
router.post('/export/vcard', async (req: any, res: any) => {
  try {
    const { contactIds } = req.body;
    if (!Array.isArray(contactIds) || !contactIds.length) {
      return sendError(res, 'contactIds array is required', 400);
    }
    const downloadUrl = await VCardExportService.exportToFile(contactIds);
    return sendSuccess(res, 'vCard file generated successfully', { downloadUrl });
  } catch (err: any) {
    return sendError(res, err.message || 'vCard export failed', 500);
  }
});

export default router;
