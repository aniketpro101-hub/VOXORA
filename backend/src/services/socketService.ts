import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from './jwtService.js';
import { logger } from '../utils/logger.js';

let io: Server | null = null;

export const initSocketServer = (server: HTTPServer) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  const instanceNamespace = io.of('/instances');

  // Socket.IO JWT Handshake Authentication Middleware
  instanceNamespace.use((socket: Socket, next: any) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      (socket.handshake.query?.token as string);

    if (!token) {
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`[Socket.IO Dev] Unauthenticated socket connected in dev mode (${socket.id})`);
        (socket as any).user = { userId: 'dev-user', role: 'admin' };
        return next();
      }
      logger.warn(`[Socket.IO Auth] Connection rejected: Missing authentication token (${socket.id})`);
      return next(new Error('Authentication required for socket connection'));
    }

    try {
      const decoded = verifyAccessToken(token);
      (socket as any).user = decoded;
      next();
    } catch (err: any) {
      logger.warn(`[Socket.IO Auth] Connection rejected: Invalid token (${err.message})`);
      return next(new Error('Invalid or expired socket token'));
    }
  });

  instanceNamespace.on('connection', (socket: Socket) => {
    logger.info(`[Socket.IO] Authenticated client connected to /instances namespace (${socket.id})`);

    socket.on('join:instance', (instanceId: string) => {
      socket.join(`instance:${instanceId}`);
      logger.info(`[Socket.IO] Socket ${socket.id} joined room instance:${instanceId}`);
    });

    socket.on('leave:instance', (instanceId: string) => {
      socket.leave(`instance:${instanceId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`[Socket.IO] Client disconnected from /instances namespace (${socket.id})`);
    });
  });

  logger.info('✅ Socket.IO Server initialized with JWT Handshake Auth on /instances namespace');
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO server has not been initialized');
  }
  return io;
};

export const getSocketIO = getIO;

export const emitInstanceEvent = (event: string, payload: any) => {
  if (io) {
    const instanceNamespace = io.of('/instances');
    const targetId = payload?.instanceId || payload?.id;

    if (targetId) {
      instanceNamespace.to(`instance:${targetId}`).emit(event, payload);
    } else {
      instanceNamespace.emit(event, payload);
    }
  }
};
