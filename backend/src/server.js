import dotenv from 'dotenv';
import connectDB from './config/db.js';
import validateEnv from './config/validateEnv.js';
import app from './app.js';
import logger from './utils/logger.js';

// 1. Load environment variables
dotenv.config();

// 1b. Validate environment variables before initialization
const envCheck = validateEnv();
if (!envCheck.isValid) {
  logger.fatal({ errors: envCheck.errors }, 'Environment configuration validation failed');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP server
let server;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'RecruitReady API running');
    });
  } catch (error) {
    logger.fatal({ err: { message: error.message, stack: error.stack } }, 'Database connection failed. Server not started.');
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info({ signal }, 'Signal received. Closing HTTP server gracefully...');
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        const mongoose = (await import('mongoose')).default;
        await mongoose.connection.close(false);
        logger.info('MongoDB connection closed cleanly.');
        process.exit(0);
      } catch (err) {
        logger.error({ err: { message: err.message } }, 'Error closing database connection');
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.fatal({ err: { message: err.message, stack: err.stack, name: err.name } }, 'Uncaught exception detected. Process exiting with code 1.');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(
    { reason: reason instanceof Error ? { message: reason.message, stack: reason.stack, name: reason.name } : reason },
    'Unhandled rejection detected'
  );
});

startServer();

export default app;
