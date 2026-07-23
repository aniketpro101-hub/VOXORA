import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'voxora_super_secret_jwt_key_2026_aniket_samant';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'voxora_super_secret_refresh_key_2026_actasiff';

export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
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
