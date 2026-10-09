import mongoose from 'mongoose';

/**
 * connectDB — Connect to MongoDB database using Mongoose.
 * Reads connection string from MONGODB_URI environment variable.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB Error]:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB Warn]: Disconnected from database.');
    });

    console.log(`MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

export default connectDB;
