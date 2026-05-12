# BilliardHUB Implementation Plan

## Quick Local Run

Mobile iOS Simulator:

```bash
cd /Users/akhanbakhitov/Documents/astanafbs
npm install
npm run dev-client -- --localhost -c
```

If the development build is not installed yet:

```bash
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios --device "iPhone 16 Pro"
```

In `BilliardHUB Development Build`, open:

```text
http://localhost:8081
```

Backend, DB, and storage:

```bash
cp .env.example .env
npm run infra:up
npm run api:dev
```

Admin panel:

```bash
npm run admin:dev
```

Local URLs:

- Mobile Metro: `http://localhost:8081`
- API: `http://localhost:3000`
- Admin panel: `http://localhost:3001`
- Adminer: `http://localhost:8080`
- MinIO Console: `http://localhost:9001`

Current factual state:

- iOS development build launches as `BilliardHUB`.
- Main mobile UI opens on the Home tab with Kazakhstan demo data.
- Expo Router tabs are active: Главная, Турниры, Рейтинг, Дуэли, Профиль.
- Backend API and admin panel are implemented as separate apps, but should be started separately.
- Docker Compose provides local PostgreSQL, MinIO, and Adminer.
- Google Auth and push infrastructure are wired in code, but real production behavior requires real Firebase/EAS credentials.

## 0. Product Scope

BilliardHUB is a sports digital platform for billiards players, organizers, clubs, and viewers in Kazakhstan.

Primary platforms:
- iOS
- Android

Languages:
- Russian
- Kazakh

Core product surfaces:
- Mobile app: React Native + Expo
- Backend API: Node.js
- Admin panel: Next.js
- Database: PostgreSQL
- Local object storage: MinIO in Docker
- Production auth/push/storage: Firebase + native mobile credentials

## 1. Current Baseline

Already in the repo:
- Expo + React Native + TypeScript
- MVP mobile shell
- Expo Router navigation
- Bottom tab UI: Home, Tournaments, Rating, Duels, Profile
- Stack route tree from the full plan: auth, tabs, tournament register/players/bracket/match, player, club, news, stream, listing, shop, settings, modals
- Tamagui UI system and shared components: Screen, Card, Badge, InfoGrid, StatRow, Buttons
- Entity TypeScript contracts: tournament, player, duel, news
- Fastify backend API in `apps/api`
- Next.js admin panel in `apps/admin`
- Native Google Sign-In dependencies
- Firebase Auth dependency
- Expo push notifications hook
- EAS build config
- Docker services for PostgreSQL, MinIO, and Adminer

## 2. Local Infrastructure

Local Docker services:
- PostgreSQL on `localhost:5433`
- MinIO S3 API on `localhost:9000`
- MinIO Console on `localhost:9001`
- Adminer on `localhost:8080`

Local storage approach:
- Use MinIO locally for images, banners, avatars, product photos, and documents.
- Keep storage API S3-compatible so production can move to Firebase Storage, S3, or another object store without rewriting business logic.

Initial database domains:
- users
- player_profiles
- clubs
- tournaments
- tournament_registrations
- matches
- news_posts
- duels
- streams
- listings
- products
- orders
- push_tokens

## 3. Phase 1: Mobile MVP

Goal: a usable first mobile version with real auth and API-backed data.

Mobile tasks:
- Replace in-file tab state with `expo-router`.
- Create route groups:
  - `app/(auth)`
  - `app/(tabs)`
  - `app/tournaments/[id]`
  - `app/profile/[id]`
- Keep bottom tabs:
  - Home
  - Tournaments
  - Rating
  - Duels
  - Profile
- Add splash screen with FBS logo.
- Add design tokens:
  - colors
  - spacing
  - typography
  - card styles
  - buttons
- Add reusable components:
  - `Screen`
  - `Card`
  - `Button`
  - `Avatar`
  - `TournamentCard`
  - `PlayerRatingRow`
  - `NewsCard`

Auth tasks:
- Finish Firebase native config:
  - `GoogleService-Info.plist`
  - `google-services.json`
  - Google Web Client ID
  - Google iOS Client ID
- Store authenticated user in backend.
- Sync Firebase UID to local `users.firebase_uid`.
- Add logout flow.

Home MVP:
- News list from API.
- Banner list from API.
- Quick buttons:
  - Tournaments
  - Clubs
  - Duels
  - Shop
  - Listings
  - Streams

