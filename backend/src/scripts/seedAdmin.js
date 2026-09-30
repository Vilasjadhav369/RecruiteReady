import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

/**
 * seedAdmin — Local development utility to provision an administrator account.
 * Credentials are read strictly from environment variables (ADMIN_EMAIL, ADMIN_PASSWORD).
 *
 * Usage: npm run seed:admin
 */
const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('\n[ERROR] ADMIN_EMAIL and ADMIN_PASSWORD must be defined in .env\n');
      process.exit(1);
    }

    await connectDB();

    const normalizedEmail = adminEmail.trim().toLowerCase();
    const existingAdmin = await User.findOne({ email: normalizedEmail });

    if (existingAdmin) {
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log(`\n[SEED] User ${normalizedEmail} updated to role: admin.\n`);
      } else {
        console.log(`\n[SEED] Admin account ${normalizedEmail} already exists.\n`);
      }
      await mongoose.connection.close();
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const newAdmin = await User.create({
      firstName: 'RecruitReady',
      lastName: 'Admin',
      email: normalizedEmail,
      password: hashedPassword,
      role: 'admin',
      college: 'RecruitReady Operations',
      branch: 'Administration',
      isActive: true,
    });

    console.log(`\n[SEED] Development Admin created successfully:`);
    console.log(`       ID: ${newAdmin._id}`);
    console.log(`       Email: ${newAdmin.email}`);
    console.log(`       Role: ${newAdmin.role}\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n[SEED ERROR]', error.message, '\n');
    process.exit(1);
  }
};

seedAdmin();
