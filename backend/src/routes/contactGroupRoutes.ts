import { Router } from 'express';
import {
  getContactGroups,
  createContactGroup,
  updateContactGroup,
  deleteContactGroup,
  getImportHistory,
  createImportHistory,
} from '../controllers/contactGroupController.js';
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  toggleFavorite,
  addContactNote,
  grabWhatsAppContacts,
  grabWhatsAppGroupMembers,
  importVCard,
  importGoogleCSV,
  sendQuickMessage,
  verifyWhatsAppContacts,
  getContactStats,
} from '../controllers/contactController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// Contact CRUD & Stats
router.get('/stats', getContactStats);
router.get('/', getContacts);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);
router.patch('/:id/favorite', toggleFavorite);
router.post('/:id/notes', addContactNote);

// Groups
router.get('/groups', getContactGroups);
router.post('/groups', createContactGroup);
router.put('/groups/:id', updateContactGroup);
router.delete('/groups/:id', deleteContactGroup);

// Import History
router.get('/imports', getImportHistory);
router.post('/imports', createImportHistory);

// Advanced Imports & WhatsApp Grabbers
router.post('/import/whatsapp', grabWhatsAppContacts);
router.post('/import/wa-group', grabWhatsAppGroupMembers);
router.post('/import/vcard', importVCard);
router.post('/import/google-csv', importGoogleCSV);

// Quick Messaging & Verification
router.post('/quick-message', sendQuickMessage);
router.post('/verify-whatsapp', verifyWhatsAppContacts);

export default router;
