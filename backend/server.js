import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Routes
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import lessonRoutes from './routes/lessons.js';
import instructorRoutes from './routes/instructor.js';
import certificateRoutes from './routes/certificates.js';
import studentRoutes from './routes/students.js';
import studentProgressRoutes from './routes/studentProgress.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Allowed origins
const allowedOrigins = [
  'http://localhost:3000',                                // Dev frontend
  'https://frontend-8zboov25a-daniels-projects-7a223cf3.vercel.app', // Deployed frontend
].filter(Boolean);

// Express CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (curl, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy does not allow access from ${origin}`));
    }
  },
  credentials: true
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/student-progress', studentProgressRoutes);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-course', (courseId) => {
    socket.join(courseId);
    console.log(`User ${socket.id} joined course ${courseId}`);
  });

  socket.on('progress-update', (data) => {
    socket.to(data.courseId).emit('progress-changed', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

export { io };
