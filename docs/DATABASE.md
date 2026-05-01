# Database — Canvas Flow

---

## Overview

| Storage | Technology | Purpose |
|---|---|---|
| Primary | PostgreSQL 16 (TypeORM) | Relational data, all business entities |
| Aux / Legacy | MongoDB (Mongoose) | SMS validation, legacy auth data |
| Cache | Redis 7 | Sessions, rate limits, job state, temp data |
| Queue | Redis (BullMQ) | Async job queue backing store |
| Media | Cloudinary | All binary asset storage and delivery |
| Archive | AWS S3 (optional) | Long-term backup of exports and raw uploads |

---

## PostgreSQL — Entity Schema

### `users`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
email           VARCHAR(255) UNIQUE NOT NULL
phone           VARCHAR(20) UNIQUE
password_hash   VARCHAR(255) NOT NULL
first_name      VARCHAR(100)
last_name       VARCHAR(100)
avatar_url      VARCHAR(500)
is_email_verified BOOLEAN DEFAULT false
is_phone_verified BOOLEAN DEFAULT false
role            VARCHAR(20) NOT NULL DEFAULT 'user'  -- 'user' | 'admin'
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
version         INTEGER DEFAULT 1
```

### `refresh_tokens`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
token_hash      VARCHAR(255) NOT NULL
expires_at      TIMESTAMPTZ NOT NULL
is_revoked      BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
```
Index: `(user_id, is_revoked)`

### `organizations`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(255) NOT NULL
slug            VARCHAR(100) UNIQUE NOT NULL
logo_url        VARCHAR(500)
owner_id        UUID NOT NULL REFERENCES users(id)
plan_id         UUID REFERENCES subscription_plans(id)
settings        JSONB DEFAULT '{}'
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
version         INTEGER DEFAULT 1
```

### `organization_members`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
role            VARCHAR(20) NOT NULL DEFAULT 'editor'  -- owner|admin|editor|viewer
invited_by      UUID REFERENCES users(id)
joined_at       TIMESTAMPTZ DEFAULT now()
UNIQUE(organization_id, user_id)
```

### `workspaces`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(255) NOT NULL
organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
created_by      UUID REFERENCES users(id)
settings        JSONB DEFAULT '{}'
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
version         INTEGER DEFAULT 1
```

### `workspace_members`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
role            VARCHAR(20) NOT NULL DEFAULT 'editor'
UNIQUE(workspace_id, user_id)
```

### `projects`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(255) NOT NULL
workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE
organization_id UUID NOT NULL REFERENCES organizations(id)
canvas_config   JSONB NOT NULL DEFAULT '{}'   -- width, height, background, dpi
thumbnail_url   VARCHAR(500)
status          VARCHAR(20) DEFAULT 'active'  -- active|archived|deleted
tags            TEXT[]
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
version         INTEGER DEFAULT 1
```
Index: `(workspace_id, status)`, `(organization_id, status)`

### `project_versions`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
version_number  INTEGER NOT NULL
snapshot        JSONB NOT NULL    -- full project state snapshot
label           VARCHAR(255)      -- optional user-defined version name
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMPTZ DEFAULT now()
UNIQUE(project_id, version_number)
```

### `folders`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(255) NOT NULL
parent_id       UUID REFERENCES folders(id)   -- NULL = root
workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE
organization_id UUID NOT NULL REFERENCES organizations(id)
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

