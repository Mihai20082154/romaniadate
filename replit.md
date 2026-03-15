# RomaniaDate - Dating App

## Overview

A full-featured Tinder-like dating web application specifically for Romania. Features swipe/match system, real-time chat, diamonds economy, referral system, VIP/premium features, and age category separation.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion (artifacts/dating-app)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: JWT (jsonwebtoken + bcryptjs)
- **Real-time**: WebSocket (ws library)
- **Validation**: Zod (zod/v4), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server + WebSocket
│   └── dating-app/         # React + Vite frontend (previewPath: /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
└── ...
```

## Database Tables

- `users` - User accounts with all profile data, diamonds, VIP, levels, referral codes
- `swipes` - Swipe actions (like/dislike/superlike)
- `matches` - Mutual likes that become matches
- `messages` - Chat messages between matched users
- `diamond_transactions` - Earn/spend history for diamond economy
- `notifications` - In-app notifications
- `reports` - User reports for moderation
- `blocks` - User block relationships

## Key Features

1. **Auth**: JWT-based. Register with age validation (14+ min), age categories (teen 14-17, adult 18+)
2. **Swipe system**: Like (10 diamonds), Dislike (free), Superlike (limited per day), Rewind (30 diamonds)
3. **Match system**: Mutual likes create matches with notifications and diamond rewards
4. **Real-time chat**: WebSocket at /ws with typing indicators and read receipts
5. **Diamond economy**: Starting 100, earn via referrals/daily login/matches, spend on likes/rewinds/boosts/VIP
6. **Referral system**: Every 10 referrals = 500 diamonds
7. **VIP subscription**: Monthly (500 💎), Quarterly (1200 💎), Yearly (3000 💎)
8. **Leveling system**: XP earned from swipes/matches/messages, ranks from Beginner to Legend
9. **Safety**: Report/block users, admin moderation panel, private accounts
10. **Profile boost**: 30-minute visibility boost for 50 diamonds

## API Routes

All under `/api`:
- `POST /auth/register` - Register (14+ age, city from Romanian cities list)
- `POST /auth/login` - Login
- `GET /auth/me` - Current user
- `GET /users/discover` - Profiles to swipe (filtered by age category, gender pref, city)
- `POST /swipe/like|dislike|superlike|rewind|boost` - Swipe actions
- `GET /matches` - User's matches
- `GET/POST /chat/:matchId/messages` - Chat
- `GET /diamonds/balance|history` - Diamond info
- `POST /diamonds/daily-login` - Claim daily reward
- `GET /referral/info` - Referral stats
- `GET /notifications` - Notifications
- `GET /users/leaderboard|stats|who-liked-me` - Stats & leaderboard
- `PUT /users/profile|settings` - Profile/settings update
- `POST /users/vip` - Activate VIP subscription
- `GET/POST /admin/reports` - Admin moderation

## WebSocket

Connect to `/ws?token=<JWT>` for real-time events:
- `new_message` - New chat message from matched user
- `typing` - Typing indicator
- `connected` - Connection confirmed

## Demo Users

Pre-seeded demo accounts (password: `demo1234`):
- `ana@demo.ro` - Girl, București, 27 years, verified
- `mihai@demo.ro` - Boy, Cluj-Napoca, 30 years
- `elena@demo.ro` - Girl, Timișoara, 25 years
- `andrei@demo.ro` - Boy, Iași, 28 years (boosted)
- `ioana@demo.ro` - Girl, București, 26 years
- `cristian@demo.ro` - Boy, Constanța, 32 years
- `maria@demo.ro` - Girl, Brașov, 24 years, verified

## Development

- `pnpm --filter @workspace/api-server run dev` - Start API server
- `pnpm --filter @workspace/dating-app run dev` - Start frontend
- `pnpm --filter @workspace/db run push` - Push schema changes
- `pnpm --filter @workspace/api-spec run codegen` - Regenerate API client
