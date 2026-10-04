# Community Skill Swap Platform

A peer-to-peer skill barter network built with the **MERN stack** (MongoDB, Express, React, Node.js). Users exchange skills and services with zero monetary transactions.

## Features (per SRS)

- **User Profiles & Skill Listings** - registration, bio/location/photo/availability, offering + seeking listings, portfolio showcase, availability calendar
- **Discovery & Matching** - full-text search, category browse, AI-style match recommendations, location filter, tag/proficiency/format filters, saved listings
- **Swap Request & Agreement** - swap proposals, counter-offers, dual confirmation, swap summary
- **Communication** - real-time chat, video link sharing, in-app + email notifications
- **Reputation & Community** - post-swap reviews, reputation scores, badges, community feed, dispute resolution
- **Admin & Platform** - admin dashboard, content moderation, swap analytics, user verification

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite, React Router, Axios, Socket.IO client |
| Backend | Node.js, Express, Socket.IO, JWT auth, Multer (uploads) |
| Database | MongoDB + Mongoose |
| Emails | Nodemailer (with console/log fallback for local dev) |

## Prerequisites

- Node.js 18+
- MongoDB running locally (`mongodb://localhost:27017/skillswap`) **or** a MongoDB Atlas connection string

## Getting Started

```bash
# 1. Install dependencies
npm run install-all

# 2. Configure environment
# server/.env  (copy from server/.env.example)
#   PORT=5000
#   MONGO_URI=mongodb://localhost:27017/skillswap
#   JWT_SECRET=change-me
#   CLIENT_URL=http://localhost:5173

# 3. Seed demo data (optional)
npm run seed

# 4. Run both server and client
npm run dev
```

- API server: http://localhost:5000
- Web app: http://localhost:5173

## Demo Accounts (after seeding)

| Role | Name | Email | Password |
|---|---|---|---|
| Admin | Ravi Kumar | admin@skillswap.dev | admin123 |
| User | Sanjana | sanjana@example.com | password123 |
| User | Lavanya | lavanya@example.com | password123 |
| User | Susmitha | susmitha@example.com | password123 |
| User | Sahithi | sahithi@example.com | password123 |
| User | Thanusha | thanusha@example.com | password123 |
| User | Divya | divya@example.com | password123 |
| User | Varshitha | varshitha@example.com | password123 |

## Project Structure

```
├── server/               # Express API + Socket.IO
│   ├── models/           # Mongoose schemas
│   ├── controllers/      # Route handlers
│   ├── routes/           # API routes
│   ├── middleware/       # auth, error handling, uploads
│   ├── services/         # matching engine, notifications
│   └── seed/             # demo data
└── client/               # React SPA (Vite)
    └── src/
        ├── pages/        # route pages
        ├── components/   # shared UI
        ├── context/      # auth + socket contexts
        └── api/          # axios client
```
