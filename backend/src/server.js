import express from 'express';
import cors from 'cors';
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
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

// 1. Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 2. Configure CORS
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim()).filter(Boolean)
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
  credentials: true,
}));

// 3. Configure JSON & URL-encoded parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Register routes
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
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

// 5. Register 404 and global error handlers
app.use(notFound);
app.use(errorHandler);

// 6. Connect to MongoDB and start HTTP server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`\n  RecruitReady API running on http://localhost:${PORT}`);
      console.log(`  Health: http://localhost:${PORT}/api/health`);
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

startServer();

export default app;
