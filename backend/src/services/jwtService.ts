import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'voxora_jwt_secret_dev_only_change_in_production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'voxora_refresh_secret_dev_only_change_in_production';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('dev_only')) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is required in production mode. Refusing to start.');
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.includes('dev_only')) {
    throw new Error('FATAL SECURITY ERROR: JWT_REFRESH_SECRET environment variable is required in production mode. Refusing to start.');
  }
}

export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
  exp?: number;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};
