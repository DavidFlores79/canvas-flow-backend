# Context Session: Canvas Flow AI Media Editing Platform (Frontend)

## Feature Description
Build a Canva-like web editor interface using Angular 20, capable of complex layer composition, real-time transformations, and seamless integration with Cloudinary and Leonardo AI. The app is multi-tenant: users belong to Organizations and Workspaces with role-based access.

## Architecture & Tech Stack
- **Framework:** Angular 20 (Strict TypeScript, Standalone Components)
- **State Management:** Angular Signals (no NgRx — signals + local stores)
- **Styling:** Tailwind CSS
- **Architecture Pattern:** Clean Architecture (UI → Domain → Business → Data layers)
- **Canvas Engine:** Fabric.js

## Multi-Tenant Auth Context
The frontend must manage the active organization context from the JWT:
- JWT contains: `sub`, `organizationId`, `orgRole` (owner|admin|member)
- **Org switching**: call `POST /auth/switch-organization`, store new tokens, reload context
- **Role-gated UI**: show/hide controls based on `orgRole` and `workspaceRole`

## Complete Implementation Roadmap

### Phase 1: Foundation & Auth Context
- Initialize Angular 20 workspace
- Setup Clean Architecture directory structure
- Configure Tailwind CSS
- Implement `AuthStore` (Signals):
  - `currentUser`, `activeOrganization`, `orgRole`, `workspaceRole`
  - Token storage and refresh logic
  - Org switch flow
- Implement `AuthGuard` and `RoleGuard` for route protection
- `OrgSwitcherComponent` — dropdown to switch active organization

### Phase 2: Organization & Workspace Shell
- **Dashboard page**: list workspaces in active org
- **WorkspaceStore**: active workspace, user's workspace role
- `WorkspaceCardComponent` — navigate to workspace
- `WorkspaceMembersComponent` — manage members (admin/owner only)
- Role-gated: hide "Create Workspace" button for `member` role without workspace create permission
- **Organization settings page**: manage org members (owner/admin only)

### Phase 3: Editor Engine & State
- `EditorStore` (Signals): `activeProject`, `layers`, `selectedLayerIds`, `historyStack`
- `CanvasComponent` — Fabric.js wrapper:
  - `ngAfterViewInit` instantiates `new fabric.Canvas('editor-canvas')`
  - Syncs Fabric events → Signal state
  - Emits on object modified, scaled, rotated
- Undo/Redo via `historyStack` in `EditorStore`
- Viewer role: canvas is read-only (Fabric.js `canvas.selection = false`)

### Phase 4: UI Panels & Tooling
- `ToolbarComponent` — tools: select, crop, rotate, text, shape
- `InspectorComponent` — bound to selected layer properties (x, y, w, h, rotation)
- `LayersPanelComponent` — z-index rearrangement (drag to reorder)
- `AssetsPanelComponent` — browse org assets, drag to canvas
- `LeonardoAIPanelComponent` — text prompt → generate image → add to canvas
- Role-gated: disable edit tools for `viewer` role

### Phase 5: API Integration
- Data Layer services call NestJS backend:
  - `OrganizationApiService`
  - `WorkspaceApiService`
  - `ProjectApiService`
  - `LayerApiService`
  - `AssetApiService`
  - `LeonardoApiService`
- Cloudinary upload widget integration
- HTTP interceptor: attach `Authorization: Bearer <token>` header

## Branch Strategy
- **Feature Branch:** `feat/media-platform-frontend-core`
- **Target Branch:** `develop`
- **PR Reviews:** 1 reviewer required

## State Management Design

```typescript
// auth.store.ts
@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly currentUser = signal<User | null>(null);
  readonly activeOrganization = signal<Organization | null>(null);
  readonly orgRole = signal<OrgRole | null>(null);

  async switchOrganization(organizationId: string): Promise<void> {
    const tokens = await this.authApi.switchOrganization(organizationId);
    this.tokenService.storeTokens(tokens);
    // reload org context from new JWT
    this.loadContextFromToken();
  }
}

// editor.store.ts
@Injectable({ providedIn: 'root' })
export class EditorStore {
  readonly activeProject = signal<Project | null>(null);
  readonly layers = signal<Layer[]>([]);
  readonly selectedLayerIds = signal<string[]>([]);
  readonly workspaceRole = signal<WorkspaceRole | null>(null);

  readonly canEdit = computed(() =>
    this.workspaceRole() === WorkspaceRole.Owner ||
    this.workspaceRole() === WorkspaceRole.Editor
  );

  private historyStack: Layer[][] = [];
  private historyIndex = -1;
}
```

## Role-Gated UI Rules

| UI Element | Owner | Admin | Member/Editor | Viewer |
|---|---|---|---|---|
| Create Workspace | ✅ | ✅ | ✅ | ❌ |
| Delete Workspace | ✅ | ✅ | ❌ | ❌ |
| Manage Org Members | ✅ | ✅ | ❌ | ❌ |
| Edit Canvas | ✅ | ✅ | ✅ (editor) | ❌ |
| Delete Project | ✅ | ✅ | ❌ | ❌ |
| View Only | ✅ | ✅ | ✅ | ✅ |

## Domain Models (Updated for Multi-Tenancy)

```typescript
// organization.model.ts
export interface Organization {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly ownerId: string;
}

// workspace.model.ts
export interface Workspace {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly ownerId: string;
}

// project.model.ts
export interface Project {
  readonly id: string;
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly version: number;
}

// layer.model.ts
export interface Layer {
  readonly id: string;
  readonly type: 'text' | 'image' | 'shape';
  readonly properties: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly rotation: number;
    readonly zIndex: number;
  };
  readonly assetId?: string;
}
```

## Testing Strategy
- Unit tests: Jasmine/Karma for stores, use-cases, services
- Mock all API services for use-case and store tests
- Target coverage: >80%

## Next Steps (Execution Phase)
1. Initialize Angular 20 workspace (separate repo: `canvas-flow-frontend`)
2. Review backend API contracts from `.claude/doc/media-platform/nestjs-backend.md`
3. Implement Phase 1 (auth context + org switching)
4. Implement Phase 2 (workspace shell)
5. Implement Phase 3 (editor engine)
6. Implement Phase 4 (UI panels)
7. Implement Phase 5 (API integration)
