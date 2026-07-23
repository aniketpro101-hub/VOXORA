import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { sendError } from '../utils/apiResponse.js';
import { UserRole } from '../models/User.js';

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401);
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return sendError(
        res,
        `Access denied. Role '${req.user.role}' lacks permission for this resource.`,
        403
      );
    }

    next();
  };
};

export const adminOnly = authorizeRoles('admin');
export const managerAndAbove = authorizeRoles('admin', 'manager');
export const agentAndAbove = authorizeRoles('admin', 'manager', 'agent');
