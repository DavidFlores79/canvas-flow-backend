# Architecture — Canvas Flow

## System Overview

Canvas Flow is a full-featured AI-powered media editing platform built on a **microservices-friendly monolith** backend (NestJS) and a reactive **Angular 20** frontend. The system is designed for horizontal scalability, provider extensibility, and progressive feature rollout.

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│   Angular 20 SPA  ·  Mobile (future)  ·  Third-party API users  │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTPS / WebSocket
┌───────────────────────────▼──────────────────────────────────────┐
│                      API Gateway / NestJS                        │
│   REST API  ·  WebSocket Gateway  ·  Webhook Listeners          │
│   Auth (JWT)  ·  Rate Limiting  ·  RBAC Guards                   │
└──┬──────────────┬──────────────┬───────────────┬─────────────────┘
   │              │              │               │
   ▼              ▼              ▼               ▼
PostgreSQL      Redis         BullMQ         External APIs
(primary)      (cache +      (async job      · Cloudinary
               session)       queues)        · Leonardo AI
                                             · Twilio
                                             · AWS S3 (optional)
                                             · Sentry
```

---

## Data Flow

### Secure Upload Flow
```
Client → POST /assets/upload-url
       ← Signed Cloudinary upload URL (short-lived)
Client → PUT <signed-url> (direct to Cloudinary)
Cloudinary → POST /webhooks/cloudinary (job complete)
Backend → persist asset metadata → PostgreSQL
        → enqueue post-processing job → BullMQ
BullMQ  → extract metadata, auto-tag, moderate
        → update asset record
Client  ← asset ready notification (WebSocket / polling)
```

### AI Generation Flow (Leonardo AI)
```
Client → POST /ai-pipelines/generate
Backend → validate credits → deduct credits
        → POST Leonardo AI API (async job)
        ← jobId
Backend → store pending job in DB
Leonardo → POST /webhooks/leonardo (generation complete)
Backend → download result → upload to Cloudinary
        → update job record → notify client
Client  ← asset ready (WebSocket)
```

### Export Flow
```
Client → POST /export-pipelines
Backend → enqueue export job → BullMQ
BullMQ  → fetch layers/project state
        → apply transformations via Cloudinary
        → generate output (PNG/JPG/WebP/PDF/ZIP)
        → upload to Cloudinary / S3
        → generate signed download URL
Client  ← download URL (notification / webhook)
```

---

## Module Dependency Graph

```
AppModule
├── CoreModule             (health, system info)
├── DatabaseModule         (TypeORM + Redis)
├── AuthModule             (depends on: UsersModule)
├── UsersModule
├── OrganizationsModule
├── WorkspacesModule       (depends on: OrganizationsModule)
├── ProjectsModule         (depends on: WorkspacesModule)
├── AssetsModule           (depends on: CloudinaryModule, FoldersModule)
├── FoldersModule          (depends on: ProjectsModule)
├── CloudinaryModule       (standalone integration)
├── LeonardoModule         (standalone integration)
├── TransformationsModule  (depends on: CloudinaryModule)
├── EditorSessionsModule   (depends on: ProjectsModule, LayersModule)
├── LayersModule           (depends on: AssetsModule)
├── TemplatesModule
├── OcrPipelinesModule     (depends on: CloudinaryModule, AssetsModule)
├── AiPipelinesModule      (depends on: LeonardoModule, CreditsModule)
├── ExportPipelinesModule  (depends on: CloudinaryModule, JobsModule)
├── JobsModule             (BullMQ processors)
├── WebhooksModule         (Cloudinary + Leonardo listeners)
├── NotificationsModule
├── BillingModule
├── SubscriptionsModule    (depends on: BillingModule)
├── CreditsModule          (depends on: SubscriptionsModule)
├── AnalyticsModule
├── ActivityLogsModule
└── AdminModule
```

---

## Async Processing Architecture (BullMQ)

```
Queue: asset-processing
  ├── job: extract-metadata
  ├── job: auto-tag
  ├── job: moderate-content
  ├── job: generate-thumbnail
  └── job: backup-to-s3

