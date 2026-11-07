import dotenv from 'dotenv';
import connectDB from './config/db.js';
import validateEnv from './config/validateEnv.js';
import app from './app.js';

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

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP server
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
