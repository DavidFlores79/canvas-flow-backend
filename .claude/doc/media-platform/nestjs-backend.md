# NestJS Backend Implementation Plan: Media Editing Platform

## 1. Database Schema Design (MongoDB)
All collections use camelCase for properties and are managed via Mongoose schemas.

**Collection: `organizations`**
- `_id` (ObjectId)
- `name` (String)
- `created_at` (Date, auto)
- `updated_at` (Date, auto)

**Collection: `workspaces`**
- `_id` (ObjectId)
- `organization_id` (ObjectId)
- `name` (String)

**Collection: `projects`**
- `_id` (ObjectId)
- `workspace_id` (ObjectId)
- `name` (String)
- `width` (Number)
- `height` (Number)
- `version` (Number) - Optimistic locking
- `created_at` (Date, auto)
- `updated_at` (Date, auto)

**Collection: `assets`**
- `_id` (ObjectId)
- `workspace_id` (ObjectId)
- `cloudinary_public_id` (String)
- `url` (String)
- `type` (String) - image, video, document
- `metadata` (Map/Object)

**Collection: `layers`**
- `_id` (ObjectId)
- `project_id` (ObjectId)
- `asset_id` (ObjectId, optional)
- `type` (String) - text, image, shape
- `properties` (Map/Object) - x, y, width, height, rotation, z-index

## 2. File Structure & Paths to Create

```
src/
  organizations/
    OrganizationsModule.ts
    schemas/OrganizationSchema.ts
    dto/CreateOrganizationDto.ts, OrganizationDto.ts
    service/OrganizationService.ts, OrganizationService.spec.ts
    controller/OrganizationController.ts, OrganizationController.spec.ts
  workspaces/
    WorkspacesModule.ts
    schemas/WorkspaceSchema.ts
    ...
  projects/
    ProjectsModule.ts
    schemas/ProjectSchema.ts
    ...
  assets/
    AssetsModule.ts
    schemas/AssetSchema.ts
    ...
  layers/
    LayersModule.ts
    schemas/LayerSchema.ts
    ...
  cloudinary/
    CloudinaryModule.ts
    service/CloudinaryService.ts
    controller/CloudinaryWebhookController.ts
  leonardo/
    LeonardoModule.ts
    service/LeonardoService.ts
```

## 3. Implementation Details

**Module Pattern**
Use the standard pattern from `src/users/`.
Example Schema (`src/projects/schemas/ProjectSchema.ts`):
```typescript
// ABOUTME: Project schema representing a canvas project
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Project {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  workspace_id: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Number, default: 0 })
  version: number;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
```

**Services**
- Inject Mongoose Models using `@InjectModel()`.
- Use Mongoose transactions for complex creation if necessary.

**Error Handling**
- Throw `NotFoundEntityError` if a project isn't found.
- Throw `DuplicateEntityError` for unique constraint violations (code 11000).
- Throw `OutdatedEntityVersionError` if `version` mismatch during update.

## 4. Testing Requirements
- **Service Tests**: Mock Mongoose Model.
- **Controller Tests**: Mock Service. Test pagination and DTO validation.
- Target coverage: >80%
