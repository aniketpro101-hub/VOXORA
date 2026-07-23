import { Router } from 'express';
import {
  listContacts,
  getContactById,
  createContact,
  updateContact,
  listPipelines,
  listDeals,
  createDeal,
  moveDealStage,
  listTasks,
  createTask,
  createNote,
} from '../controllers/crmController.js';
import { authenticateToken } from '../middleware/auth.js';
import { agentAndAbove } from '../middleware/rbac.js';

const router = Router();

router.use(authenticateToken);
router.use(agentAndAbove);

// Contacts
router.get('/contacts', listContacts);
router.post('/contacts', createContact);
router.get('/contacts/:id', getContactById);
router.put('/contacts/:id', updateContact);

// Pipelines & Deals
router.get('/pipelines', listPipelines);
router.get('/deals', listDeals);
router.post('/deals', createDeal);
router.patch('/deals/:id/stage', moveDealStage);

// Tasks & Notes
router.get('/tasks', listTasks);
router.post('/tasks', createTask);
router.post('/notes', createNote);

export default router;
