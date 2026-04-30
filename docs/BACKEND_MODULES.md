# Backend Modules — Canvas Flow

All NestJS modules follow the **Controller → Service → Repository** pattern with UUID primary keys, class-validator DTOs, and Swagger documentation.

---

## Core & Infrastructure Modules

### `CoreModule`

Health checks and system information endpoints.

- `GET /health` — liveness + readiness probes
- `GET /info` — app version, environment

### `DatabaseModule`

Configures TypeORM (PostgreSQL) and Mongoose (MongoDB aux). Loaded once at app root.

### `AuthModule`

JWT-based authentication for the platform.

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| POST | `/auth/sign-up` | Register new user |
| POST | `/auth/sign-in` | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | Exchange refresh token for new access token |
| POST | `/auth/sign-out` | Revoke refresh token |
| POST | `/auth/recover-password` | Initiate password recovery |
| POST | `/auth/recover-password/complete` | Complete password reset |

**Key DTOs:** `SignUpPayloadDto`, `SignInUserPayloadDto`, `RefreshTokenPayloadDto`, `RecoverPasswordPayloadDto`, `CompleteRecoverPasswordPayloadDto`

### `SmsValidationModule`

SMS OTP via Twilio Verify for phone number confirmation and 2FA.

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| POST | `/sms-validation` | Send OTP to phone |
| POST | `/sms-validation/confirm` | Confirm OTP code |
| POST | `/sms-validation/resend` | Resend OTP |

---

## User & Organization Modules

### `UsersModule`

User profile management, preferences, and account settings.

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| GET | `/users/me` | Current user profile |
| PATCH | `/users/me` | Update profile |
| DELETE | `/users/me` | Delete account |
| GET | `/users/:id` | Get user by ID (admin) |
| GET | `/users` | List users (admin, paginated) |

**Entity fields:** `id`, `email`, `phone`, `firstName`, `lastName`, `avatarUrl`, `role`, `isEmailVerified`, `isPhoneVerified`, `createdAt`, `updatedAt`

### `OrganizationsModule`

Multi-tenant organization management. Each org is a billing and permission boundary.

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| POST | `/organizations` | Create organization |
| GET | `/organizations/:id` | Get organization |
| PATCH | `/organizations/:id` | Update organization |
| DELETE | `/organizations/:id` | Delete organization |
| GET | `/organizations/:id/members` | List members |
| POST | `/organizations/:id/members` | Invite member |
| DELETE | `/organizations/:id/members/:userId` | Remove member |

**Entity fields:** `id`, `name`, `slug`, `logoUrl`, `planId`, `ownerId`, `settings (JSONB)`, `createdAt`

### `WorkspacesModule`

Scoped environments within an organization. Teams operate inside workspaces.

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| POST | `/workspaces` | Create workspace |
| GET | `/workspaces/:id` | Get workspace |
| PATCH | `/workspaces/:id` | Update workspace |
| DELETE | `/workspaces/:id` | Delete workspace |
| GET | `/workspaces/:id/members` | List workspace members |
| POST | `/workspaces/:id/members` | Add member |
| PATCH | `/workspaces/:id/members/:userId` | Update member role |

**Roles:** `owner`, `admin`, `editor`, `viewer`

---

## Project & Asset Modules

### `ProjectsModule`

Media editing projects containing assets, layers, and history.

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| POST | `/projects` | Create project |
| GET | `/projects` | List projects (paginated, filterable) |
| GET | `/projects/:id` | Get project with metadata |
| PATCH | `/projects/:id` | Update project settings |
| DELETE | `/projects/:id` | Delete project |
| POST | `/projects/:id/duplicate` | Duplicate project |
| GET | `/projects/:id/history` | Project edit history |
| POST | `/projects/:id/restore/:versionId` | Restore to version |

**Entity fields:** `id`, `name`, `workspaceId`, `organizationId`, `canvasConfig (JSONB)`, `thumbnailUrl`, `status`, `tags`, `createdBy`, `createdAt`, `updatedAt`

### `AssetsModule`

Full asset lifecycle management including versioning, metadata, and delivery.

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| POST | `/assets/upload-url` | Get signed Cloudinary upload URL |
| POST | `/assets` | Register asset after upload |
| GET | `/assets` | List assets (paginated, filterable) |
| GET | `/assets/:id` | Get asset details |
| PATCH | `/assets/:id` | Update asset metadata |
| DELETE | `/assets/:id` | Delete asset (+ Cloudinary cleanup) |
| GET | `/assets/:id/versions` | List asset versions |
| POST | `/assets/:id/versions/:versionId/restore` | Restore version |
| POST | `/assets/:id/duplicate` | Duplicate asset |
| POST | `/assets/batch` | Batch operations |

