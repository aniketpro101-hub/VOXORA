import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Request } from 'express';
import { WHATSAPP_LIMITS } from '../config/limits.js';
import validationService from './validationService.js';
import { Attachment } from '../models/Attachment.js';
import { logger } from '../utils/logger.js';

const UPLOADS_BASE_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_BASE_DIR)) {
  fs.mkdirSync(UPLOADS_BASE_DIR, { recursive: true });
}

// Disk Storage configuration with dated subfolders YYYY/MM/DD
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const targetDir = path.join(UPLOADS_BASE_DIR, year, month, day);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Videos
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/3gpp',
    'video/webm',
    // Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/wav',
    'audio/m4a',
    'audio/amr',
    'audio/opus',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not supported by WhatsApp.`));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max for docs
  },
});

export const formatFileResponse = (req: Request, file: Express.Multer.File) => {
  const relativePath = path.relative(process.cwd(), file.path).replace(/\\/g, '/');
  const publicUrl = `${req.protocol}://${req.get('host')}/${relativePath}`;

  return {
    url: publicUrl,
    fileName: file.originalname,
    storedName: file.filename,
    fileSize: file.size,
    mimeType: file.mimetype,
    path: relativePath,
  };
};

// ═══ VALIDATE & RECORD ATTACHMENT UPLOAD ═══
export const validateAndRecordUpload = async (
  req: Request,
  file: Express.Multer.File,
  userId: string
) => {
  // 1. Validate file against Meta rules
  const validation = validationService.validateFile({
    name: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
  });

  if (!validation.valid) {
    // Delete file from disk if validation fails
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw {
      code: 'FILE_VALIDATION_FAILED',
      message: validation.errors[0] || 'File validation failed.',
      errors: validation.errors,
      suggestions: validation.suggestions,
    };
  }

  // 2. Check User Storage Quota
  await checkStorageQuota(userId, file.size);

  const relativePath = path.relative(process.cwd(), file.path).replace(/\\/g, '/');
  const publicUrl = `/${relativePath}`;
  const fileSizeMB = parseFloat((file.size / (1024 * 1024)).toFixed(2));

  // Determine file category
  let fileTypeCategory: 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'gif' = 'document';
  if (file.mimetype.startsWith('image/')) fileTypeCategory = 'image';
  else if (file.mimetype.startsWith('video/')) fileTypeCategory = 'video';
  else if (file.mimetype.startsWith('audio/')) fileTypeCategory = 'audio';

  // 3. Save Attachment Record in Database
  const attachment = await Attachment.create({
    fileName: file.filename,
    originalName: file.originalname,
    filePath: file.path,
    fileUrl: publicUrl,
    fileSize: file.size,
    fileSizeMB,
    mimeType: file.mimetype,
    fileType: fileTypeCategory,
    userId,
    validated: true,
  });

  logger.info(`[UploadService] File recorded: ${file.originalname} (${fileSizeMB} MB) for user ${userId}`);

  return {
    success: true,
    attachment: {
      id: attachment._id,
      url: publicUrl,
      fileName: attachment.originalName,
      fileSize: attachment.fileSize,
      fileSizeMB: attachment.fileSizeMB,
      fileType: attachment.fileType,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    },
    warnings: validation.warnings,
    suggestions: validation.suggestions,
  };
};

// ═══ CHECK USER STORAGE QUOTA ═══
export const checkStorageQuota = async (userId: string, incomingSizeBytes: number = 0) => {
  const attachments = await Attachment.find({ userId, isDeleted: false });

  const totalSizeBytes = attachments.reduce((sum, att) => sum + att.fileSize, 0) + incomingSizeBytes;
  const totalSizeMB = totalSizeBytes / (1024 * 1024);
  const maxStorageMB = WHATSAPP_LIMITS.STORAGE.MAX_TOTAL_STORAGE_MB;

  if (totalSizeMB > maxStorageMB) {
    throw {
      code: 'STORAGE_QUOTA_EXCEEDED',
      message: `Storage quota exceeded: ${totalSizeMB.toFixed(2)} MB / ${maxStorageMB} MB limit.`,
      suggestion: 'Delete older files or wait 48 hours for auto-cleanup.',
    };
  }

  if (attachments.length >= WHATSAPP_LIMITS.STORAGE.MAX_FILES_PER_USER) {
    throw {
      code: 'FILE_COUNT_EXCEEDED',
      message: `Maximum file limit (${WHATSAPP_LIMITS.STORAGE.MAX_FILES_PER_USER} active files) reached.`,
      suggestion: 'Delete old files or wait for 48-hour auto-cleanup.',
    };
  }
};

// ═══ GET STORAGE USAGE INFO ═══
export const getStorageInfo = async (userId: string) => {
  const attachments = await Attachment.find({ userId, isDeleted: false });

  const totalSize = attachments.reduce((sum, att) => sum + att.fileSize, 0);
  const maxStorage = WHATSAPP_LIMITS.STORAGE.MAX_TOTAL_STORAGE_MB * 1024 * 1024;

  return {
    used: {
      bytes: totalSize,
      mb: parseFloat((totalSize / (1024 * 1024)).toFixed(2)),
      percentage: parseFloat(((totalSize / maxStorage) * 100).toFixed(1)),
    },
    quota: {
      bytes: maxStorage,
      mb: WHATSAPP_LIMITS.STORAGE.MAX_TOTAL_STORAGE_MB,
    },
    files: {
      current: attachments.length,
      max: WHATSAPP_LIMITS.STORAGE.MAX_FILES_PER_USER,
    },
    retentionHours: WHATSAPP_LIMITS.STORAGE.RETENTION_HOURS,
  };
};

// ═══ 48-HOUR DISK CLEANUP CRON FUNCTION ═══
export const cleanupExpiredFiles = async () => {
  try {
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const expiredAttachments = await Attachment.find({
      uploadedAt: { $lt: cutoffTime },
      isDeleted: false,
    });

    let cleanedCount = 0;
    for (const att of expiredAttachments) {
      if (fs.existsSync(att.filePath)) {
        try {
          fs.unlinkSync(att.filePath);
        } catch (e: any) {
          logger.warn(`Failed to unlink file ${att.filePath}: ${e.message}`);
        }
      }
      att.isDeleted = true;
      att.deletedAt = new Date();
      await att.save();
      cleanedCount++;
    }

    if (cleanedCount > 0) {
      logger.info(`[48h Storage Cleanup] Auto-deleted ${cleanedCount} expired media attachments from disk.`);
    }
  } catch (err: any) {
    logger.error(`[48h Storage Cleanup Error] ${err.message}`);
  }
};
