import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';
import adminRouter from './routes/admin.js';
import aptitudeRouter from './routes/aptitude.js';
import codingRouter from './routes/coding.js';
import companyRouter from './routes/company.js';
import resourceRouter from './routes/resource.js';
import mockTestRouter from './routes/mockTest.js';
import progressRouter from './routes/progress.js';
import reviewRouter from './routes/review.js';
import leaderboardRouter from './routes/leaderboard.js';
import profileRouter from './routes/profile.js';
import notificationRouter from './routes/notification.js';
import searchRouter from './routes/search.js';
import bookmarkRouter from './routes/bookmark.js';
import goalRouter from './routes/goal.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import requestTracing from './middleware/requestTracing.js';
import validateEnv from './config/validateEnv.js';

// 1. Load environment variables
dotenv.config();

// 1b. Validate environment variables before initialization
const envCheck = validateEnv();
if (!envCheck.isValid) {
  console.error('\n  FATAL: Environment configuration validation failed:');
  envCheck.errors.forEach((err) => console.error(`    - ${err}`));
  console.error('');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy for Render / Cloudflare reverse proxies in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Request ID and latency tracing
app.use(requestTracing);

// 2. Configure Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Prevents breaking Google Identity Services and external dev resources
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'deny' },
  })
);

// 3. Configure CORS (Cross-Origin Resource Sharing)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim()).filter(Boolean)
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or same-origin server calls in test)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by CORS'));
    },
    credentials: true,
  })
);

// 4. Configure JSON & URL-encoded parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 5. NoSQL Injection Protection: recursively sanitize object keys starting with '$' or containing '.'
const sanitizeMongoQuery = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeMongoQuery(obj[key]);
    }
  }
  return obj;
};

app.use((req, res, next) => {
  if (req.body) sanitizeMongoQuery(req.body);
  if (req.query) sanitizeMongoQuery(req.query);
  if (req.params) sanitizeMongoQuery(req.params);
  next();
});

// 6. Register routes
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/admin', adminRouter);
app.use('/api/aptitude', aptitudeRouter);
app.use('/api/coding', codingRouter);
app.use('/api/companies', companyRouter);
app.use('/api/resources', resourceRouter);
app.use('/api/mock-tests', mockTestRouter);
app.use('/api/progress', progressRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/search', searchRouter);
app.use('/api/bookmarks', bookmarkRouter);
app.use('/api/goals', goalRouter);

// 7. Register 404 and global error handlers
app.use(notFound);
app.use(errorHandler);

// 8. Connect to MongoDB and start HTTP server
let server;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`\n  RecruitReady API running on http://localhost:${PORT}`);
      console.log(`  Health: http://localhost:${PORT}/api/health`);
      console.log(`  Ready: http://localhost:${PORT}/api/ready`);
      console.log(`  DB Health: http://localhost:${PORT}/api/health/db`);
      console.log(`  Auth: http://localhost:${PORT}/api/auth`);
      console.log(`  Dashboard: http://localhost:${PORT}/api/dashboard`);
      console.log(`  Aptitude: http://localhost:${PORT}/api/aptitude`);
      console.log(`  Coding: http://localhost:${PORT}/api/coding`);
      console.log(`  Companies: http://localhost:${PORT}/api/companies`);
      console.log(`  Resources: http://localhost:${PORT}/api/resources`);
      console.log(`  Mock Tests: http://localhost:${PORT}/api/mock-tests`);
      console.log(`  Progress: http://localhost:${PORT}/api/progress`);
      console.log(`  Reviews: http://localhost:${PORT}/api/reviews`);
      console.log(`  Leaderboard: http://localhost:${PORT}/api/leaderboard`);
      console.log(`  Admin: http://localhost:${PORT}/api/admin\n`);
    });
  } catch (error) {
    console.error(`\n  FATAL: Database connection failed. Server not started: ${error.message}\n`);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n[Process] ${signal} signal received. Closing HTTP server gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('[Process] HTTP server closed.');
      try {
        const mongoose = (await import('mongoose')).default;
        await mongoose.connection.close(false);
        console.log('[Process] MongoDB connection closed cleanly.');
        process.exit(0);
      } catch (err) {
        console.error('[Process] Error closing database connection:', err.message);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process Error] Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();

export default app;
