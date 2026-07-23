import { Router, Request, Response } from 'express';
import { uploadMiddleware } from '../services/uploadService.js';
import { ImportService } from '../services/importService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { authenticateToken } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/excel', uploadMiddleware.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'Excel/CSV file is required', 400);
    }

    const parsed = ImportService.parseExcel(req.file.buffer || fsToBuffer(req.file.path));
    return sendSuccess(res, 'File parsed successfully', parsed);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to parse file', 400);
  }
});

router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { rows, mapping } = req.body;
    if (!rows || !mapping) {
      return sendError(res, 'Rows and column mapping are required', 400);
    }

    const result = await ImportService.validateImportData(rows, mapping);
    return sendSuccess(res, 'Validation complete', result);
  } catch (error: any) {
    return sendError(res, error.message || 'Validation failed', 400);
  }
});

router.post('/confirm', async (req: AuthRequest, res: Response) => {
  try {
    const { validRows } = req.body;
    if (!validRows || !Array.isArray(validRows)) {
      return sendError(res, 'Valid rows array required', 400);
    }

    const result = await ImportService.confirmBulkImport(validRows, req.user?.userId);
    return sendSuccess(res, `Successfully imported ${result.insertedCount} contacts`, result);
  } catch (error: any) {
    return sendError(res, error.message || 'Import failed', 500);
  }
});

router.get('/template', (req: Request, res: Response) => {
  const buffer = ImportService.generateSampleTemplate();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=Voxora_Sample_Contacts.xlsx');
  return res.send(buffer);
});

function fsToBuffer(filePath: string): Buffer {
  const fs = require('fs');
  return fs.readFileSync(filePath);
}

export default router;
