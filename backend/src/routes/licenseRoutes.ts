import { Router } from 'express';
import {
  getSystemHWID,
  activateKey,
  verifyKey,
  listAdminKeys,
  generateBulkKeys,
  updateKeyAssignment,
  extendKeyExpiry,
  revokeKey,
  resetKeyHWID,
  exportKeysExcel,
} from '../controllers/licenseController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Public Activation & HWID Routes
router.get('/hwid', getSystemHWID);
router.post('/activate', activateKey);
router.post('/verify', verifyKey);

// Protected Admin Key Management Routes
router.get('/admin/keys', authenticateToken, listAdminKeys);
router.post('/admin/generate', authenticateToken, generateBulkKeys);
router.put('/admin/assign/:id', authenticateToken, updateKeyAssignment);
router.post('/admin/extend/:id', authenticateToken, extendKeyExpiry);
router.post('/admin/revoke/:id', authenticateToken, revokeKey);
router.post('/admin/reset-pc/:id', authenticateToken, resetKeyHWID);
router.get('/admin/export', authenticateToken, exportKeysExcel);

export default router;
