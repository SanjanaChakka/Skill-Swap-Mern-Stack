import Notification from '../models/Notification.js';
import UserModel from '../models/User.js';
import nodemailer from 'nodemailer';

let io = null;
let transporter = null;

export function initNotificationService(socketIo) {
  io = socketIo;
}

async function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT } = process.env;
  if (!SMTP_HOST || !SMTP_USER) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export async function sendEmail(user, subject, html) {
  const tr = await getTransporter();
  if (!tr) {
    console.log(`[email:mock] to=${user.email} subject="${subject}"`);
    return { mocked: true };
  }
  return tr.sendMail({
    from: process.env.EMAIL_FROM || 'SkillSwap <no-reply@skillswap.dev>',
    to: user.email,
    subject,
    html,
  });
}

/**
 * Create an in-app notification (stored + pushed over socket) and
 * optionally send an email notification.
 */
export async function notifyUser({ userId, type, title, body, data = {}, sendEmail: doEmail = true }) {
  const notif = await Notification.create({ user: userId, type, title, body, data });
  if (io) {
    io.to(`user:${String(userId)}`).emit('notification:new', notif);
  }
  if (doEmail) {
    try {
      const user = await UserModel.findById(userId).select('email name');
      if (user) await sendEmail(user, title, `<p>${body || title}</p><p>From the SkillSwap team.</p>`);
    } catch (err) {
      console.error('Email notification failed:', err.message);
    }
  }
  return notif;
}
