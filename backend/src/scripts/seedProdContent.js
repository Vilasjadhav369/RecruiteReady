import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import Company from '../models/Company.js';
import StudyMaterial from '../models/StudyMaterial.js';
import MockTest from '../models/MockTest.js';
import {
  APTITUDE_SEED,
  COMPANY_SEED,
  RESOURCE_SEED,
} from './seedDevContent.js';

dotenv.config();

/**
 * seedProdContent — Production initialization utility.
 *
 * Requirements:
 * 1. Strictly refuses to run unless ALLOW_PROD_SEED=1.
 * 2. Requires ADMIN_EMAIL and ADMIN_PASSWORD (min 12 chars); never prints password.
 * 3. Idempotent: Never drops or overwrites existing records.
 * 4. Strictly seeds Aptitude, Companies, Resources, and ONE Aptitude-Only Mock Test.
 * 5. Strictly DOES NOT seed coding problems.
 */
export const seedProductionContent = async () => {
  // 1. Guard production execution
  if (process.env.ALLOW_PROD_SEED !== '1') {
    console.error('ERROR: Production seed blocked. Set ALLOW_PROD_SEED=1 to authorize seeding production content.');
    process.exit(1);
  }

  // 2. Validate admin credentials without printing any secrets
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || typeof adminEmail !== 'string' || !adminEmail.trim()) {
    console.error('ERROR: ADMIN_EMAIL environment variable is required.');
    process.exit(1);
  }

  if (!adminPassword || typeof adminPassword !== 'string') {
    console.error('ERROR: ADMIN_PASSWORD environment variable is required.');
    process.exit(1);
  }

  if (adminPassword.length < 12) {
    console.error('ERROR: ADMIN_PASSWORD must be at least 12 characters long for production.');
    process.exit(1);
  }

  try {
    await connectDB();
    console.log('[SEED:PROD] Connected to database. Beginning production seed...\n');

    // 3. Create or find administrator
    const normalizedEmail = adminEmail.trim().toLowerCase();
    let adminUser = await User.findOne({ email: normalizedEmail });

    if (adminUser) {
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        await adminUser.save();
        console.log(`[SEED:PROD] Existing user ${normalizedEmail} upgraded to admin role.`);
      } else {
        console.log(`[SEED:PROD] Admin account ${normalizedEmail} already exists.`);
      }
    } else {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      adminUser = await User.create({
        firstName: 'RecruitReady',
        lastName: 'Admin',
        email: normalizedEmail,
        password: hashedPassword,
        role: 'admin',
        college: 'RecruitReady Operations',
        branch: 'Administration',
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        consentAcceptedAt: new Date(),
        consentVersion: '1.0-test',
      });
      console.log(`[SEED:PROD] Production administrator provisioned: ${adminUser.email}`);
    }

    const adminId = adminUser._id;

    // 4. Seed Aptitude Questions (idempotent, never overwrite)
    let aptAdded = 0;
    for (const q of APTITUDE_SEED) {
      const exists = await AptitudeQuestion.findOne({ question: q.question });
      if (!exists) {
        await AptitudeQuestion.create({
          ...q,
          createdBy: adminId,
          isActive: true,
        });
        aptAdded++;
      }
    }
    console.log(`[SEED:PROD] Aptitude questions: ${aptAdded} created (${APTITUDE_SEED.length - aptAdded} already existed).`);

    // 5. Seed Companies (idempotent, never overwrite)
    let compAdded = 0;
    for (const c of COMPANY_SEED) {
      const exists = await Company.findOne({ $or: [{ name: c.name }, { slug: c.slug }] });
      if (!exists) {
        await Company.create({
          ...c,
          createdBy: adminId,
          isActive: true,
        });
        compAdded++;
      }
    }
    console.log(`[SEED:PROD] Companies: ${compAdded} created (${COMPANY_SEED.length - compAdded} already existed).`);

    // 6. Seed Resources (idempotent, never overwrite)
    let resAdded = 0;
    for (const r of RESOURCE_SEED) {
      const exists = await StudyMaterial.findOne({ title: r.title });
      if (!exists) {
        await StudyMaterial.create({
          ...r,
          uploadedBy: adminId,
          isActive: true,
        });
        resAdded++;
      }
    }
    console.log(`[SEED:PROD] Study resources: ${resAdded} created (${RESOURCE_SEED.length - resAdded} already existed).`);

    // 7. Seed ONE Aptitude-Only Mock Test (idempotent, NEVER coding)
    const mockTitle = 'General Aptitude Placement Assessment';
    const mockExists = await MockTest.findOne({ title: mockTitle });
    if (mockExists) {
      console.log(`[SEED:PROD] Mock test "${mockTitle}" already exists.`);
    } else {
      const aptQuestions = await AptitudeQuestion.find({ isActive: true }).limit(5);
      if (aptQuestions.length > 0) {
        await MockTest.create({
          title: mockTitle,
          description: 'Comprehensive 20-minute timed placement assessment evaluating Quantitative Aptitude, Logical Reasoning, and Verbal Comprehension.',
          durationMinutes: 20,
          categories: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability'],
          difficulty: 'medium',
          instructions: 'Read each question carefully before answering. Each question carries 1 mark. There is no negative marking. Auto-submits when time expires.',
          questions: aptQuestions.map((q) => ({
            questionType: 'aptitude',
            questionId: q._id,
            questionTypeRef: 'AptitudeQuestion',
            marks: 1,
          })),
          totalQuestions: aptQuestions.length,
          isPublished: true,
          createdBy: adminId,
        });
        console.log(`[SEED:PROD] Curated aptitude-only mock test "${mockTitle}" seeded successfully (${aptQuestions.length} questions).`);
      } else {
        console.warn('[SEED:PROD] Warning: No aptitude questions found to link to mock test.');
      }
    }

    console.log('\n[SEED:PROD] Production seeding completed successfully.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n[SEED:PROD ERROR] Fatal error during production seed:', error.message);
    process.exit(1);
  }
};

// Auto-run when executed directly from CLI
if (process.argv[1] && process.argv[1].endsWith('seedProdContent.js')) {
  seedProductionContent();
}
