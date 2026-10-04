import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import Listing from '../models/Listing.js';
import SwapRequest from '../models/SwapRequest.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Dispute from '../models/Dispute.js';

const password = 'password123';

const DEMO_EMAILS = [
  'admin@skillswap.dev',
  'sanjana@example.com',
  'lavanya@example.com',
  'susmitha@example.com',
  'sahithi@example.com',
  'thanusha@example.com',
  'divya@example.com',
  'varshitha@example.com',
];

const availability = [
  { day: 'Monday', start: '09:00', end: '17:00', available: true },
  { day: 'Tuesday', start: '09:00', end: '17:00', available: true },
  { day: 'Wednesday', start: '09:00', end: '17:00', available: true },
  { day: 'Thursday', start: '09:00', end: '17:00', available: true },
  { day: 'Friday', start: '09:00', end: '17:00', available: true },
  { day: 'Saturday', start: '10:00', end: '14:00', available: false },
  { day: 'Sunday', start: '10:00', end: '14:00', available: false },
];

async function makeUser(overrides) {
  const hash = await bcrypt.hash(overrides.password || password, 10);
  return User.create({
    name: 'Demo User',
    email: 'demo@example.com',
    bio: '',
    profilePhoto: '',
    location: { city: '', radiusKm: 50 },
    availability: { schedule: availability, timezone: '' },
    skills: { offered: [], sought: [] },
    ...overrides,
    password: hash,
  });
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skillswap');

  const customUsers = await User.countDocuments({ email: { $nin: DEMO_EMAILS } });
  if (customUsers > 0 && process.env.SEED_FORCE !== '1') {
    console.log(`⚠️  Skipped seeding: found ${customUsers} user account(s) that are not demo users.`);
    console.log('    Re-running the seed DELETES ALL DATA, including accounts you created.');
    console.log('    If you really want to wipe and re-seed, run:  SEED_FORCE=1 npm run seed');
    await mongoose.disconnect();
    return;
  }

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    await db.dropCollection(c.name).catch(() => {});
  }

  const admin = await makeUser({
    name: 'Ravi Kumar',
    email: 'admin@skillswap.dev',
    password: 'admin123',
    role: 'admin',
    bio: 'Platform administrator and community moderator.',
    location: { city: 'Hyderabad', radiusKm: 60 },
  });

  const sanjana = await makeUser({
    name: 'Sanjana',
    email: 'sanjana@example.com',
    bio: 'Frontend engineer who loves teaching JavaScript. Learning guitar in my spare time.',
    location: { city: 'Hyderabad', radiusKm: 60 },
    skills: { offered: ['Web Development', 'JavaScript Tutoring'], sought: ['Guitar Lessons', 'Spanish'] },
    swapsCompleted: 1,
    isVerified: true,
    portfolio: [
      { title: 'Portfolio', type: 'link', url: 'https://github.com/sanjana', description: 'My GitHub' },
    ],
  });

  const lavanya = await makeUser({
    name: 'Lavanya',
    email: 'lavanya@example.com',
    bio: 'Guitarist for 12 years. Trading music lessons for web design skills.',
    location: { city: 'Bengaluru', radiusKm: 60 },
    skills: { offered: ['Guitar Lessons', 'Music Theory'], sought: ['Logo Design', 'Web Design'] },
    swapsCompleted: 1,
    isVerified: true,
  });

  const susmitha = await makeUser({
    name: 'Susmitha',
    email: 'susmitha@example.com',
    bio: 'Certified yoga instructor and wellness coach.',
    location: { city: 'Chennai', radiusKm: 40 },
    skills: { offered: ['Yoga Instruction', 'Meditation'], sought: ['Photography', 'Cooking'] },
    swapsCompleted: 1,
    isVerified: true,
  });

  const sahithi = await makeUser({
    name: 'Sahithi',
    email: 'sahithi@example.com',
    bio: 'Graphic designer + logo specialist. Learning data science.',
    location: { city: 'Pune', radiusKm: 80 },
    skills: { offered: ['Logo Design', 'Graphic Design'], sought: ['Python', 'Data Science'] },
    swapsCompleted: 1,
    verificationPending: true,
  });

  const thanusha = await makeUser({
    name: 'Thanusha',
    email: 'thanusha@example.com',
    bio: 'Spanish tutor, food lover, amateur baker.',
    location: { city: 'Kochi', radiusKm: 50 },
    skills: { offered: ['Spanish Tutoring'], sought: ['Yoga Instruction', 'Baking'] },
  });

  const divya = await makeUser({
    name: 'Divya',
    email: 'divya@example.com',
    bio: 'Python developer. Teaching automation and data analysis.',
    location: { city: 'Mumbai', radiusKm: 80 },
    skills: { offered: ['Python Tutoring', 'Excel'], sought: ['Guitar Lessons', 'Photography'] },
    isVerified: true,
  });

  const varshitha = await makeUser({
    name: 'Varshitha',
    email: 'varshitha@example.com',
    bio: 'Freelance photographer. Teaching composition and photo editing.',
    location: { city: 'Visakhapatnam', radiusKm: 40 },
    skills: { offered: ['Photography', 'Photo Editing'], sought: ['Yoga Instruction', 'Cooking'] },
  });

  const listing = (owner, data) => Listing.create({ owner, ...data, tags: data.tags.map((t) => t.toLowerCase()) });

  const sanjanaJsOffer = await listing(sanjana._id, {
    title: 'JavaScript Tutoring (Beginner to Advanced)',
    description: 'One-on-one JavaScript mentoring covering basics, async patterns, and modern frameworks.',
    type: 'offer',
    category: 'Technology',
    tags: ['javascript', 'web development', 'node', 'tutoring'],
    proficiencyLevel: 'Expert',
    sessionFormat: 'Online',
    durationMinutes: 60,
    frequency: 'Weekly',
  });

  await listing(sanjana._id, {
    title: 'Web Development Basics',
    description: 'Learn HTML, CSS, and JS by building a real project.',
    type: 'offer',
    category: 'Technology',
    tags: ['html', 'css', 'javascript', 'web'],
    proficiencyLevel: 'Intermediate',
    sessionFormat: 'Both',
    durationMinutes: 90,
  });

  await listing(sanjana._id, {
    title: 'Guitar Lessons',
    description: 'Looking for a patient guitar teacher for complete beginner lessons.',
    type: 'seek',
    category: 'Music',
    tags: ['guitar', 'music', 'beginner'],
    proficiencyLevel: 'Beginner',
    sessionFormat: 'Both',
    durationMinutes: 60,
  });

  const lavanyaGuitarOffer = await listing(lavanya._id, {
    title: 'Guitar Lessons for Beginners',
    description: 'Acoustic guitar lessons: chords, strumming, and songs you actually like.',
    type: 'offer',
    category: 'Music',
    tags: ['guitar', 'music', 'beginner'],
    proficiencyLevel: 'Expert',
    sessionFormat: 'Both',
    durationMinutes: 60,
  });

  await listing(lavanya._id, {
    title: 'Logo Design Help',
    description: 'Want a simple logo for my side project. Trading guitar lessons for design.',
    type: 'seek',
    category: 'Arts',
    tags: ['logo', 'design', 'branding'],
    proficiencyLevel: 'Beginner',
    sessionFormat: 'Online',
  });

  await listing(susmitha._id, {
    title: 'Yoga Instruction & Guided Meditation',
    description: 'Morning flow, breathwork, and meditation sessions for all levels.',
    type: 'offer',
    category: 'Fitness',
    tags: ['yoga', 'meditation', 'wellness', 'fitness'],
    proficiencyLevel: 'Expert',
    sessionFormat: 'Both',
    durationMinutes: 45,
  });

  await listing(susmitha._id, {
    title: 'Photography Lessons',
    description: 'Trading yoga classes for photography lessons — want to learn manual mode.',
    type: 'seek',
    category: 'Photography',
    tags: ['photography', 'camera'],
    proficiencyLevel: 'Beginner',
    sessionFormat: 'Online',
  });

  await listing(sahithi._id, {
    title: 'Logo & Brand Identity Design',
    description: 'Custom logo design including color palette and typography guide.',
    type: 'offer',
    category: 'Arts',
    tags: ['logo', 'branding', 'graphic design'],
    proficiencyLevel: 'Expert',
    sessionFormat: 'Online',
    durationMinutes: 90,
  });

  await listing(sahithi._id, {
    title: 'Python for Data Science',
    description: 'Learning Python for data analysis — trading design services.',
    type: 'seek',
    category: 'Technology',
    tags: ['python', 'data science'],
    proficiencyLevel: 'Beginner',
    sessionFormat: 'Online',
  });

  await listing(thanusha._id, {
    title: 'Spanish Conversation Practice',
    description: 'Conversational Spanish practice with a native speaker.',
    type: 'offer',
    category: 'Languages',
    tags: ['spanish', 'language'],
    proficiencyLevel: 'Expert',
    sessionFormat: 'Online',
    durationMinutes: 45,
  });

  await listing(divya._id, {
    title: 'Python & Automation Tutoring',
    description: 'Automate your daily tasks with Python — scripts, APIs, and data pipelines.',
    type: 'offer',
    category: 'Technology',
    tags: ['python', 'automation', 'data'],
    proficiencyLevel: 'Expert',
    sessionFormat: 'Online',
    durationMinutes: 60,
  });

  await listing(divya._id, {
    title: 'Photography Basics',
    description: 'Looking to learn photography basics in exchange for Python help.',
    type: 'seek',
    category: 'Photography',
    tags: ['photography', 'beginner'],
    proficiencyLevel: 'Beginner',
    sessionFormat: 'Both',
  });

  await listing(varshitha._id, {
    title: 'Photography & Photo Editing',
    description: 'Learn composition, lighting, and editing with Adobe Lightroom.',
    type: 'offer',
    category: 'Photography',
    tags: ['photography', 'photo editing', 'lightroom'],
    proficiencyLevel: 'Expert',
    sessionFormat: 'Both',
    durationMinutes: 60,
  });

  await listing(varshitha._id, {
    title: 'Yoga & Meditation',
    description: 'Trading photography lessons for yoga and meditation classes.',
    type: 'seek',
    category: 'Fitness',
    tags: ['yoga', 'meditation'],
    proficiencyLevel: 'Beginner',
    sessionFormat: 'Online',
  });

  // Completed swap: Sanjana (JavaScript) <-> Lavanya (Guitar)
  const completedSwap = await SwapRequest.create({
    fromUser: sanjana._id,
    toUser: lavanya._id,
    offeringListing: sanjanaJsOffer._id,
    requestingListing: lavanyaGuitarOffer._id,
    status: 'completed',
    terms: {
      offeredSkill: 'JavaScript Tutoring',
      requestedSkill: 'Guitar Lessons',
      session: { date: new Date(Date.now() - 14 * 864e5), format: 'Online', durationMinutes: 60, frequency: 'Weekly' },
    },
    completedBy: [sanjana._id, lavanya._id],
    agreedAt: new Date(Date.now() - 21 * 864e5),
    completedAt: new Date(Date.now() - 14 * 864e5),
    summary: 'Offering: JavaScript Tutoring\nRequesting: Guitar Lessons\nScheduled: weekly online sessions',
  });

  const completedSwap2 = await SwapRequest.create({
    fromUser: susmitha._id,
    toUser: sahithi._id,
    status: 'completed',
    terms: {
      offeredSkill: 'Yoga Instruction',
      requestedSkill: 'Logo Design',
      session: { date: new Date(Date.now() - 7 * 864e5), format: 'Online', durationMinutes: 45, frequency: 'Weekly' },
    },
    completedBy: [susmitha._id, sahithi._id],
    agreedAt: new Date(Date.now() - 12 * 864e5),
    completedAt: new Date(Date.now() - 7 * 864e5),
    summary: 'Offering: Yoga Instruction\nRequesting: Logo Design\nFormat: Online',
  });

  // Pending swap request: Susmitha asks Sahithi for logo design
  await SwapRequest.create({
    fromUser: susmitha._id,
    toUser: sahithi._id,
    offeringListing: undefined,
    requestingListing: undefined,
    status: 'pending',
    awaitingConfirmationFrom: sahithi._id,
    terms: {
      offeredSkill: 'Yoga Instruction',
      requestedSkill: 'Logo Design',
      session: { date: new Date(Date.now() + 5 * 864e5), format: 'Online', durationMinutes: 45, frequency: 'One-time' },
    },
    message: 'Hi Sahithi! I loved your logo work. Want to trade yoga classes for a logo?',
  });

  // Confirmed swap: Divya <-> Thanusha (Python for Spanish)
  await SwapRequest.create({
    fromUser: divya._id,
    toUser: thanusha._id,
    status: 'confirmed',
    awaitingConfirmationFrom: undefined,
    agreedAt: new Date(Date.now() - 2 * 864e5),
    terms: {
      offeredSkill: 'Python Tutoring',
      requestedSkill: 'Spanish Tutoring',
      session: { date: new Date(Date.now() + 3 * 864e5), format: 'Online', durationMinutes: 60, frequency: 'Weekly' },
    },
  });

  // Accepted swap: Lavanya <-> Divya (Guitar for Python)
  await SwapRequest.create({
    fromUser: lavanya._id,
    toUser: divya._id,
    status: 'accepted',
    awaitingConfirmationFrom: divya._id,
    agreedAt: new Date(Date.now() - 1 * 864e5),
    terms: {
      offeredSkill: 'Guitar Lessons',
      requestedSkill: 'Python Tutoring',
      session: { date: new Date(Date.now() + 7 * 864e5), format: 'In-Person', durationMinutes: 60, frequency: 'Weekly' },
    },
  });

  // Countered swap: Sanjana <-> Varshitha (JS for Photography)
  await SwapRequest.create({
    fromUser: sanjana._id,
    toUser: varshitha._id,
    status: 'counter_offered',
    awaitingConfirmationFrom: sanjana._id,
    counterOfferBy: varshitha._id,
    terms: {
      offeredSkill: 'JavaScript Tutoring',
      requestedSkill: 'Photography',
      session: { date: new Date(Date.now() + 10 * 864e5), format: 'Online', durationMinutes: 90, frequency: 'Weekly' },
    },
  });

  // Cancelled swap: Thanusha <-> Susmitha (Spanish for Yoga)
  await SwapRequest.create({
    fromUser: thanusha._id,
    toUser: susmitha._id,
    status: 'cancelled',
    terms: {
      offeredSkill: 'Spanish Tutoring',
      requestedSkill: 'Yoga Instruction',
      session: { date: new Date(Date.now() + 20 * 864e5), format: 'Online', durationMinutes: 60, frequency: 'Weekly' },
    },
  });

  // Declined swap: Varshitha <-> Sahithi (Photography for Logo)
  await SwapRequest.create({
    fromUser: varshitha._id,
    toUser: sahithi._id,
    status: 'declined',
    terms: {
      offeredSkill: 'Photography',
      requestedSkill: 'Logo Design',
      session: { date: new Date(Date.now() + 12 * 864e5), format: 'In-Person', durationMinutes: 45, frequency: 'One-time' },
    },
  });

  // Conversation between Sanjana and Lavanya
  const conv = await Conversation.create({
    participants: [sanjana._id, lavanya._id],
    swapRequest: completedSwap._id,
    lastMessage: 'Sounds good — see you Tuesday!',
  });

  await Message.create([
    {
      conversation: conv._id,
      sender: lavanya._id,
      content: 'Hey Sanjana! Ready to swap guitar lessons for JS tutoring?',
      readBy: [lavanya._id, sanjana._id],
    },
    {
      conversation: conv._id,
      sender: sanjana._id,
      content: 'Absolutely. How about weekly sessions, Sunday at 3pm?',
      readBy: [sanjana._id, lavanya._id],
    },
    {
      conversation: conv._id,
      sender: lavanya._id,
      content: 'Perfect. Joining your Zoom room now.',
      videoLink: 'https://meet.example.com/sanjana-guitar',
      type: 'video_link',
      readBy: [lavanya._id, sanjana._id],
    },
    {
      conversation: conv._id,
      sender: sanjana._id,
      content: 'Sounds good — see you Tuesday!',
      readBy: [sanjana._id],
    },
  ]);

  // A few notifications
  await Notification.create([
    { user: lavanya._id, type: 'message', title: 'New message from Sanjana', body: 'Sounds good — see you Tuesday!', read: true },
    { user: sahithi._id, type: 'swap_request', title: 'New swap request', body: 'Susmitha wants to swap Yoga Instruction for Logo Design', read: false },
  ]);

  // A flagged listing + open dispute for admin demo
  const flaggedListing = await listing(divya._id, {
    title: 'Guaranteed Crypto Gains Consulting',
    description: 'Send me money and I promise returns. Zero skills required.',
    type: 'offer',
    category: 'Other',
    tags: ['money', 'get rich'],
    proficiencyLevel: 'Beginner',
    sessionFormat: 'Online',
  });
  flaggedListing.isFlagged = true;
  flaggedListing.isActive = false;
  flaggedListing.flaggedReason = 'Suspected scam / monetary transaction';
  await flaggedListing.save();

  await Dispute.create({
    swapRequest: completedSwap2._id,
    raisedBy: susmitha._id,
    against: sahithi._id,
    reason: 'Other',
    description: 'Sample dispute record for admin dashboard demonstration.',
    status: 'open',
  });

  console.log('✅ Seed complete');
  console.log('   Admin:  admin@skillswap.dev / admin123');
  console.log('   Users:  sanjana@example.com, lavanya@example.com, susmitha@example.com, sahithi@example.com');
  console.log('   Users:  thanusha@example.com, divya@example.com, varshitha@example.com  (password: password123)');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
