import { Router } from 'express';
import {
  createInstance,
  getQRCode,
  getPairingCode,
  getStatus,
  getInstances,
  getInstance,
  updateInstance,
  deleteInstance,
  disconnectInstance,
  restartInstance,
  refreshQR,
  updateAccountAge,
  applyAdminOverride,
  getInstanceStats,
  getAllInstancesHealth,
  createInstanceSchema,
  pairingCodeSchema,
} from '../controllers/instanceController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createInstance);
router.get('/', getInstances);
router.get('/:id', getInstance);
router.put('/:id', updateInstance);
router.delete('/:id', deleteInstance);

router.get('/:id/qr', getQRCode);
router.post('/:id/pairing-code', getPairingCode);
router.get('/:id/status', getStatus);
router.post('/:id/disconnect', disconnectInstance);
router.post('/:id/restart', restartInstance);
router.post('/:id/refresh-qr', refreshQR);

// Phase B Routes: Account Age, Admin Override & Health Stats
router.post('/:id/age', updateAccountAge);
router.post('/:id/override', applyAdminOverride);
router.get('/:id/stats', getInstanceStats);
router.get('/health/all', getAllInstancesHealth);

export default router;