**Entity fields:** `id`, `name`, `cloudinaryPublicId`, `cloudinaryUrl`, `format`, `width`, `height`, `size`, `type` (image/video/document/audio), `folderId`, `projectId`, `organizationId`, `tags`, `metadata (JSONB)`, `versions`, `isArchived`

### `FoldersModule`

Hierarchical folder structure for asset organization.

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| POST | `/folders` | Create folder |
| GET | `/folders` | List folders (tree) |
| PATCH | `/folders/:id` | Rename / move folder |
| DELETE | `/folders/:id` | Delete folder |
| POST | `/folders/:id/move` | Move folder to parent |

---

## Editor Modules

### `EditorSessionsModule`

Real-time editor session state management. Each open editor tab creates a session.

**Responsibilities:**

- Track active editor sessions per project
- Persist canvas state snapshots
- Manage auto-save intervals
- Coordinate concurrent edits (lock/unlock layers)
- WebSocket gateway for live state sync

### `LayersModule`

Layer composition engine managing stacking order, transforms, and blending.

**Layer Types:**

- `image` — raster image asset
- `video` — video clip
- `text` — text with font/style
- `shape` — vector shape
- `sticker` — decorative element
- `logo` — brand asset
- `mask` — clipping/alpha mask
- `group` — nested layer group

**Entity fields:** `id`, `sessionId`, `projectId`, `type`, `order`, `isVisible`, `isLocked`, `transform (JSONB)`, `style (JSONB)`, `blendMode`, `opacity`, `effects (JSONB)`, `assetId`

### `TemplatesModule`

Reusable design templates for social media, business documents, marketing materials.

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| GET | `/templates` | List templates (category, size filter) |
| GET | `/templates/:id` | Get template with layers |
| POST | `/templates` | Create custom template |
| POST | `/templates/:id/use` | Instantiate template in project |

**Categories:** social-media, presentation, document, marketing, certificate, card, banner

---

## Integration Modules

### `CloudinaryModule`

Core Cloudinary integration — all media I/O flows through this module.

**Services:**

- `CloudinaryUploadService` — signed upload URL generation, direct upload
- `CloudinaryTransformService` — build transformation URLs, eager transforms
- `CloudinaryDeliveryService` — optimized delivery URLs, responsive images
- `CloudinaryWebhookService` — process incoming Cloudinary notification webhooks

**Key operations:**

- Generate time-limited signed upload parameters
- Apply chained transformation pipelines (crop, resize, rotate, effects, overlays, watermarks)
- OCR extraction via Cloudinary AI
- Auto-tagging and content moderation
- Facial detection
- Metadata extraction
- Video thumbnail generation
- Format conversion and compression
- PDF generation from images
- Responsive image srcset generation

### `LeonardoModule`

Leonardo AI integration for generative workflows.

**Services:**

- `LeonardoGenerationService` — text-to-image, image-to-image, style transfer
- `LeonardoEditService` — inpainting, outpainting, generative fill, object replacement
- `LeonardoEnhancementService` — upscale, denoise, restore
- `LeonardoWebhookService` — process generation complete webhooks

**Key operations:**

- Text-to-image generation with prompt control
- Image-to-image transformations
- Inpainting (fill selected regions)
- Outpainting (extend image canvas)
- Style transfer
- Generative fill
- Object replacement
- Background generation
- Visual enhancement
- Creative variation generation
- Prompt-driven image reconstruction

---

## Pipeline Modules

### `TransformationsModule`

Define, store, and apply reusable transformation presets.

**Transformation types:**

- Crop (smart, face-detect, custom)
- Resize (contain, cover, fill, pad)
- Rotate / Flip
- Brightness / Contrast / Saturation
- Blur / Sharpen
- Grayscale / Sepia
- Color adjustment (hue, temperature, tint)
- Vignette / Noise reduction
- Watermark overlay
- Text overlay with font control
- Logo/sticker overlay with position
- Blending modes
- Background color fill
- Border / rounded corners
- Drop shadow / glow

### `OcrPipelinesModule`

Document scanning and OCR extraction workflows.

**Pipeline stages:**

