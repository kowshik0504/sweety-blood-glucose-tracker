# 🩸 Sweety – Blood Glucose Tracker

A full-stack web application for diabetes patients to track blood glucose readings and view daily/monthly reports. Built with **Node.js + Express**, **PostgreSQL**, and **React**.

![Node.js](https://img.shields.io/badge/Node.js-20-green) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue) ![React](https://img.shields.io/badge/React-18-cyan) ![Docker](https://img.shields.io/badge/Docker-Compose-blue)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start with Docker](#-quick-start-with-docker)
- [Manual Setup](#-manual-setup)
- [Database Setup](#-database-setup)
- [Running the App](#-running-the-app)
- [Seed Data](#-seed-data)
- [Running Tests](#-running-tests)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Notes & Assumptions](#-notes--assumptions)

---

## ✨ Features

### Required
- **User Authentication** – Sign up and log in with hashed passwords (bcrypt + JWT)
- **CRUD Readings** – Add, view, edit, and delete blood glucose readings
- **4 Daily Slots** – Morning (fasting), After breakfast, After lunch, After dinner
- **Full Validation** – Value range (40–600 mg/dl), one reading per slot per day, max 4/day, no future dates
- **3 Report Types** – Daily, Month-to-date, and Monthly reports with highest/lowest/average/count

### Bonus
- ✅ **Pagination** on GET /readings (`?page=1&limit=20`)
- ✅ **Charts** – Recharts line chart showing glucose trends over the month
- ✅ **Docker** – `docker-compose.yml` that starts PostgreSQL, API, and client
- ✅ **Frontend Tests** – React Testing Library tests for the ReadingForm component

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Recharts, Axios |
| Backend | Node.js 20, Express 4, express-validator |
| Database | PostgreSQL 16 |
| Auth | bcrypt, JSON Web Tokens (JWT) |
| Testing | Jest + Supertest (backend), Vitest + React Testing Library (frontend) |
| DevOps | Docker, Docker Compose, Nginx |

---

## 🐳 Quick Start with Docker

The fastest way to get Sweety running:

```bash
# 1. Clone the repository
git clone https://github.com/kowshik0504/sweety-blood-glucose-tracker.git
cd sweety-blood-glucose-tracker

# 2. Start all services (PostgreSQL + API + Client)
docker-compose up --build

# 3. (Optional) Seed the database with demo data
docker-compose exec server node src/db/seed.js
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000
- **Database**: localhost:5432

### Demo Account (after seeding)
- **Email**: `demo@sweety.com`
- **Password**: `Demo@123`

---

## 🔧 Manual Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### 1. Clone and install dependencies

```bash
git clone https://github.com/kowshik0504/sweety-blood-glucose-tracker.git
cd sweety-blood-glucose-tracker

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment variables

```bash
# From the project root
cp .env.example .env

# Or create server/.env manually:
PORT=5000
DATABASE_URL=postgresql://sweety_user:sweety_pass@localhost:5432/sweety_db
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

## 🗄 Database Setup

### Option A: Using Docker (recommended)

```bash
# Start only PostgreSQL
docker-compose up db -d

# Initialize tables
cd server
npm run db:init
```

### Option B: Manual PostgreSQL setup

```bash
# 1. Create database and user
psql -U postgres
CREATE USER sweety_user WITH PASSWORD 'sweety_pass';
CREATE DATABASE sweety_db OWNER sweety_user;
\q

# 2. Initialize tables
cd server
npm run db:init
```

The init script creates two tables:
- `users` – id, name, email, password (hashed), created_at
- `readings` – id, user_id, date, slot, value, created_at, updated_at

---

## 🚀 Running the App

### Development mode

```bash
# Terminal 1: Start the API server
cd server
npm run dev
# Server runs on http://localhost:5000

# Terminal 2: Start the React client
cd client
npm run dev
# Client runs on http://localhost:3000
```

### Production mode (Docker)

```bash
docker-compose up --build -d
```

---

## 🌱 Seed Data

Create a demo user with 30 days of sample readings:

```bash
cd server
npm run seed
```

This creates:
- **Demo user**: `demo@sweety.com` / `Demo@123`
- **~90 sample readings** across the past 30 days with realistic glucose values

---

## 🧪 Running Tests

### Backend tests (Jest + Supertest)

```bash
cd server
npm test
```

### Frontend tests (Vitest + React Testing Library)

```bash
cd client
npm test
```

---

## 📡 API Documentation

### Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{ name, email, password }` | Register a new user |
| POST | `/api/auth/login` | `{ email, password }` | Login and get JWT token |
| GET | `/api/auth/me` | – | Get current user profile |

### Readings (all require JWT)

| Method | Endpoint | Body/Params | Description |
|--------|----------|-------------|-------------|
| GET | `/api/readings` | `?page=1&limit=20&date=YYYY-MM-DD` | List readings (paginated) |
| POST | `/api/readings` | `{ date, slot, value }` | Add a new reading |
| PUT | `/api/readings/:id` | `{ date, slot, value }` | Update a reading |
| DELETE | `/api/readings/:id` | – | Delete a reading |

**Slot values**: `morning_fasting`, `after_breakfast`, `after_lunch`, `after_dinner`

### Reports (all require JWT)

| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/api/reports/daily` | `?date=YYYY-MM-DD` | Daily report for the selected date |
| GET | `/api/reports/month-to-date` | `?date=YYYY-MM-DD` | Report from 1st of month to selected date |
| GET | `/api/reports/monthly` | `?date=YYYY-MM-DD` | Report for the entire previous month |

### Validation Rules

| Rule | Error Message |
|------|---------------|
| Value is required | "Please enter a glucose value." |
| Value must be 40–600 integer | "Value must be between 40 and 600 mg/dl." |
| One reading per slot per day | "You already have an {slot} reading for this date." |
| Max 4 readings per day | "You can add only 4 readings per day." |
| No future dates | "Date cannot be in the future." |

---

## 📸 Screenshots

> _Screenshots will be added after the app is running._

---

## 📝 Notes & Assumptions

### Assumptions
1. **Date handling**: All dates are treated in the server's local timezone. In a production app, I would use UTC and handle timezone conversion on the client.
2. **Authentication**: JWT tokens are stored in localStorage for simplicity. In production, httpOnly cookies would be more secure.
3. **Password requirements**: Minimum 6 characters. In production, I would enforce stronger requirements (uppercase, number, special character).
4. **Slot values**: Stored as snake_case strings (`morning_fasting`, `after_breakfast`, etc.) and displayed with human-readable labels in the UI.
5. **Report date parameter**: If no date is provided, defaults to today.
6. **Average rounding**: All averages are rounded to 1 decimal place using PostgreSQL's `ROUND()` function.

### What I'd improve with more time
1. **Refresh tokens** – JWT refresh token rotation for better security
2. **Rate limiting** – Protect auth endpoints from brute force attacks
3. **Input sanitization** – Add XSS protection with helmet and DOMPurify
4. **Timezone support** – Proper timezone-aware date handling with dayjs
5. **PWA features** – Service worker, offline support, and push notifications for reading reminders
6. **Export data** – Allow users to export readings as CSV/PDF
7. **Dark mode** – Theme toggle for accessibility
8. **Accessibility** – Full ARIA labels, keyboard navigation, screen reader support
9. **CI/CD** – GitHub Actions pipeline for automated testing and deployment
10. **Redis caching** – Cache report results, invalidate on reading changes
11. **Email notifications** – Daily reminder to log readings

### Design decisions
- **Raw SQL with `pg`** instead of an ORM (Sequelize/Prisma) – keeps the codebase simple, shows SQL understanding, and avoids unnecessary abstraction for a small schema.
- **Database-level constraints** (UNIQUE, CHECK) as safety nets behind application-level validation – defense in depth.
- **Recharts** for charting – lightweight, React-native, and well-documented.
- **Vite** instead of Create React App – faster builds, better DX, and actively maintained.
