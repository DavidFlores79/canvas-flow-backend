# Context Session: AI Media Editing Platform (Backend)

## Feature Description
Build a full-featured, scalable AI-powered media editing platform's backend ecosystem. This serves as the foundation for a Canva-like editor integrating Cloudinary and Leonardo AI.

## Architecture & Tech Stack
- **Framework:** NestJS (Strict TypeScript)
- **Database:** PostgreSQL (TypeORM) for relational persistence
- **Caching & Queues:** Redis & BullMQ for asynchronous pipelines
- **Storage:** Optional AWS S3 for backup/archive
- **3rd Party API Integrations:** Cloudinary SDK, Leonardo AI REST API

## Finalized Strategy
- **Pipeline Authority:** Cloudinary is the absolute source of truth. Generative AI assets from Leonardo are downloaded and synced to Cloudinary before presentation to the frontend to ensure deterministic URLs.
- **Collaboration Strategy:** Room-locking mechanism (Single-player active editing) as MVP.

## Complete Implementation Roadmap

### Phase 1: Core Identity & Projects
- Setup `organizations`, `workspaces`, `projects`, and `layers` modules.
- Design TypeORM schemas with `snake_case` database columns and optimistic locking (`@VersionColumn()`).
- Establish `projects` to `layers` one-to-many relationship.

### Phase 2: Media & Integrations
- Setup `assets` module to track uploads.
- Setup `cloudinary` module with webhook controllers to receive processing statuses.
- Setup `leonardo` module to trigger generation jobs and poll/receive webhooks for results.

### Phase 3: Infrastructure & Async Processing
- Configure Redis and BullMQ.
- Implement `jobs` module to queue Leonardo AI image generation tasks.

### Phase 4: Billing & Admin
- Setup `credits` module for AI usage metering.
- Implement `activity-logs` to audit user actions.

## Branch Strategy & Naming
- **Feature Branch:** `feat/media-platform-backend-core`
- **Target Branch:** `develop`

## File Structure & Component Organization
- **Path:** `src/{module_name}/`
- **Components:** `controller/`, `service/`, `entity/`, `dto/`, `interface/`
- Every file must have an `ABOUTME:` comment.
- Error handling must use custom exceptions (`NotFoundEntityError`, etc.).

## Next Steps (Execution Phase)
- Review the detailed technical specs at `.claude/doc/media-platform/nestjs-backend.md`.
- Execute `start-working-on-branch-new feat/media-platform-backend-core`.
- Generate TypeORM schemas using `yarn migration:generate`.
