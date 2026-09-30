import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * Helper to map mongoose readyState to human-readable status
 */
const getDatabaseStatus = () => {
  const state = mongoose.connection.readyState;
  switch (state) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    case 0:
    default:
      return 'disconnected';
  }
};

/**
 * GET /api/health
 * Health check endpoint — verifies API and database connection status.
 */
router.get('/health', (req, res) => {
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    success: true,
    message: 'RecruitReady API is running',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * GET /api/health/db
 * Dedicated database status endpoint.
 */
router.get('/health/db', (req, res) => {
  const status = getDatabaseStatus();
  const isConnected = status === 'connected';
  const dbName = mongoose.connection.name || 'recruiteready';

  res.status(isConnected ? 200 : 503).json({
    success: isConnected,
    database: dbName,
    status,
  });
});

export default router;
