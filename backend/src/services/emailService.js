import nodemailer from 'nodemailer';

let transporterInstance = null;

/**
 * getTransporter — Lazily initializes the Nodemailer SMTP transporter.
 * Returns null if SMTP credentials are not configured.
 */
const getTransporter = () => {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  const port = Number(process.env.EMAIL_PORT) || 587;
  const secure = port === 465;

  if (!host || !user || !pass || host === 'smtp.example.com') {
    return null;
  }

  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  return transporterInstance;
};

/**
 * sendPasswordResetEmail — Sends password recovery instructions with one-time reset link.
 *
 * @param {Object} options
 * @param {string} options.email - Recipient email address
 * @param {string} options.firstName - Recipient first name
 * @param {string} options.resetUrl - Full client-side reset URL including raw token
 * @param {number} [options.expiresInMinutes=20] - Token expiration duration in minutes
 */
export const sendPasswordResetEmail = async ({
  email,
  firstName = 'Student',
  resetUrl,
  expiresInMinutes = 20,
}) => {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || '"RecruitReady Support" <no-reply@recruiteready.local>';

  // Development fallback when SMTP is unconfigured or in development environment
  if (!transporter) {
    console.log('\n================================================================================');
    console.log(' [DEVELOPMENT ONLY] PASSWORD RESET EMAIL');
    console.log(` To: ${email}`);
    console.log(` Recipient: ${firstName}`);
    console.log(` Reset URL: ${resetUrl}`);
    console.log(` Expires in: ${expiresInMinutes} minutes`);
    console.log(' Notice: To send real emails, set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env');
    console.log('================================================================================\n');
    return { success: true, mode: 'development', resetUrl };
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your RecruitReady Password</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
        .card { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .brand { font-size: 20px; font-weight: 700; color: #2563eb; letter-spacing: -0.5px; margin-bottom: 24px; }
        .title { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; }
        .footer { font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
        .link { word-break: break-all; color: #2563eb; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">RecruitReady</div>
        <div class="title">Reset Your Password</div>
        <p class="text">
          Hello ${firstName},<br><br>
          We received a request to reset your password for your RecruitReady account. Click the button below to choose a new password:
        </p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" class="btn">Reset Password</a>
        </p>
        <p class="text">
          This password reset link is valid for <strong>${expiresInMinutes} minutes</strong> and can only be used once.<br><br>
          If you did not request a password reset, you can safely ignore this email. Your current password will remain unchanged.
        </p>
        <div class="footer">
          If the button above does not work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" class="link">${resetUrl}</a>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Reset Your RecruitReady Password',
    text: `Hello ${firstName},\n\nWe received a request to reset your password for your RecruitReady account.\n\nReset link (valid for ${expiresInMinutes} minutes):\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
    html,
  });

  return { success: true, mode: 'smtp' };
};

/**
 * sendVerificationEmail — Sends email verification link after account registration.
 *
 * @param {Object} options
 * @param {string} options.email - Recipient email address
 * @param {string} options.firstName - Recipient first name
 * @param {string} options.verifyUrl - Full client-side verification URL including raw token
 * @param {number} [options.expiresInHours=24] - Token expiration duration in hours
 */
export const sendVerificationEmail = async ({
  email,
  firstName = 'Student',
  verifyUrl,
  expiresInHours = 24,
}) => {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || '"RecruitReady Support" <no-reply@recruiteready.local>';

  // Development fallback when SMTP is unconfigured or in development environment
  if (!transporter) {
    console.log('\n================================================================================');
    console.log(' [DEVELOPMENT ONLY] EMAIL VERIFICATION EMAIL');
    console.log(` To: ${email}`);
    console.log(` Recipient: ${firstName}`);
    console.log(` Verify URL: ${verifyUrl}`);
    console.log(` Expires in: ${expiresInHours} hours`);
    console.log(' Notice: To send real emails, set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env');
    console.log('================================================================================\n');
    return { success: true, mode: 'development', verifyUrl };
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your RecruitReady Email Address</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
        .card { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .brand { font-size: 20px; font-weight: 700; color: #2563eb; letter-spacing: -0.5px; margin-bottom: 24px; }
        .title { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; }
        .footer { font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
        .link { word-break: break-all; color: #2563eb; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">RecruitReady</div>
        <div class="title">Verify Your Email Address</div>
        <p class="text">
          Hello ${firstName},<br><br>
          Thank you for signing up for RecruitReady! Please verify your email address to confirm your account and enable full access to placement preparation modules.
        </p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" class="btn">Verify Email Address</a>
        </p>
        <p class="text">
          This verification link is valid for <strong>${expiresInHours} hours</strong>.<br><br>
          If you did not create an account on RecruitReady, you can safely ignore this message.
        </p>
        <div class="footer">
          If the button above does not work, copy and paste this link into your browser:<br>
          <a href="${verifyUrl}" class="link">${verifyUrl}</a>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Verify Your RecruitReady Email Address',
    text: `Hello ${firstName},\n\nThank you for signing up for RecruitReady! Please verify your email address.\n\nVerification link (valid for ${expiresInHours} hours):\n${verifyUrl}\n\nIf you did not create an account, please ignore this email.`,
    html,
  });

  return { success: true, mode: 'smtp' };
};

export default {
  sendPasswordResetEmail,
  sendVerificationEmail,
};
