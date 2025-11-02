const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store io instance in app for use in controllers
app.set('io', io);

// Initialize socket connection in controllers
const { setSocketIO } = require('./controllers/tokenController');
setSocketIO(io);

// Database connection
const connectDB = require('./config/database');
connectDB();

// Middleware
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000000, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Routes
app.use('/api/v1/user', require('./routes/user'));
app.use('/api/v1/token', require('./routes/token'));
app.use('/api/v1/printer', require('./routes/printer'));

// Health check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join display room for real-time updates
  socket.on('joinDisplay', () => {
    socket.join('displayRoom');
    console.log('User joined display room:', socket.id);
  });

  // Leave display room
  socket.on('leaveDisplay', () => {
    socket.leave('displayRoom');
    console.log('User left display room:', socket.id);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Emit current time every second for display
  const timeInterval = setInterval(() => {
    socket.emit('currentTime', {
      timestamp: new Date().toISOString(),
      formatted: new Date().toLocaleString(),
    });
  }, 1000);

  // Clear interval when socket disconnects
  socket.on('disconnect', () => {
    clearInterval(timeInterval);
  });
});

// Error handling middleware
const ErrorHandler = require('./middleware/Error');
app.use(ErrorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  console.log('Shutting down the server due to unhandled promise rejection');
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  console.log('Shutting down the server due to uncaught exception');
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;