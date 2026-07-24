import { Router, Request, Response, NextFunction } from 'express';
import {
  uploadMiddleware,
  formatFileResponse,
  validateAndRecordUpload,
  getStorageInfo,
} from '../services/uploadService.js';
import validationService from '../services/validationService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

const router = Router();

router.use(authenticateToken);

// ═══ GET STORAGE USAGE INFO ═══
router.get('/storage', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId || 'dev-user';
    if (!userId) return sendError(res, 'User ID not found', 401);
    const info = await getStorageInfo(userId);
    return sendSuccess(res, 'Storage quota information fetched successfully', info);
  } catch (error) {
    next(error);
  }
});

// ═══ VALIDATE COMPLETE MESSAGE PRE-FLIGHT ═══
router.post('/validate-message', (req: Request, res: Response) => {
  const validation = validationService.validateCompleteMessage(req.body);
  return sendSuccess(res, 'Message validation completed', validation);
});

// ═══ SINGLE FILE UPLOAD WITH VALIDATION & QUOTA ═══
router.post('/media', uploadMiddleware.single('file'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file provided in request', 400);
    }
    const userId = req.user?.userId || 'dev-user';
    const result = await validateAndRecordUpload(req, req.file, userId);
    return sendSuccess(res, 'File uploaded and validated successfully', result, 201);
  } catch (error: any) {
    if (error.code === 'FILE_VALIDATION_FAILED' || error.code === 'STORAGE_QUOTA_EXCEEDED') {
      return sendError(res, error.message, 400, {
        errors: error.errors || [error.message],
        suggestions: error.suggestions || [error.suggestion],
      });
    }
    next(error);
  }
});

router.post('/multiple', uploadMiddleware.array('files', 10), (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return sendError(res, 'No files uploaded', 400);
  }
  const fileDataList = files.map((file) => formatFileResponse(req, file));
  return sendSuccess(res, 'Files uploaded successfully', fileDataList, 201);
});

router.delete('/:filePath(*)', (req: Request, res: Response) => {
  try {
    const relativePath = req.params.filePath;
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    const fullPath = path.resolve(process.cwd(), relativePath);

    if (!fullPath.startsWith(uploadsDir)) {
      return sendError(res, 'Access denied: Cannot delete files outside uploads directory', 403);
    }

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return sendSuccess(res, 'File deleted successfully');
    }
    return sendError(res, 'File not found', 404);
  } catch (error) {
    return sendError(res, 'Failed to delete file', 500);
  }
});

export default router;
