const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const socketio = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = socketio(server, {
    path: '/socket.io',
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  global._io = io;

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('message', (msg) => {
      console.log('Message received:', msg);
      io.emit('message', msg); // broadcast to all clients
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 