### `assets`
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
name                VARCHAR(255) NOT NULL
cloudinary_public_id VARCHAR(500) NOT NULL
cloudinary_url      VARCHAR(500) NOT NULL
format              VARCHAR(20)    -- jpg|png|webp|mp4|pdf|...
width               INTEGER
height              INTEGER
size_bytes          BIGINT
type                VARCHAR(20) NOT NULL  -- image|video|document|audio
folder_id           UUID REFERENCES folders(id)
project_id          UUID REFERENCES projects(id)
workspace_id        UUID NOT NULL REFERENCES workspaces(id)
organization_id     UUID NOT NULL REFERENCES organizations(id)
tags                TEXT[]
metadata            JSONB DEFAULT '{}'   -- exif, ocr text, detected objects, etc.
is_archived         BOOLEAN DEFAULT false
created_by          UUID REFERENCES users(id)
created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
version             INTEGER DEFAULT 1
```
Index: `(workspace_id, type, is_archived)`, `(organization_id, created_at DESC)`

### `asset_versions`
```sql
id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()
asset_id             UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE
version_number       INTEGER NOT NULL
cloudinary_public_id VARCHAR(500) NOT NULL
cloudinary_url       VARCHAR(500) NOT NULL
transformations      JSONB DEFAULT '[]'
metadata             JSONB DEFAULT '{}'
created_by           UUID REFERENCES users(id)
created_at           TIMESTAMPTZ DEFAULT now()
UNIQUE(asset_id, version_number)
```

### `layers`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
session_id      UUID REFERENCES editor_sessions(id)
type            VARCHAR(20) NOT NULL  -- image|video|text|shape|sticker|logo|mask|group
order_index     INTEGER NOT NULL
is_visible      BOOLEAN DEFAULT true
is_locked       BOOLEAN DEFAULT false
transform       JSONB NOT NULL DEFAULT '{}'   -- x, y, width, height, rotation, scaleX, scaleY
style           JSONB DEFAULT '{}'            -- fill, stroke, opacity, borderRadius
blend_mode      VARCHAR(30) DEFAULT 'normal'
opacity         DECIMAL(4,3) DEFAULT 1.0
effects         JSONB DEFAULT '[]'            -- shadows, glows, filters
asset_id        UUID REFERENCES assets(id)
content         JSONB DEFAULT '{}'            -- text content, shape type, sticker id
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```
Index: `(project_id, order_index)`

### `editor_sessions`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
user_id         UUID NOT NULL REFERENCES users(id)
canvas_state    JSONB DEFAULT '{}'   -- in-progress state not yet saved to project
last_active_at  TIMESTAMPTZ DEFAULT now()
started_at      TIMESTAMPTZ DEFAULT now()
```

### `templates`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(255) NOT NULL
category        VARCHAR(50) NOT NULL
width           INTEGER NOT NULL
height          INTEGER NOT NULL
thumbnail_url   VARCHAR(500)
layers          JSONB NOT NULL DEFAULT '[]'
canvas_config   JSONB NOT NULL DEFAULT '{}'
tags            TEXT[]
is_public       BOOLEAN DEFAULT false
organization_id UUID REFERENCES organizations(id)   -- NULL = platform template
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

### `jobs`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
type            VARCHAR(50) NOT NULL   -- text-to-image|background-removal|export|ocr|...
status          VARCHAR(20) DEFAULT 'pending'  -- pending|processing|complete|failed
payload         JSONB NOT NULL
result          JSONB
error_message   TEXT
external_job_id VARCHAR(255)    -- Leonardo generationId, Cloudinary batch id, etc.
user_id         UUID REFERENCES users(id)
organization_id UUID NOT NULL REFERENCES organizations(id)
asset_id        UUID REFERENCES assets(id)
project_id      UUID REFERENCES projects(id)
credits_used    INTEGER DEFAULT 0
started_at      TIMESTAMPTZ
completed_at    TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
```
Index: `(organization_id, status, created_at DESC)`, `(external_job_id)`

### `subscription_plans`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(50) NOT NULL   -- Free|Starter|Pro|Business|Enterprise
stripe_price_id VARCHAR(255)
credits_monthly INTEGER NOT NULL
storage_gb      INTEGER NOT NULL
max_members     INTEGER
max_projects    INTEGER
features        JSONB NOT NULL DEFAULT '[]'
price_monthly   DECIMAL(10,2)
is_active       BOOLEAN DEFAULT true
```

### `subscriptions`
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
organization_id     UUID NOT NULL REFERENCES organizations(id)
plan_id             UUID NOT NULL REFERENCES subscription_plans(id)
stripe_subscription_id VARCHAR(255)
status              VARCHAR(20) DEFAULT 'active'  -- active|canceled|past_due|trialing
current_period_start TIMESTAMPTZ
current_period_end  TIMESTAMPTZ
canceled_at         TIMESTAMPTZ
created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
```

### `credits`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
organization_id UUID NOT NULL REFERENCES organizations(id)
balance         INTEGER NOT NULL DEFAULT 0
monthly_allocation INTEGER NOT NULL DEFAULT 0
reset_at        TIMESTAMPTZ
updated_at      TIMESTAMPTZ DEFAULT now()
```

### `credit_transactions`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
organization_id UUID NOT NULL REFERENCES organizations(id)
user_id         UUID REFERENCES users(id)
type            VARCHAR(20) NOT NULL  -- deduction|allocation|purchase|refund
amount          INTEGER NOT NULL      -- positive = add, negative = deduct
balance_after   INTEGER NOT NULL
reason          VARCHAR(255)
job_id          UUID REFERENCES jobs(id)
created_at      TIMESTAMPTZ DEFAULT now()
```