Tournament MVP:
- Tournament list.
- Active/archive filters.
- Tournament detail screen.
- Tournament registration.
- Registered players list.
- Basic results view.
- Basic bracket placeholder.

Profile MVP:
- Name.
- Photo.
- City.
- Rating.
- Club.
- Match history.
- Tournament registrations.

Rating MVP:
- Overall rating list.
- Player detail screen.
- Local rating source first.
- Reserve integration boundary for bill4you.ru.

Push MVP:
- Request permission.
- Fetch Expo Push Token.
- Send token to backend.
- Store token in `push_tokens`.
- Send test notification from backend/admin.

## 4. Phase 2: Backend API

Recommended stack:
- Node.js
- TypeScript
- Fastify or NestJS
- PostgreSQL
- Prisma or Drizzle
- S3-compatible storage client for MinIO

Initial modules:
- Auth
- Users
- Profiles
- News
- Tournaments
- Registrations
- Ratings
- Push tokens
- Files/storage

Implemented API baseline:
- `GET /health`
- `POST /auth/firebase`
- `GET /me`
- `PATCH /me`
- `GET /news`
- `GET /tournaments`
- `GET /tournaments/:id`
- `POST /tournaments/:id/register`
- `GET /tournaments/:id/players`
- `GET /ratings`
- `GET /players/:id`
- `GET /duels`
- `POST /duels`
- `POST /push-tokens`
- `POST /files/presign-upload`
- `GET /admin/summary`
- `GET /clubs`
- `GET /streams`
- `GET /listings`
- `GET /products`
- Admin CRUD: users, tournaments, news, clubs, listings, products, push tokens, push campaigns

Core API endpoints:
- `GET /health`
- `POST /auth/firebase`
- `GET /me`
- `PATCH /me`
- `GET /news`
- `GET /tournaments`
- `GET /tournaments/:id`
- `POST /tournaments/:id/register`
- `GET /ratings`
- `GET /players/:id`
- `POST /push-tokens`
- `POST /files/presign-upload`

Auth model:
- Mobile sends Firebase ID token.
- Backend verifies token through Firebase Admin SDK.
- Backend creates or updates local user.
- Backend uses local user id for app data.

Storage model:
- Backend creates presigned upload URLs.
- Mobile uploads images directly to MinIO/S3.
- Backend stores object keys in PostgreSQL.

## 5. Phase 3: Admin Panel

Admin app:
- Separate Next.js app in `apps/admin` or `admin`.
- Reuse backend API.
- Admin auth can start with Firebase Google Auth plus admin role check.

Admin screens:
- Dashboard
- Tournaments
- Tournament registrations
- Matches/results
- News
- Users
- Clubs
- Listings
- Shop products
- Banners
- Push campaigns

Admin MVP:
- Create/edit tournaments.
- Publish news.
- Manage users.
- Send test push.
- Upload banners/images.

## 6. Phase 4: Second Queue

Clubs:
- Club list.
- Club detail.
- Club tournaments.
- Club contact and map info.

Duels:
- Challenge player.
- Accept/decline challenge.
- Match result submission.
- Separate duel rating.

Streams:
- YouTube live list.
- YouTube player screen.
- Admin-managed stream links.

Listings:
- Inventory sale posts.
- Services posts.
- Moderation in admin.

Shop:
- Product catalog.
- Product detail.
- Order draft.
- Admin-managed products.

## 7. Phase 5: Integrations

bill4you.ru:
- Confirm API availability.
- Define rating sync contract.
- Add scheduled rating import.
- Keep local rating as fallback.

Firebase:
- Auth: Google Sign-In.
- Push credentials.
- Analytics.
- Optional production storage if we choose Firebase Storage instead of S3.

YouTube:
- Store video/live URLs.
- Optional YouTube Data API later.

## 8. Release Track

Development:
- Build dev client with EAS.
- Test on real iOS and Android devices.

Internal testing:
- TestFlight internal group.
- Google Play internal testing.

Production:
- App Store submission.
- Google Play production track.
- Backend hosted separately.
- PostgreSQL managed database.
- Object storage managed bucket.

## 9. Immediate Next Steps

1. Fill `.env` from `.env.example`.
2. Run Docker infrastructure.
3. Add backend scaffold with DB connection.
4. Add `expo-router` and split `App.tsx` into screens.
5. Wire mobile app to backend API.
6. Persist push tokens in backend.
7. Create first admin panel scaffold.
