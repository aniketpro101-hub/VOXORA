import { Router, Request, Response } from 'express';
import { uploadMiddleware, formatFileResponse } from '../services/uploadService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { authenticateToken } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

const router = Router();

router.use(authenticateToken);

router.post('/media', uploadMiddleware.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return sendError(res, 'No file uploaded', 400);
  }
  const fileData = formatFileResponse(req, req.file);
  return sendSuccess(res, 'File uploaded successfully', fileData, 201);
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
