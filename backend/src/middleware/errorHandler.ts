import { Request, Response, NextFunction } from 'express';
import { AppError, sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`[Error] ${err.message}`, { stack: err.stack, path: req.path });

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  return sendError(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    statusCode
  );
};