Queue: ai-generation
  ├── job: text-to-image
  ├── job: image-to-image
  ├── job: inpainting
  ├── job: outpainting
  ├── job: background-removal
  └── job: upscale

Queue: export
  ├── job: render-canvas
  ├── job: apply-transformations
  ├── job: generate-pdf
  └── job: package-zip

Queue: ocr
  ├── job: extract-text
  ├── job: detect-edges
  └── job: perspective-correction

Queue: notifications
  └── job: send-notification
```

---

## Caching Strategy (Redis)

| Cache Key Pattern | TTL | Purpose |
|---|---|---|
| `user:{id}:session` | 15 min | JWT session data |
| `asset:{id}:metadata` | 1 hr | Asset metadata |
| `template:{id}` | 24 hr | Template definitions |
| `org:{id}:settings` | 1 hr | Org config |
| `workspace:{id}:members` | 30 min | Member list |
| `credits:{userId}` | 5 min | Available credits |
| `rate-limit:{ip}:{endpoint}` | 1 min | Rate limit counters |
| `cloudinary:signed-url:{id}` | 10 min | Pre-signed upload URLs |

---

## Multi-Tenancy Model

```
Organization (tenant root)
└── Workspace (scoped environment)
    └── Project (editing context)
        ├── Assets (media files)
        ├── Folders (asset organization)
        ├── Layers (composition)
        └── Editor Sessions (real-time state)
```

- All entities carry `organizationId` for tenant isolation
- RBAC enforced at controller level via Guards
- Row-level scoping in queries via TypeORM query builders

---

## Security Architecture

- **Authentication**: JWT access tokens (15 min) + refresh tokens (7 days)
- **Authorization**: Role-based (Owner, Admin, Editor, Viewer) per workspace
- **Upload Security**: Cloudinary signed upload parameters (server-generated, short-lived)
- **Webhook Verification**: HMAC signature validation on all incoming webhooks
- **Rate Limiting**: Redis-backed per-IP and per-user limits via `@nestjs/throttler`
- **Input Validation**: All DTOs use `class-validator` with strict rules
- **Secret Management**: Environment-specific `.env` files; never committed to VCS

---

## Provider Extensibility

The integration layer is built on a **provider interface pattern** allowing future engines to be swapped or added:

```typescript
interface MediaEngineProvider {
  upload(file: Buffer, options: UploadOptions): Promise<AssetResult>;
  transform(assetId: string, ops: TransformOp[]): Promise<string>;
  deliver(assetId: string, options: DeliveryOptions): string;
}

interface GenerativeAIProvider {
  textToImage(prompt: string, options: GenOptions): Promise<GenerationJob>;
  imageToImage(sourceUrl: string, prompt: string): Promise<GenerationJob>;
  getJobStatus(jobId: string): Promise<JobStatus>;
}
```

Current implementations:
- `CloudinaryMediaEngine` → `MediaEngineProvider`
- `LeonardoAIEngine` → `GenerativeAIProvider`

Future providers: OpenAI DALL-E, Stability AI, Replicate, custom ML pipelines.

---

## Deployment

### Docker Compose (Development)
```yaml
services:
  api:       # NestJS backend
  postgres:  # PostgreSQL 16
  redis:     # Redis 7
  mongo:     # MongoDB (aux)
```

### Production (Recommended)
- **API**: Containerized NestJS on AWS ECS / Azure Container Apps / Railway
- **Database**: AWS RDS PostgreSQL / Azure Database for PostgreSQL
- **Cache**: AWS ElastiCache Redis / Azure Cache for Redis
- **Queues**: BullMQ workers as separate scaled containers
- **CDN**: Cloudinary handles media delivery natively
- **Monitoring**: Sentry (errors) + custom analytics dashboard

---

## Version Control for Assets

Every asset modification creates a new **AssetVersion** record:

```
AssetVersion
├── id (UUID)
├── assetId (FK)
├── version (integer, auto-increment per asset)
├── cloudinaryPublicId
├── transformations (JSONB)
├── metadata (JSONB)
├── createdBy (userId)
└── createdAt
```

Projects maintain a **ProjectHistory** stack enabling undo/redo at the server level for collaborative scenarios.
