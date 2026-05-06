import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import meetingRoutes from './routes/meeting.routes';
import messageRoutes from './routes/message.routes';
import { setupMeetingSockets } from './sockets/meeting.socket';
import { connectRedis, isRedisConnected } from './config/redis';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger';
import compression from 'compression';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares
app.use(helmet());
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true 
}));
app.use(limiter);
app.use(compression());
app.use(express.json());
app.use(cookieParser());

// Request Logging Middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/messages', messageRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.status(200).json({ 
    status: 'OK', 
    message: 'Backend is running',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    redis: isRedisConnected ? 'Connected' : 'Disconnected'
  });
});

// Socket.io connection logic
setupMeetingSockets(io);

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/internship_project';

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    logger.info('Successfully connected to MongoDB');
    await connectRedis(); 
    httpServer.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  });
