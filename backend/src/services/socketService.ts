import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger.js';
import { verifyAccessToken } from './jwtService.js';

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (
        process.env.ALLOWED_ORIGINS ||
        process.env.CORS_ORIGIN ||
        'http://localhost:3000,http://localhost:4000,https://voxora.roasbodhi.in'
      )
        .split(',')
        .map((s) => s.trim()),
      credentials: true,
    },
  });

  const instanceNamespace = io.of('/instances');

  // Socket.IO JWT Handshake Authentication Middleware
  instanceNamespace.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      (socket.handshake.query?.token as string);

    if (!token) {
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

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO server has not been initialized');
  }
  return io;
};

export const getSocketIO = getIO;

export const emitInstanceEvent = (event: string, payload: any) => {
  if (io) {
    const instanceNamespace = io.of('/instances');
    if (payload?.instanceId) {
      instanceNamespace.to(`instance:${payload.instanceId}`).emit(event, payload);
    }
    if (payload?.id) {
      instanceNamespace.to(`instance:${payload.id}`).emit(event, payload);
    }
    instanceNamespace.emit(event, payload);
  }
};
