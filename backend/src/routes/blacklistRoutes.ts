import { Router } from 'express';
import {
  listBlacklist,
  banNumber,
  unbanNumber,
  bulkBan,
  bulkUnban,
  listKeywords,
  addKeyword,
  checkDuplicates,
} from '../controllers/blacklistController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', listBlacklist);
router.post('/', banNumber);
router.post('/bulk-ban', bulkBan);
router.post('/bulk-unban', bulkUnban);
router.delete('/:phone', unbanNumber);

router.get('/keywords', listKeywords);
router.post('/keywords', addKeyword);
router.post('/duplicates/check', checkDuplicates);

export default router;
