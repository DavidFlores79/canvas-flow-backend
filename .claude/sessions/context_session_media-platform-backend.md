# Context Session: Canvas Flow AI Media Editing Platform (Backend)

## Feature Description
Build a full-featured, scalable AI-powered media editing platform backend. This is a multi-tenant SaaS (Software as a Service) serving as the foundation for a Canva-like editor integrating Cloudinary and Leonardo AI. Two seed organizations exist from day one: **Paisamex** and **Luxfree**.

## Architecture & Tech Stack
- **Framework:** NestJS 11 (Strict TypeScript)
- **Database:** MongoDB with Mongoose 9
- **Auth:** JWT (passport-jwt already installed) + CASL for authorization
- **Storage/Media:** Cloudinary SDK
- **AI Generation:** Leonardo AI REST API
- **Package Manager:** yarn (NEVER npm)

## Multi-Tenant Data Hierarchy
```
Organization (Paisamex / Luxfree / ...)
  └── OrganizationMember (userId, role: owner|admin|member)
  └── Workspace (e.g. "Marketing", "Social Media")
        └── WorkspaceMember (userId, role: owner|editor|viewer)
        └── Project (individual canvas)
              └── Layer (elements: text, image, shape)
              └── Asset (uploaded media files)
```

## RBAC Strategy: CASL with Custom Guards

### Why CASL (NOT nest-casl)
- `nest-casl` is TypeORM-coupled and not maintained for NestJS 11
- Custom `CaslModule` gives full control, no N+1 hydration issues
- Only dependency to add: `yarn add @casl/ability`

### Role Definitions
**Organization-level roles** (`OrgRole` enum):
| Role | Permissions |
|---|---|
| `owner` | Full control, manage billing, delete org |
| `admin` | Manage members, manage all workspaces/projects |
| `member` | Read org, create workspaces, access assigned workspaces |

**Workspace-level roles** (`WorkspaceRole` enum):
| Role | Permissions |
|---|---|
| `owner` | Manage workspace members, manage all projects/layers |
| `editor` | Create/read/update projects, manage layers and assets |
| `viewer` | Read-only on workspace, projects, layers, assets |

### JWT Payload (Upgraded)
```typescript
export interface JwtPayload {
  sub: string;            // userId (MongoDB ObjectId as string)
  organizationId: string; // active org ObjectId
  orgRole: OrgRole;       // owner | admin | member
  aud: string;
  iss: string;
  iat: number;
  exp: number;
  jti: string;
}
```
- `group` field removed from JWT entirely
- One active org per token (Option A)
- Org switch: `POST /auth/switch-organization` re-issues token pair

## Complete Implementation Roadmap

### Phase 0: RBAC Foundation (implement first)
- Install `@casl/ability`
- Create `src/casl/` module with:
  - `AbilityFactory` — defines CASL rules per AuthContext
  - `PoliciesGuard` — reads `@CheckPolicies()` metadata
  - `TenantGuard` — validates org membership from JWT, attaches `req.tenantContext`
  - `CheckPolicies` decorator
- Define `OrgRole` and `WorkspaceRole` enums in `src/shared/enum/`
- Fix existing `HttpExceptionFilter` bug (implements NestInterceptor but registered as APP_FILTER — register as APP_INTERCEPTOR instead)
- Update `JwtPayload` interface: add `organizationId`, `orgRole`, remove `group`
- Add `POST /auth/switch-organization` endpoint in AuthService
- Update `generateTokensForUser()` to accept `OrganizationMember` parameter

### Phase 1: Core Identity Modules
- `organizations` module:
  - `OrganizationSchema` + `OrganizationMemberSchema` (separate collection)
  - CRUD: create, findById, update, delete
  - Member management: invite, remove, update role
  - Compound unique index: `{ organizationId, userId }`
- `workspaces` module:
  - `WorkspaceSchema` + `WorkspaceMemberSchema` (separate collection)
  - All documents carry `organizationId` for tenant isolation
  - Member management endpoints
  - Compound unique index: `{ workspaceId, userId }` + `{ userId, role }` for queries
- Seeds:
  - `src/database/seeds/` with standalone bootstrap pattern (NOT OnApplicationBootstrap)
  - Idempotent seeders for: Paisamex org + owner, Luxfree org + owner, default workspaces
  - `yarn seed` and `yarn seed:dev` scripts in package.json

### Phase 2: Canvas Resources
- `projects` module:
  - `ProjectSchema` with `organizationId`, `workspaceId`, `ownerId`, `version` (optimistic locking)
  - CRUD with CASL policy checks
- `layers` module:
  - `LayerSchema` with `projectId`, `organizationId`, `type`, `properties` map
  - Bulk update support for canvas drag/resize operations
- `assets` module:
  - `AssetSchema` with `organizationId`, `workspaceId`, `cloudinaryPublicId`, `url`, `type`, `metadata`

