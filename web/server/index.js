const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const setupSocketHandlers = require('./socketHandlers');

const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV === 'development';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: isDev
    ? { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
    : undefined,
});

// In production, serve the built React app
if (!isDev) {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global rooms map: roomCode → room object
const rooms = new Map();

setupSocketHandlers(io, rooms);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${isDev ? 'dev' : 'prod'}]`);
});
