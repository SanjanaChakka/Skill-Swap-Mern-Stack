import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';

const DEFAULT_AVAILABILITY = [
  { day: 'Monday', start: '09:00', end: '17:00', available: true },
  { day: 'Tuesday', start: '09:00', end: '17:00', available: true },
  { day: 'Wednesday', start: '09:00', end: '17:00', available: true },
  { day: 'Thursday', start: '09:00', end: '17:00', available: true },
  { day: 'Friday', start: '09:00', end: '17:00', available: true },
  { day: 'Saturday', start: '10:00', end: '14:00', available: false },
  { day: 'Sunday', start: '10:00', end: '14:00', available: false },
];

function publicUser(user) {
  const u = user.toObject ? user.toObject() : user;
  delete u.password;
  return u;
}

export async function register(req, res) {
  const { name, email, password, bio, city } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: 'Email already registered' });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hash,
    bio: bio || '',
    location: { city: city || '', radiusKm: 50 },
    availability: { schedule: DEFAULT_AVAILABILITY, timezone: '' },
  });

  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  user.lastActiveAt = new Date();
  await user.save();

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
}

export async function getMe(req, res) {
  const user = await User.findById(req.userId);
  res.json({ user: publicUser(user) });
}
