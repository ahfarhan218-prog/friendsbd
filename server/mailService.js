const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

const FROM = process.env.SMTP_FROM || 'noreply@friendsbd.com';

async function sendVerificationEmail(email, token, name) {
  const link = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: 'Verify your FriendsBD account',
      html: `<h2>Welcome to FriendsBD, ${name}!</h2><p>Click <a href="${link}">here</a> to verify your email.</p><p>Link: ${link}</p>`
    });
    console.log(`[Mail] Verification sent to ${email}`);
  } catch (err) {
    console.warn('[Mail] Failed to send verification:', err.message);
  }
}

async function sendPasswordResetEmail(email, token) {
  const link = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: 'Reset your FriendsBD password',
      html: `<h2>Password Reset</h2><p>Click <a href="${link}">here</a> to reset your password.</p><p>Link: ${link}</p><p>This link expires in 1 hour.</p>`
    });
    console.log(`[Mail] Password reset sent to ${email}`);
  } catch (err) {
    console.warn('[Mail] Failed to send password reset:', err.message);
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
