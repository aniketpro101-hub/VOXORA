import { Request, Response, NextFunction } from 'express';
import { LicenseService } from '../services/licenseService.js';
import { KeyGenService } from '../services/keyGenService.js';
import { HWIDGenerator } from '../utils/hwid.js';
import { LicenseKey } from '../models/LicenseKey.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuthRequest } from '../middleware/auth.js';

// --- PUBLIC ACTIVATION ENDPOINTS ---

export const getSystemHWID = async (req: Request, res: Response) => {
  const hwid = HWIDGenerator.getHWID();
  const info = HWIDGenerator.getHostInfo();
  return sendSuccess(res, 'System HWID retrieved', { hwid, ...info });
};

export const activateKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key, hwid, pcName, osInfo } = req.body;
    if (!key) return sendError(res, 'License key is required', 400);

    const clientHWID = hwid || HWIDGenerator.getHWID();
    const clientPCName = pcName || HWIDGenerator.getHostInfo().pcName;
    const clientOSInfo = osInfo || HWIDGenerator.getHostInfo().osInfo;

    const result = await LicenseService.activateLicense(key, clientHWID, clientPCName, clientOSInfo);
    return sendSuccess(res, 'VOXORA License Activated Successfully', result);
  } catch (error: any) {
    return sendError(res, error.message || 'Activation failed', 400);
  }
};

export const verifyKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key, hwid } = req.body;
    if (!key) return sendError(res, 'Key parameter is required', 400);

    const clientHWID = hwid || HWIDGenerator.getHWID();
    const result = await LicenseService.verifyLicense(key, clientHWID);

    if (!result.valid) {
      return sendError(res, result.reason || 'License verification failed', 403, result);
    }

    return sendSuccess(res, 'License verified', result);
  } catch (error) {
    next(error);
  }
};

// --- ADMIN MANAGEMENT ENDPOINTS ---

export const listAdminKeys = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const keys = await LicenseKey.find().sort({ createdAt: -1 });

    const total = keys.length;
    const unused = keys.filter((k) => k.status === 'unused').length;
    const active = keys.filter((k) => k.status === 'active').length;
    const expired = keys.filter((k) => k.status === 'expired').length;
    const revoked = keys.filter((k) => k.status === 'revoked').length;

    return sendSuccess(res, 'License keys list retrieved', {
      stats: { total, unused, active, expired, revoked },
      keys,
    });
  } catch (error) {
    next(error);
  }
};

export const generateBulkKeys = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const count = parseInt(req.body.count || '10', 10);
    const adminNotes = req.body.adminNotes || 'Testing Phase Batch';

    const created = await KeyGenService.generateBulkKeys(count, adminNotes);
    return sendSuccess(res, `Generated ${count} new VOXORA license keys`, created, 201);
  } catch (error) {
    next(error);
  }
};

export const updateKeyAssignment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { assignedTo, notes } = req.body;

    const record = await LicenseKey.findByIdAndUpdate(id, { assignedTo, notes }, { new: true });
    return sendSuccess(res, 'Key assignment updated', record);
  } catch (error) {
    next(error);
  }
};

export const extendKeyExpiry = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const days = parseInt(req.body.days || '30', 10);

    const record = await LicenseKey.findById(id);
    if (!record) return sendError(res, 'Key not found', 404);

    const currentBase = record.expiresAt && record.expiresAt > new Date() ? new Date(record.expiresAt) : new Date();
    record.expiresAt = new Date(currentBase.getTime() + days * 24 * 60 * 60 * 1000);
    record.status = 'active';
    await record.save();

    return sendSuccess(res, `License key extended by ${days} days`, record);
  } catch (error) {
    next(error);
  }
};

export const revokeKey = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const record = await LicenseKey.findByIdAndUpdate(id, { status: 'revoked' }, { new: true });
    return sendSuccess(res, 'License key revoked', record);
  } catch (error) {
    next(error);
  }
};

export const resetKeyHWID = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const record = await LicenseKey.findByIdAndUpdate(
      id,
      { boundHWID: '', boundPCName: '', boundOSInfo: '', status: 'unused' },
      { new: true }
    );
    return sendSuccess(res, 'Hardware ID reset. Key is now ready for new PC activation.', record);
  } catch (error) {
    next(error);
  }
};

export const exportKeysExcel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const buffer = await KeyGenService.exportKeysToExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="VOXORA_License_Keys.xlsx"');
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};
