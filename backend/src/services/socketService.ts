import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger.js';

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
  });

  const instanceNamespace = io.of('/instances');

  instanceNamespace.on('connection', (socket: Socket) => {
    logger.info(`[Socket.IO] Client connected to /instances namespace (${socket.id})`);

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

  logger.info('✅ Socket.IO Server initialized on /instances namespace');
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
    if (payload?.instanceId) {
      io.of('/instances').to(`instance:${payload.instanceId}`).emit(event, payload);
    } else {
      io.of('/instances').emit(event, payload);
    }
  }
};