### Phase 3: Media & AI Integrations
- `cloudinary` module:
  - `CloudinaryService` — upload, delete, transform
  - `CloudinaryWebhookController` — receive processing status webhooks
- `leonardo` module:
  - `LeonardoService` — trigger generation jobs via REST API
  - Webhook or polling to receive results
  - Download generated images and sync to Cloudinary (Cloudinary is source of truth)

### Phase 4: Async Infrastructure
- Redis + BullMQ configuration
- `jobs` module — queue Leonardo AI generation tasks
- Job processors with retry logic and status tracking

## Key Architectural Decisions

### Membership as Separate Collections (NOT embedded arrays)
Query pattern "get all workspaces where user X is editor" requires separate indexed collections. Embedded arrays lose index efficiency on role filtering in MongoDB.

### TenantGuard as NestJS Guard (NOT Interceptor)
Guards can abort requests with 403 before business logic. Applied at controller level (NOT global) because auth endpoints have no org context.

### Guard Order on Protected Controllers
```typescript
@UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
```

### AbilityFactory — No DB Queries
CASL rules computed from in-memory JWT data only. TenantGuard pre-fetches and attaches membership to `req.tenantContext` before AbilityFactory runs.

### Seeds — Standalone Bootstrap
```typescript
// src/database/seeds/seed.ts
const app = await NestFactory.createApplicationContext(SeederModule);
await app.get(SeederService).seed();
await app.close();
```

## Branch Strategy
- **Feature Branch:** `feat/media-platform-backend-core`
- **Target Branch:** `develop`
- **PR Reviews:** 1 reviewer required

## File Structure
```
src/
  casl/
    CaslModule.ts
    factory/AbilityFactory.ts
    guard/TenantGuard.ts
    guard/PoliciesGuard.ts
    decorator/CheckPolicies.ts
    interface/PolicyHandler.ts
    interface/AuthContext.ts
  shared/
    enum/OrgRole.ts
    enum/WorkspaceRole.ts
    (existing: error/, decorator/, dto/, interface/)
  organizations/
    OrganizationsModule.ts
    schemas/OrganizationSchema.ts
    schemas/OrganizationMemberSchema.ts
    controller/OrganizationController.ts + .spec.ts
    service/OrganizationService.ts + .spec.ts
    dto/ (Create, Update, Filter, Response DTOs)
    interface/
  workspaces/
    WorkspacesModule.ts
    schemas/WorkspaceSchema.ts
    schemas/WorkspaceMemberSchema.ts
    controller/WorkspaceController.ts + .spec.ts
    service/WorkspaceService.ts + .spec.ts
    dto/
    interface/
  projects/
    ProjectsModule.ts
    schemas/ProjectSchema.ts
    controller/ProjectController.ts + .spec.ts
    service/ProjectService.ts + .spec.ts
    dto/
  layers/
    LayersModule.ts
    schemas/LayerSchema.ts
    controller/LayerController.ts + .spec.ts
    service/LayerService.ts + .spec.ts
    dto/
  assets/
    AssetsModule.ts
    schemas/AssetSchema.ts
    controller/AssetController.ts + .spec.ts
    service/AssetService.ts + .spec.ts
    dto/
  cloudinary/
    CloudinaryModule.ts
    service/CloudinaryService.ts
    controller/CloudinaryWebhookController.ts
  leonardo/
    LeonardoModule.ts
    service/LeonardoService.ts
  database/
    seeds/
      SeederModule.ts
      SeederService.ts
      seed.ts
      seeders/
        OrganizationSeeder.ts
        UserSeeder.ts
        WorkspaceSeeder.ts
```

## Testing Requirements
- Unit tests for all services (mock Mongoose Models)
- Unit tests for all controllers (mock Services)
- Unit tests for AbilityFactory (cover all role/action combinations)
- Unit tests for TenantGuard and PoliciesGuard
- Integration tests for auth flow with org context
- Target: >80% coverage via `yarn test:cov`

## Critical Bug to Fix (Pre-existing)
`src/interceptors/HttpExceptionFilter.ts` implements `NestInterceptor` but is registered as `APP_FILTER`. Guard-level exceptions (ForbiddenException, UnauthorizedException) will bypass the error map. Fix: register as `APP_INTERCEPTOR` instead of `APP_FILTER`.

## Dependency to Add
```bash
yarn add @casl/ability
```

## Next Steps (Execution Phase)
1. Execute `start-working-on-branch-new feat/media-platform-backend-core`
2. Fix HttpExceptionFilter registration bug
3. Implement Phase 0 (CaslModule + updated JWT)
4. Implement Phase 1 (organizations + workspaces + seeds)
5. Implement Phase 2 (projects + layers + assets)
6. Implement Phase 3 (cloudinary + leonardo)
7. Implement Phase 4 (async jobs)
