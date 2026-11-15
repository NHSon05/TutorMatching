# 🎓 TutorMatching

[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17.6-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.2-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![SignalR](https://img.shields.io/badge/SignalR-Real--time-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/apps/aspnet/signalr)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose_v2-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

A modern web platform connecting learners and parents with qualified tutors. Features multi-criteria search, versioned hire negotiation, real-time messaging and notifications with SignalR, Redis caching, and multi-tier security.

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Demo Accounts](#-demo-accounts)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)
- [Database Operations](#-database-operations)
- [Production & Troubleshooting](#-production--troubleshooting)
- [Documentation](#-documentation)

---

## 🚀 Features

- **Tutor Discovery**: Search and filter tutors by subject, teaching level, mode (`ONLINE`, `OFFLINE`, `HYBRID`), location (province/district), and pricing.
- **Hire & Versioned Negotiation**:
  - Structured request lifecycle: `PENDING` ↔ `NEGOTIATING` → `ACCEPTED` → `COMPLETED` (or terminal `REJECTED` / `CANCELLED`).
  - Multi-round negotiation for price and schedule slots with immutable proposal snapshots and concurrency versioning (`version` token).
- **Real-time Communication**: SignalR hub (`/api/v1/hubs/events`) for instant hire updates, proposals, and in-app notifications.
- **Security & Session Management**:
  - Dual HttpOnly cookies: 5-minute JWT Access Token (`tutormatch_session`) + rotating Opaque Refresh Token (`tutormatch_session_refresh`).
  - Anti-CSRF protection on all state-mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`).
  - Client-side concurrency handling with Web Locks API (`navigator.locks`).
  - Optional Google Sign-In via Google Identity Services ID-token flow.
- **Admin & Quality Control**: Tutor profile review queue with mandatory rejection reasons, subject/level catalog management, and audit logging.

---

## 🏗️ Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                           │
│       App Router • React 19 • TanStack Query v5 • Tailwind CSS 4       │
│                  Web Locks API • Axios (Anti-CSRF)                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS + HttpOnly Cookies + CSRF Header
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       BACKEND (ASP.NET Core 10)                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Api: Controllers, Anti-CSRF, SignalR Hub, OpenAPI 3.1, Auth    │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   ▼                                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Application: Use Cases, Ports, DTOs, Business Invariants       │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   ▼                                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Domain: Entities, Value Objects, State Machine (Zero external) │   │
│   └───────────────────────────────▲────────────────────────────────┘   │
│                                   │                                    │
│   ┌───────────────────────────────┴────────────────────────────────┐   │
│   │ Infrastructure: EF Core 10, Npgsql, Redis, MailKit, Identity   │   │
│   └────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     INFRASTRUCTURE (Docker Compose)                    │
│   • PostgreSQL 17: Schema with snake_case naming & UUID v4 keys        │
│   • Redis 7.2: Session storage, caching, and pub/sub messaging         │
│   • Mailpit: SMTP sandbox with web UI at http://localhost:8025         │
└────────────────────────────────────────────────────────────────────────┘
```

### Technology Breakdown

| Layer                   | Technologies                                                            |
| :---------------------- | :---------------------------------------------------------------------- |
| **Backend**             | .NET 10, ASP.NET Core Web API, Entity Framework Core 10, Npgsql         |
| **Real-time & Caching** | SignalR, Redis 7.2                                                      |
| **Security**            | ASP.NET Core Identity (custom `IUserRoleStore`), JWT, Anti-CSRF         |
| **Frontend**            | Next.js 16.3.6 (App Router), React 19.2.8, TypeScript, Tailwind CSS 4   |
| **Client State**        | TanStack Query v5, Zustand, Axios, Web Locks API                        |
| **Database**            | PostgreSQL 17.6 (strict `snake_case`, UUID primary keys)                |
| **Email Sandbox**       | Mailpit (SMTP on port 1025, Web UI on port 8025)                        |
| **Backend Testing**     | xUnit, Testcontainers (.NET), WebApplicationFactory                     |
| **Frontend Unit Tests** | Vitest 4, jsdom, React Testing Library, user-event, jest-dom            |
| **End-to-End Tests**    | Playwright 1.63 (Chrome channel)                                        |

---

## 📂 Project Structure

```text
TutorMatching/
├── backend/
│   ├── compose.yaml                    # Docker Compose: PostgreSQL, Redis, Mailpit
│   ├── TutorMatching.slnx              # .NET 10 solution file
│   ├── src/
│   │   ├── TutorMatching.Domain/       # Core business logic: Hiring, Tutors, Users, Catalog
│   │   ├── TutorMatching.Application/  # Use cases, ports, DTOs, business invariants
│   │   ├── TutorMatching.Infrastructure/ # EF Core, Redis, Identity, TokenSessions, MailKit
│   │   └── TutorMatching.Api/          # Controllers, SignalR Hubs, CSRF, OpenAPI 3.1
│   ├── tests/                          # Domain unit, Application unit, and API integration tests
│   └── tools/
│       └── TutorMatching.DatabaseMigrator/ # Independent database migration runner
│
├── frontend/
│   ├── src/
│   │   ├── app/                        # Next.js App Router: (public), (tutor), admin
│   │   ├── components/                 # UI primitives, hiring timeline, negotiation modals
│   │   ├── hooks/                      # TanStack Query hooks (auth, session, hire requests)
│   │   └── lib/api/                    # Axios clients with CSRF and auto session-renewal
│   └── tests/                          # Vitest component tests & Playwright E2E tests
│
├── docs/                               # Project maps, database schema, SRS specifications
└── specs/                              # Feature specifications & execution plans (Spec Kit)
```

---

## 💻 Prerequisites

- **.NET SDK 10**: [.NET 10 Download](https://dotnet.microsoft.com/download/dotnet/10.0)
- **Node.js**: v20+ and **npm**
- **Docker & Docker Compose v2**: Docker Desktop or Docker Engine

---

## ⚡ Quick Start

### 1. Start Local Infrastructure (PostgreSQL, Redis, Mailpit)

```bash
# Create local backend configuration
cp backend/.env.example backend/.env

# Generate a secure JWT signing key (32+ random bytes base64)
openssl rand -base64 32
# Paste the generated key into Jwt__SigningKey in backend/.env

# Start Docker Compose services
docker compose --env-file backend/.env -f backend/compose.yaml up -d --wait
```

Ports exposed:

- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Mailpit Web UI**: `http://localhost:8025` (SMTP: `1025`)

### 2. Apply Database Migrations

Run the database migrator tool to apply all schema migrations:

```bash
dotnet run --project backend/tools/TutorMatching.DatabaseMigrator
```

### 3. Run Backend API

```bash
dotnet run --project backend/src/TutorMatching.Api
```

- API Base URL: `http://localhost:5014/api/v1`
- Swagger UI: `http://localhost:5014/swagger`
- OpenAPI Specification: `http://localhost:5014/openapi/v1.json`
- SignalR Hub: `http://localhost:5014/api/v1/hubs/events`

_(In `Development` mode, backend automatically loads `backend/.env` via `DotEnvLoader` and seeds initial demo data)._

### 4. Run Frontend

In a separate terminal:

```bash
cp frontend/.env.example frontend/.env.local
npm --prefix frontend install
npm --prefix frontend run dev
```

Open `http://localhost:3000` in your browser.

---

## 👥 Demo Accounts

The development seeder provides test accounts:

| Role                 | Email                         | Password                    | Details                                |
| :------------------- | :---------------------------- | :-------------------------- | :------------------------------------- |
| **Admin**            | `admin@tutormatching.local`   | Set in `SeedAdmin:Password` | Enabled when `SeedAdmin__Enabled=true` |
| **Tutor** (Approved) | `tutor.hn.hust@tutormatch.vn` | `Password123!`              | Demo profile: Math, CS, Physics        |
| **Learner**          | Register at `/register`       | User defined                | Create a learner account via UI        |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable                               | Default / Example               | Purpose                            |
| :------------------------------------- | :------------------------------ | :--------------------------------- |
| `POSTGRES_DB`                          | `tutormatching`                 | Database name                      |
| `POSTGRES_USER`                        | `tutormatching`                 | Database username                  |
| `POSTGRES_PASSWORD`                    | `replace-with-a-local-password` | Database password                  |
| `POSTGRES_PORT`                        | `5432`                          | Host port for PostgreSQL           |
| `POSTGRES_BIND_ADDRESS`                | `127.0.0.1`                     | Loopback bind address              |
| `ConnectionStrings__DefaultConnection` | `Host=localhost;Port=5432;...`  | EF Core database connection string |
| `ConnectionStrings__Redis`             | `localhost:6379`                | Redis connection string            |
| `Jwt__SigningKey`                      | _(Base64 string)_               | Cryptographic key for signing JWTs |
| `Jwt__Issuer`                          | `tutormatching-api`             | JWT token issuer                   |
| `Jwt__Audience`                        | `tutormatching-client`          | JWT token audience                 |
| `Frontend__Origin`                     | `http://localhost:3000`         | Allowed CORS origin                |
| `Smtp__Host`                           | `localhost`                     | Mailpit SMTP host                  |
| `Smtp__Port`                           | `1025`                          | Mailpit SMTP port                  |
| `Google__ClientId`                     | _(Optional)_                    | Google OAuth Web client ID         |
| `SeedAdmin__Enabled`                   | `true`                          | Seed admin account on startup      |

### Frontend (`frontend/.env.local`)

| Variable                       | Default                        | Purpose                            |
| :----------------------------- | :----------------------------- | :--------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`     | `http://localhost:5014/api/v1` | Backend REST API endpoint          |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | _(Optional)_                   | Matches backend `Google__ClientId` |

---

## 🧪 Testing

### Backend (.NET)

```bash
# Build the complete solution
dotnet build backend/TutorMatching.slnx

# Run unit and integration tests (requires Docker for Testcontainers)
dotnet test backend/TutorMatching.slnx
```

### Frontend (Next.js)

```bash
# Run linter
npm --prefix frontend run lint

# Run production build check
npm --prefix frontend run build
```

### Unit & Component Tests (Vitest)

Vitest runs component, hook, and library tests in a simulated browser (`jsdom`) with React Testing Library.

| Item        | Value                                                                        |
| :---------- | :--------------------------------------------------------------------------- |
| Config      | `frontend/vitest.config.mts` (React plugin, `@/` and `@assets/` aliases)     |
| Setup file  | `frontend/tests/setup.ts` (jest-dom matchers)                                |
| Test files  | `frontend/tests/**/*.test.ts(x)` (`tests/e2e/` is excluded)                  |
| Libraries   | `vitest`, `jsdom`, `@testing-library/react`, `user-event`, `jest-dom`        |

```bash
# Run all tests once
npm --prefix frontend run test

# Watch mode while developing
npm --prefix frontend run test:watch

# Run one file or name pattern
npm --prefix frontend run test -- GoogleSignIn
```

### End-to-End Tests (Playwright)

Playwright drives a real browser through full user journeys such as registration, sessions, tutor discovery, and the hiring flow.

| Item        | Value                                                                           |
| :---------- | :------------------------------------------------------------------------------ |
| Config      | `frontend/playwright.config.ts` (1 worker, Chrome channel)                      |
| Test files  | `frontend/tests/e2e/*.spec.ts`                                                  |
| Base URL    | `PLAYWRIGHT_BASE_URL` (default `http://localhost:3000`)                         |
| Browser     | `PLAYWRIGHT_CHANNEL` (default `chrome`; requires Google Chrome to be installed) |

The config does not start any servers, so start the infrastructure, the API, and the frontend first (see [Quick Start](#-quick-start)). Use a separate test database, because the tests create accounts and data.

```bash
# One-time: install Playwright browsers (needed when not using the installed Chrome)
npx --prefix frontend playwright install chromium

# Run all journeys
npm --prefix frontend run test:e2e

# Run one spec, or debug with the UI runner
npm --prefix frontend run test:e2e -- session.spec.ts
npm --prefix frontend run test:e2e -- --ui

# Use the bundled Chromium instead of Chrome
PLAYWRIGHT_CHANNEL=chromium npm --prefix frontend run test:e2e
```

---

## 💾 Database Operations

### Backup

```bash
docker compose --env-file backend/.env -f backend/compose.yaml exec -T postgres pg_dump \
  -U tutormatching -d tutormatching -Fc > tutormatching-backup.dump
```

### Restore

```bash
docker compose --env-file backend/.env -f backend/compose.yaml exec -T postgres pg_restore \
  -U tutormatching -d tutormatching --clean --if-exists < tutormatching-backup.dump
```

### Reset Local Database

```bash
docker compose --env-file backend/.env -f backend/compose.yaml down -v
docker compose --env-file backend/.env -f backend/compose.yaml up -d --wait
dotnet run --project backend/tools/TutorMatching.DatabaseMigrator
dotnet run --project backend/src/TutorMatching.Api
```

---

## 🛠️ Production & Troubleshooting

- **Cross-Domain `400 Bad Request`**:
  - When hosting frontend on a separate domain (e.g., Vercel):
    1. Set `NEXT_PUBLIC_API_BASE_URL` to your production backend API domain in Vercel settings and redeploy.
    2. Configure `Frontend__Origins__0=https://your-frontend.vercel.app` on the backend.
    3. Ensure authentication and CSRF cookies use `SameSite=None` and `Secure=true` over HTTPS.
- **Remote / Cloud Database Migration (e.g., Supabase)**:
  - Add `--allow-remote` when migrating external databases:
    ```bash
    dotnet run --project backend/tools/TutorMatching.DatabaseMigrator -- --allow-remote
    ```

---

## 📚 Documentation

- [docs/PROJECT-MAP.md](docs/PROJECT-MAP.md): Full architecture, REST endpoint catalog, security flow, and component tree.
- [docs/DatabaseSchema.md](docs/DatabaseSchema.md): Database schema entities and relational diagram.
- [docs/Final_SRS_TutorMatch_PBL3.pdf](docs/Final_SRS_TutorMatch_PBL3.pdf): Software Requirements Specification (SRS).
- [frontend/docs/design-system/](frontend/docs/design-system/): UI tokens, typography, and reusable components.
