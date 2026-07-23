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
import { managerAndAbove } from '../middleware/rbac.js';

const router = Router();

router.use(authenticateToken);

router.get('/', listBlacklist);
router.post('/', managerAndAbove, banNumber);
router.post('/bulk-ban', managerAndAbove, bulkBan);
router.post('/bulk-unban', managerAndAbove, bulkUnban);
router.delete('/:phone', managerAndAbove, unbanNumber);

router.get('/keywords', listKeywords);
router.post('/keywords', addKeyword);
router.post('/duplicates/check', checkDuplicates);

export default router;
