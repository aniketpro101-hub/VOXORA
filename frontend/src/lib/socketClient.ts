import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
  : 'http://localhost:4000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('voxora_access_token') : null;

    socket = io(`${SOCKET_URL}/instances`, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      withCredentials: true,
      auth: { token: accessToken },
    });

    socket.on('connect', () => {
      console.log('✅ Connected to VOXORA Socket.IO (/instances)');
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('⚠️ Disconnected from Socket.IO:', reason);
    });
  }
  return socket;
};