1. Receive source image (upload or existing asset)
2. Edge detection (Cloudinary AI)
3. Perspective correction / deskew
4. OCR text extraction (Cloudinary OCR)
5. Structure parsing (tables, columns, paragraphs)
6. Export to: plain text, JSON, PDF

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| POST | `/ocr-pipelines` | Start OCR pipeline |
| GET | `/ocr-pipelines/:id` | Get pipeline status and result |

### `AiPipelinesModule`

AI orchestration layer for multi-step generative and enhancement workflows.

**Pipeline types:**

- `background-removal` — Cloudinary AI background removal
- `background-replace` — remove + regenerate with Leonardo
- `smart-enhance` — auto brightness/contrast + AI upscale
- `denoise` — AI noise reduction
- `restore` — AI image restoration
- `generate` — text-to-image via Leonardo
- `variation` — generate creative variations
- `inpaint` — fill masked region
- `outpaint` — extend canvas with generated content

**Credit costs** are deducted per pipeline type before execution.

### `ExportPipelinesModule`

Orchestrate final rendering and delivery of completed designs.

**Export formats:**
| Format | Description |
|---|---|
| PNG | Lossless, transparency support |
| JPG | Lossy, optimized file size |
| WebP | Modern format, best compression |
| PDF | Single or multi-page document |
| ZIP | Bundle of multiple assets/formats |

**Export presets:** social-media sizes (1:1, 9:16, 16:9), print (A4, A3, letter), custom dimensions.

---

## Async & Event Modules

### `JobsModule`

BullMQ job definitions and processors. All heavy async work runs here.

**Queues:**

- `asset-processing` — metadata extraction, auto-tag, moderate, thumbnail, S3 backup
- `ai-generation` — all Leonardo AI job processing
- `export` — canvas render, transformation application, format conversion
- `ocr` — text extraction, edge detection, correction
- `notifications` — email, push, in-app notification dispatch

### `WebhooksModule`

Inbound webhook listeners for external service callbacks.

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| POST | `/webhooks/cloudinary` | Cloudinary job completion |
| POST | `/webhooks/leonardo` | Leonardo AI generation complete |
| POST | `/webhooks/billing` | Payment provider events |

All webhooks validate HMAC signatures before processing.

### `NotificationsModule`

In-app and push notification delivery.

**Notification types:** asset-ready, export-complete, ai-generation-complete, credits-low, member-invited, comment-added, project-shared

---

## Billing & Usage Modules

### `BillingModule`

Payment processing integration (Stripe or equivalent).

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| GET | `/billing/plans` | List available plans |
| POST | `/billing/checkout` | Create checkout session |
| GET | `/billing/invoices` | List invoices |
| POST | `/billing/portal` | Customer billing portal URL |

### `SubscriptionsModule`

Subscription plan management tied to organizations.

**Plans:** Free, Starter, Pro, Business, Enterprise

**Plan limits:** credits/month, storage GB, team members, export formats, API calls/day

### `CreditsModule`

Credit-based metering for AI feature usage.

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| GET | `/credits` | Current credit balance |
| GET | `/credits/history` | Credit usage history |
| POST | `/credits/purchase` | Purchase additional credits |

**Credit costs per operation:**

| Operation                | Credits |
| ------------------------ | ------- |
| Text-to-image (standard) | 5       |
| Text-to-image (HD)       | 10      |
| Image-to-image           | 5       |
| Inpainting               | 8       |
| Outpainting              | 10      |
| Background removal       | 2       |
| Background generation    | 8       |
| AI upscale               | 3       |
| Style transfer           | 6       |
| Creative variation       | 4       |

---

## Observability & Admin Modules

### `AnalyticsModule`

Platform usage analytics and reporting.

**Metrics tracked:**

- Assets uploaded / processed per org
- AI generations per user/org
- Credits consumed
- Storage usage
- Export counts by format
- Active users, sessions

### `ActivityLogsModule`

Immutable audit log for all significant actions.

**Logged events:** asset upload, asset delete, AI generation, export, member invite, permission change, billing event, login, password change.

### `AdminModule`

Admin-only management endpoints.

**Endpoints:**
| Method | Path | Description |
|---|---|---|
| GET | `/admin/organizations` | List all orgs |
| GET | `/admin/users` | List all users |
| POST | `/admin/credits/grant` | Manually grant credits |
| GET | `/admin/jobs` | Queue dashboard |
| GET | `/admin/analytics` | Platform-wide analytics |
| POST | `/admin/maintenance` | Trigger maintenance tasks |