### `activity_logs`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
organization_id UUID NOT NULL REFERENCES organizations(id)
user_id         UUID REFERENCES users(id)
action          VARCHAR(100) NOT NULL
entity_type     VARCHAR(50)
entity_id       UUID
metadata        JSONB DEFAULT '{}'
ip_address      INET
user_agent      TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```
Index: `(organization_id, created_at DESC)`, `(user_id, created_at DESC)`

### `notifications`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
type            VARCHAR(50) NOT NULL
title           VARCHAR(255) NOT NULL
body            TEXT
data            JSONB DEFAULT '{}'
is_read         BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
```
Index: `(user_id, is_read, created_at DESC)`

---

## MongoDB — Collections (Aux)

### `smsvalidations`
Used by `SmsValidationModule` (Mongoose):
```typescript
{
  phone: String,
  action: SmsValidationAction (enum),
  provider: SmsValidationProvider (enum),
  status: SmsValidationStatus (enum),
  metadata: Mixed,
  created_at: Date,
  updated_at: Date,
}
```

---

## Redis — Key Patterns

| Key | TTL | Type | Purpose |
|---|---|---|---|
| `session:{userId}` | 15 min | Hash | JWT session metadata |
| `refresh:{tokenHash}` | 7 days | String | Refresh token tracking |
| `asset:{id}:meta` | 1 hr | Hash | Asset metadata cache |
| `template:{id}` | 24 hr | String (JSON) | Template definition cache |
| `org:{id}:settings` | 1 hr | Hash | Org settings cache |
| `credits:{orgId}` | 5 min | String | Credit balance cache |
| `rl:{ip}:{route}` | 1 min | String (counter) | Rate limit counter |
| `rl:user:{id}:{route}` | 1 min | String (counter) | Per-user rate limit |
| `signed-upload:{id}` | 10 min | String (JSON) | Signed upload params |
| `job:{jobId}:status` | 24 hr | String | BullMQ job status mirror |
| `collab:{projectId}:users` | session | Set | Active editor presence |

---

## BullMQ — Queue Configuration

```typescript
// Redis connection shared across all queues
const redisConnection = { host: REDIS_HOST, port: REDIS_PORT };

// Queue: asset-processing
defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }

// Queue: ai-generation
defaultJobOptions: { attempts: 2, backoff: { type: 'fixed', delay: 10000 } }

// Queue: export
defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 3000 } }

// Queue: notifications
defaultJobOptions: { attempts: 5, backoff: { type: 'fixed', delay: 2000 } }
```

**Dead Letter Queue:** Failed jobs after max attempts move to `{queue-name}:failed` for manual inspection and retry via Admin module.

---

## TypeORM Conventions

- All primary keys: `@PrimaryGeneratedColumn('uuid')`
- All timestamps: `@CreateDateColumn` / `@UpdateDateColumn` (UTC)
- Column names: `snake_case` (mapped to `camelCase` in entity)
- `@VersionColumn()` on all mutable entities (optimistic locking)
- Migrations in `src/database/migrations/`
- Never use `synchronize: true` in production

### Migration Workflow

```bash
# Generate migration after entity changes
yarn migration:generate

# Review generated file in src/database/migrations/
# Then apply
yarn db:migrate

# Rollback if needed
yarn migration:revert
```

---

## Database Indexes Summary

| Table | Index |
|---|---|
| `users` | `email` (unique), `phone` (unique) |
| `assets` | `(workspace_id, type, is_archived)`, `(organization_id, created_at DESC)` |
| `projects` | `(workspace_id, status)`, `(organization_id, status)` |
| `layers` | `(project_id, order_index)` |
| `jobs` | `(organization_id, status, created_at DESC)`, `external_job_id` |
| `activity_logs` | `(organization_id, created_at DESC)`, `(user_id, created_at DESC)` |
| `notifications` | `(user_id, is_read, created_at DESC)` |
| `refresh_tokens` | `(user_id, is_revoked)` |
