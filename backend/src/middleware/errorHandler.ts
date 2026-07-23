import { Request, Response, NextFunction } from 'express';
import { AppError, sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`[Error] ${err.message}`, { stack: err.stack, path: req.path });

  if (err.code === 11000) {
    return sendError(res, 'An account with this email already exists. Please log in instead.', 400);
  }

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : (err.statusCode || 500);
  return sendError(
    res,
    err.message || 'Internal server error',
    statusCode
  );
};
