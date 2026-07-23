import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../services/jwtService.js';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      return next();
    } catch (error) {}
  }

  // Local Desktop Mode: Auto-assign Super Admin rights with a valid 24-char ObjectId
  req.user = {
    userId: '650000000000000000000001',
    email: 'aniket@voxora.com',
    role: 'admin',
  };
  next();
};
