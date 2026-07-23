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
  createInstanceSchema,
  pairingCodeSchema,
} from '../controllers/instanceController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createInstance);
router.post('/create', createInstance);
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

export default router;
