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
import { adminOnly } from '../middleware/rbac.js';

const router = Router();

// Public Activation & HWID Routes
router.get('/hwid', getSystemHWID);
router.post('/activate', activateKey);
router.post('/verify', verifyKey);

// Protected Admin Key Management Routes
router.get('/admin/keys', authenticateToken, adminOnly, listAdminKeys);
router.post('/admin/generate', authenticateToken, adminOnly, generateBulkKeys);
router.put('/admin/assign/:id', authenticateToken, adminOnly, updateKeyAssignment);
router.post('/admin/extend/:id', authenticateToken, adminOnly, extendKeyExpiry);
router.post('/admin/revoke/:id', authenticateToken, adminOnly, revokeKey);
router.post('/admin/reset-pc/:id', authenticateToken, adminOnly, resetKeyHWID);
router.get('/admin/export', authenticateToken, adminOnly, exportKeysExcel);

export default router;
