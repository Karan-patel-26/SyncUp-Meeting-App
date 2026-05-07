import { io } from 'socket.io-client';

const SOCKET_URL = 'http://127.0.0.1:5000'; // Adjust if backend port changes

export const socket = io(SOCKET_URL, {
  autoConnect: false, // We will connect manually when entering a meeting
  transports: ['websocket'], // Prefer websocket for lower latency
});
