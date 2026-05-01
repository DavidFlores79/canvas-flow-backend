# API — Canvas Flow

Swagger UI available at `http://localhost:3000/api` (all environments except production).

---

## Base URL

```
https://api.canvasflow.io/v1      # production
http://localhost:3000             # local dev
```

---

## Authentication

### JWT Bearer Token

All protected endpoints require:

```
Authorization: Bearer <access_token>
```

Access tokens expire in **15 minutes**. Use the refresh endpoint to obtain a new one without re-login.

### Refresh Token

Refresh tokens (7-day TTL) are returned on sign-in and sign-up. Store securely (httpOnly cookie recommended for browser clients).

### Auth Flow

```
POST /auth/sign-in
  ← { accessToken, refreshToken, expiresIn }

POST /auth/refresh
  Body: { refreshToken }
  ← { accessToken, refreshToken, expiresIn }

POST /auth/sign-out
  Body: { refreshToken }
  ← 204 No Content
```

---

## Rate Limiting

Rate limits are enforced per IP and per authenticated user via Redis counters.

| Tier                  | Limit   | Window |
| --------------------- | ------- | ------ |
| Public endpoints      | 60 req  | 1 min  |
| Auth endpoints        | 10 req  | 1 min  |
| Authenticated user    | 300 req | 1 min  |
| AI pipeline endpoints | 20 req  | 1 min  |
| Export endpoints      | 10 req  | 1 min  |
| Webhook endpoints     | 500 req | 1 min  |

**429 response:**

```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "retryAfter": 45
}
```

---

## Standard Response Format

### Success

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

`meta` is only present on paginated list responses.

### Error

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [{ "field": "email", "message": "must be a valid email" }]
}
```

### Common Status Codes

| Code | Meaning                                        |
| ---- | ---------------------------------------------- |
| 200  | OK                                             |
| 201  | Created                                        |
| 204  | No Content (delete / sign-out)                 |
| 400  | Bad Request — validation failed                |
| 401  | Unauthorized — missing or invalid token        |
| 403  | Forbidden — insufficient permissions           |
| 404  | Not Found                                      |
| 409  | Conflict — duplicate entity                    |
| 422  | Unprocessable Entity — business rule violation |
| 429  | Too Many Requests                              |
| 500  | Internal Server Error                          |

---

## Pagination

List endpoints accept:

```
GET /assets?page=1&limit=20&sort=createdAt&order=DESC
```

| Param   | Default     | Description              |
| ------- | ----------- | ------------------------ |
| `page`  | `1`         | Page number (1-indexed)  |
| `limit` | `20`        | Items per page (max 100) |
| `sort`  | `createdAt` | Sort field               |
| `order` | `DESC`      | `ASC` or `DESC`          |

---

## API Endpoints Reference

### Authentication

```
POST   /auth/sign-up
POST   /auth/sign-in
POST   /auth/refresh
POST   /auth/sign-out
POST   /auth/recover-password
POST   /auth/recover-password/complete
```

### Users

```
GET    /users/me
PATCH  /users/me
DELETE /users/me
GET    /users/:id          (admin)
GET    /users              (admin, paginated)
```

### SMS Validation

```
POST   /sms-validation
POST   /sms-validation/confirm
POST   /sms-validation/resend
```

### Organizations

```
POST   /organizations
GET    /organizations/:id
PATCH  /organizations/:id
DELETE /organizations/:id
GET    /organizations/:id/members
POST   /organizations/:id/members
PATCH  /organizations/:id/members/:userId
DELETE /organizations/:id/members/:userId
```

### Workspaces

```
POST   /workspaces
GET    /workspaces
GET    /workspaces/:id
PATCH  /workspaces/:id
DELETE /workspaces/:id
GET    /workspaces/:id/members
POST   /workspaces/:id/members
PATCH  /workspaces/:id/members/:userId
DELETE /workspaces/:id/members/:userId
```

### Projects

```
POST   /projects
GET    /projects             (paginated, filterable)
GET    /projects/:id
PATCH  /projects/:id
DELETE /projects/:id
POST   /projects/:id/duplicate
GET    /projects/:id/history
POST   /projects/:id/restore/:versionId
```

### Assets

```
POST   /assets/upload-url    (get signed Cloudinary upload params)
POST   /assets               (register asset after upload)
GET    /assets               (paginated, filterable)
GET    /assets/:id
PATCH  /assets/:id
DELETE /assets/:id
GET    /assets/:id/versions
POST   /assets/:id/versions/:versionId/restore
POST   /assets/:id/duplicate
POST   /assets/batch
```

#### GET /assets/upload-url

**Request:**

```json
{
  "filename": "photo.jpg",
  "contentType": "image/jpeg",
  "folderId": "uuid-optional",
  "projectId": "uuid-optional"
}
```

**Response:**

```json
{
  "uploadUrl": "https://api.cloudinary.com/v1_1/...",
  "fields": {
    "signature": "abc123",
    "timestamp": 1714500000,
    "api_key": "...",
    "folder": "orgs/uuid/assets"
  },
  "assetId": "uuid",
  "expiresAt": "2026-04-30T12:10:00Z"
}
```

### Folders

```
POST   /folders
GET    /folders              (tree structure)
GET    /folders/:id
PATCH  /folders/:id
DELETE /folders/:id
POST   /folders/:id/move
```

### Layers

```
GET    /projects/:id/layers
POST   /projects/:id/layers
PATCH  /projects/:id/layers/:layerId
DELETE /projects/:id/layers/:layerId
POST   /projects/:id/layers/reorder
POST   /projects/:id/layers/:layerId/duplicate
```

### Templates

```
GET    /templates            (paginated, category filter)
GET    /templates/:id
POST   /templates
PATCH  /templates/:id
DELETE /templates/:id
POST   /templates/:id/use   (instantiate as new project)
```

### Transformations

```
GET    /transformations      (list presets)
POST   /transformations      (create preset)
POST   /transformations/apply (apply to asset, returns new version)
```

#### POST /transformations/apply

**Request:**

```json
{
  "assetId": "uuid",
  "operations": [
    { "type": "resize", "width": 800, "height": 600, "crop": "fill" },
    { "type": "brightness", "value": 20 },
    { "type": "format", "format": "webp", "quality": 85 }
  ],
  "saveAsVersion": true
}
```

**Response:**

```json
{
  "transformedUrl": "https://res.cloudinary.com/...",
  "assetVersionId": "uuid"
}
```

### AI Pipelines

```
POST   /ai-pipelines
GET    /ai-pipelines/:id     (job status + result)
DELETE /ai-pipelines/:id     (cancel pending job)
```

#### POST /ai-pipelines

**Request (text-to-image):**

```json
{
  "type": "text-to-image",
  "projectId": "uuid",
  "params": {
    "prompt": "A serene mountain lake at sunrise, photorealistic",
    "negativePrompt": "blurry, watermark, low quality",
    "width": 1024,
    "height": 1024,
    "numImages": 1,
    "style": "CINEMATIC",
    "model": "leonardo-diffusion-xl"
  }
}
```

**Request (background-removal):**

```json
{
  "type": "background-removal",
  "assetId": "uuid"
}
```

**Response (async job created):**

```json
{
  "jobId": "uuid",
  "status": "pending",
  "creditsDeducted": 5,
  "estimatedSeconds": 30
}
```

### OCR Pipelines

```
POST   /ocr-pipelines
GET    /ocr-pipelines/:id
```

### Export Pipelines

```
POST   /export-pipelines
GET    /export-pipelines/:id
GET    /export-pipelines/:id/download   (redirect to signed URL)
GET    /export-pipelines/history        (paginated export history)
```

#### POST /export-pipelines

**Request:**

```json
{
  "projectId": "uuid",
  "format": "png",
  "width": 1080,
  "height": 1080,
  "quality": 90,
  "includeWatermark": false,
  "preset": "instagram-post"
}
```

### Billing & Subscriptions

```
GET    /billing/plans
POST   /billing/checkout      (create Stripe checkout session)
GET    /billing/invoices       (paginated)
POST   /billing/portal        (Stripe customer portal URL)

