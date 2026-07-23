import { Router } from 'express';
import {
  sendText,
  sendImage,
  sendVideo,
  sendDocument,
  sendAudio,
  sendLocation,
  sendButtons,
  sendList,
  sendMediaButtons,
  sendCarousel,
  verifyNumber,
  sendTest,
  previewMessage,
} from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/auth.js';
import { agentAndAbove } from '../middleware/rbac.js';

const router = Router();

router.use(authenticateToken);
router.use(agentAndAbove);

router.post('/send-text', sendText);
router.post('/send-image', sendImage);
router.post('/send-video', sendVideo);
router.post('/send-document', sendDocument);
router.post('/send-audio', sendAudio);
router.post('/send-location', sendLocation);
router.post('/send-buttons', sendButtons);
router.post('/send-list', sendList);
router.post('/send-media-buttons', sendMediaButtons);
router.post('/send-carousel', sendCarousel);
router.post('/verify-number', verifyNumber);
router.post('/test', sendTest);
router.post('/preview', previewMessage);

export default router;
