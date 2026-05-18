import { io } from 'socket.io-client';

// In production (same-origin), connect to empty string so socket uses the same host
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://127.0.0.1:5000' : '');

export const socket = io(SOCKET_URL, {
  autoConnect: false, // We will connect manually when entering a meeting
  transports: ['websocket'], // Prefer websocket for lower latency
});