GET    /subscriptions/current
POST   /subscriptions/cancel
POST   /subscriptions/upgrade

GET    /credits
GET    /credits/history        (paginated)
POST   /credits/purchase
```

### Webhooks

```
POST   /webhooks/cloudinary
POST   /webhooks/leonardo
POST   /webhooks/billing
```

All webhook endpoints verify HMAC signatures before processing. Return `200` immediately; processing is async.

### Notifications

```
GET    /notifications          (paginated, unread first)
PATCH  /notifications/:id/read
POST   /notifications/read-all
DELETE /notifications/:id
```

### Analytics

```
GET    /analytics/overview
GET    /analytics/assets
GET    /analytics/credits
GET    /analytics/exports
GET    /analytics/users
```

Query params: `?from=2026-01-01&to=2026-04-30&workspaceId=uuid`

### Activity Logs

```
GET    /activity-logs          (paginated, filterable)
```

Filters: `userId`, `action`, `entityType`, `from`, `to`

### Admin (role: admin only)

```
GET    /admin/organizations
GET    /admin/users
PATCH  /admin/users/:id
POST   /admin/credits/grant
GET    /admin/jobs
POST   /admin/jobs/:id/retry
GET    /admin/analytics
```

### Health

```
GET    /health
GET    /info
```

---

## WebSocket Gateway

Endpoint: `wss://api.canvasflow.io/editor`

Authentication: Pass `Authorization` header on connection or `token` query param.

### Client → Server Events

| Event           | Payload                | Description               |
| --------------- | ---------------------- | ------------------------- |
| `join-project`  | `{ projectId }`        | Join project room         |
| `leave-project` | `{ projectId }`        | Leave project room        |
| `layer-update`  | `{ projectId, layer }` | Broadcast layer change    |
| `cursor-move`   | `{ projectId, x, y }`  | Broadcast cursor position |
| `ping`          | —                      | Keepalive                 |

### Server → Client Events

| Event             | Payload                       | Description                   |
| ----------------- | ----------------------------- | ----------------------------- |
| `project-joined`  | `{ sessionId, activeUsers }`  | Confirm join                  |
| `user-joined`     | `{ userId, name, avatarUrl }` | Another user joined           |
| `user-left`       | `{ userId }`                  | Another user left             |
| `layer-updated`   | `{ layer, updatedBy }`        | Layer changed by another user |
| `layer-locked`    | `{ layerId, lockedBy }`       | Layer locked by another user  |
| `layer-unlocked`  | `{ layerId }`                 | Layer lock released           |
| `job-complete`    | `{ jobId, type, result }`     | Async job finished            |
| `export-ready`    | `{ exportId, downloadUrl }`   | Export ready to download      |
| `credits-updated` | `{ balance }`                 | Credit balance changed        |

---

## API Versioning

The API is versioned via URL prefix (`/v1`). Breaking changes increment the version. Non-breaking additions (new fields, new endpoints) do not require a version bump.

---

## OpenAPI / Swagger

- Available at `/api` in development/staging
- JSON spec at `/api-json`
- All endpoints have `@ApiTags`, `@ApiOperation`, `@ApiResponse` decorators
- All DTOs have `@ApiProperty` decorators
