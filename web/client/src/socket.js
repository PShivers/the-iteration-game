import { io } from 'socket.io-client';

// Connects to same origin — works in dev (via Vite proxy) and production (same server)
export const socket = io({ autoConnect: false });
