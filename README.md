# Canvas Flow — Backend

**AI-Powered Media Editing Platform** — NestJS backend for a full-featured, scalable media processing ecosystem.

> **Frontend repo**: `canvas-flow-frontend` (Angular 20)

---

## Overview

Canvas Flow is a Canva-like platform that combines deterministic media processing via **Cloudinary** with generative AI via **Leonardo AI**. It supports secure uploads, asset management, advanced editing, document scanning, AI-powered generation, collaborative workspaces, credit-based billing, and extensible provider integrations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS (TypeScript) |
| Primary DB | PostgreSQL (TypeORM) |
| Document DB | MongoDB (Mongoose) — legacy/aux |
| Cache / Queues | Redis + BullMQ |
| Media Engine | Cloudinary |
| Generative AI | Leonardo AI |
| Auth | JWT (access + refresh tokens) |
| SMS OTP | Twilio Verify |
| Error Tracking | Sentry |
| API Docs | Swagger / OpenAPI |
| Backup Storage | AWS S3 (optional) |

---

## Quick Start

### Prerequisites

- Node.js v22.x
- Yarn
- PostgreSQL 16
- Redis
- Docker (recommended)

### Using Docker (Recommended)

```bash
docker-compose up -d
```

API available at `http://localhost:3000` · Swagger at `http://localhost:3000/api`

### Local Development

```bash
yarn install
export DEPLOY_ENV=local
yarn start:dev
```

---

## Commands

```bash
# Development
yarn start:dev              # Hot reload
yarn start:prod             # Production

# Database
yarn migration:generate     # Generate migration after entity changes
yarn db:migrate             # Run pending migrations
yarn migration:revert       # Rollback last migration

# Testing (minimum 80% coverage required)
yarn test                   # Unit tests
yarn test:cov               # Coverage report
yarn test:e2e               # End-to-end tests

# Code Quality
yarn lint:fix               # ESLint auto-fix
yarn format                 # Prettier
```

---

## Project Structure

```
src/
├── AppModule.ts
├── main.ts
├── instrument.ts              # Sentry setup
├── config/                    # Type-safe environment variables
├── core/                      # Health checks, system info
├── database/                  # DatabaseModule (TypeORM / Mongoose)
├── shared/                    # Decorators, DTOs, errors, interfaces
├── interceptors/              # Global exception filter, error mapping
│
├── auth/                      # JWT auth, sign-up, sign-in, password recovery
├── users/                     # User CRUD, profiles
├── sms-validation/            # SMS OTP (Twilio)
│
├── organizations/             # Multi-tenant org management
├── workspaces/                # Org workspaces
├── projects/                  # Media projects
├── assets/                    # Asset management + versioning
├── folders/                   # Asset folder organization
│
├── cloudinary/                # Cloudinary integration (upload, transform, deliver)
├── leonardo/                  # Leonardo AI integration (generative workflows)
│
├── transformations/           # Transformation pipeline definitions
├── editor-sessions/           # Real-time editor session state
├── layers/                    # Layer composition engine
├── templates/                 # Template library (social, business)
│
├── ocr-pipelines/             # OCR extraction, document scanning
├── ai-pipelines/              # AI orchestration (enhancement, removal, generation)
├── export-pipelines/          # Export workflows (PNG, JPG, WebP, PDF, ZIP)
│
├── jobs/                      # BullMQ job definitions and processors
├── webhooks/                  # Cloudinary + Leonardo webhook listeners
├── notifications/             # In-app + push notifications
│
├── billing/                   # Payment processing
├── subscriptions/             # Subscription plan management
├── credits/                   # Credit-based AI usage metering
│
├── analytics/                 # Usage analytics
├── activity-logs/             # Audit logs
└── admin/                     # Admin dashboard tools
```

---

## Documentation

| Document | Description |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, data flow, deployment |
| [docs/BACKEND_MODULES.md](docs/BACKEND_MODULES.md) | All NestJS modules and their responsibilities |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Angular 20 frontend architecture and components |
| [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) | Cloudinary and Leonardo AI integration details |
| [docs/FEATURES.md](docs/FEATURES.md) | Feature list and progressive rollout roadmap |
| [docs/DATABASE.md](docs/DATABASE.md) | Database schema, caching strategy, queue setup |
| [docs/API.md](docs/API.md) | API design, authentication, rate limiting |

---

## Environment Variables

All env files live in `environment/`. Set `DEPLOY_ENV` to load the appropriate file.

| Variable | Description |
|---|---|
| `DEPLOY_ENV` | `local` · `development` · `sandbox` · `production` |
| `DATABASE_URL` | PostgreSQL connection URI |
| `MONGODB` | MongoDB connection URI (aux) |
| `REDIS_URL` | Redis connection URI |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRY` | Access token expiry (e.g. `15m`) |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry (e.g. `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `LEONARDO_API_KEY` | Leonardo AI API key |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_VERIFY_SID` | Twilio Verify service SID |
| `AWS_S3_BUCKET` | S3 bucket name (optional backup storage) |
| `AWS_ACCESS_KEY_ID` | AWS access key (optional) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (optional) |
| `SENTRY_DSN` | Sentry DSN for error tracking |
| `SALT_ROUND` | bcrypt salt rounds |

---

## Adding a New Module

Follow the established pattern. Each module folder contains:

```
src/[module-name]/
├── [Module]Module.ts
├── controller/
│   ├── [Module]Controller.ts
│   └── [Module]Controller.spec.ts
├── service/
│   ├── [Module]Service.ts
│   └── [Module]Service.spec.ts
├── entity/
│   └── [Entity].ts              # TypeORM entity (@PrimaryGeneratedColumn('uuid'))
├── dto/
│   ├── Create[Entity]PayloadDto.ts
│   ├── Update[Entity]PayloadDto.ts
│   ├── Filter[Entity]QueryDto.ts
│   └── [Entity]Dto.ts
└── interface/
    └── [Entity].ts
```

**Conventions:**
- UUID primary keys on all entities
- snake_case column names mapped to camelCase properties
- All DTOs validated with `class-validator`
- All endpoints documented with Swagger decorators
- Every file starts with 2-line `// ABOUTME:` comment

---

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Leonardo AI Docs](https://docs.leonardo.ai)
- [BullMQ Docs](https://docs.bullmq.io)
- [TypeORM Docs](https://typeorm.io)
