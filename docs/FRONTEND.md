# Frontend — Canvas Flow (Angular 20)

> Repo: `canvas-flow-frontend`

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | Angular 20 (standalone components) |
| State Management | Angular Signals + NgRx (feature stores) |
| Styling | Tailwind CSS |
| Canvas Rendering | Fabric.js / Konva.js |
| HTTP | Angular `HttpClient` + interceptors |
| WebSocket | `@angular/cdk` + native WebSocket |
| Forms | Reactive Forms (strict typing) |
| Testing | Jest + Testing Library |
| E2E | Playwright |
| Build | Vite (Angular builder) |

---

## Application Architecture

Follows **Clean Architecture** with 4 layers:

```
src/app/
├── ui/           # Presentational components, layout, design system
├── domain/       # Interfaces, models, enums (no framework dependency)
├── business/     # Use cases, state management, application logic
└── data/         # Services, API clients, repositories
```

---

## Module Structure

```
src/app/
├── core/                    # App-wide singletons (auth, interceptors, guards)
├── shared/                  # Reusable components, pipes, directives
├── layout/                  # Shell, sidebar, header, nav
│
├── features/
│   ├── auth/                # Sign-in, sign-up, password recovery
│   ├── dashboard/           # Home, recent projects, quick actions
│   ├── editor/              # Canva-like editor (main feature)
│   ├── assets/              # Asset library and manager
│   ├── templates/           # Template gallery and browser
│   ├── projects/            # Project manager, listing, settings
│   ├── workspaces/          # Workspace management
│   ├── organizations/       # Org settings, member management
│   ├── billing/             # Plans, credits, invoices
│   ├── export/              # Export center
│   ├── analytics/           # Usage and insights dashboard
│   └── admin/               # Admin tools (role: admin only)
```

---

## Editor Feature — Architecture

The editor is the core feature. It is built as a self-contained feature module.

```
features/editor/
├── canvas/                  # Canvas rendering engine (Fabric.js wrapper)
├── layers/                  # Layers panel + layer management
├── toolbar/                 # Top toolbar controls
├── inspector/               # Right panel: transform, style, effects inspector
├── filters-panel/           # Filters and color adjustments panel
├── ai-tools-panel/          # AI operations panel (generate, enhance, remove BG)
├── asset-library/           # Left panel: assets browser
├── history/                 # Undo/redo history panel
├── templates-gallery/       # Template picker
├── export-center/           # Export dialog
└── state/                   # NgRx or Signals store for editor state
```

### Canvas Component

Wraps **Fabric.js** (or Konva.js) for DOM-independent rendering:

```typescript
@Component({
  selector: 'cf-canvas',
  standalone: true,
  template: `<canvas #canvasEl></canvas>`,
})
export class CanvasComponent implements OnInit, OnDestroy {
  @Input() projectId: string;
  private canvas: fabric.Canvas;

  // Integrates with EditorStore (Signals)
  protected editorStore = inject(EditorStore);
}
```

### Editor State (Angular Signals)

```typescript
// EditorStore — Signal-based
export class EditorStore {
  // State
  readonly layers = signal<Layer[]>([]);
  readonly selectedLayerIds = signal<string[]>([]);
  readonly historyStack = signal<HistoryEntry[]>([]);
  readonly historyIndex = signal<number>(-1);
  readonly canvasConfig = signal<CanvasConfig | null>(null);
  readonly activeToolId = signal<ToolId>('select');
  readonly zoom = signal<number>(1);
  readonly isDirty = signal<boolean>(false);

  // Computed
  readonly selectedLayers = computed(() =>
    this.layers().filter(l => this.selectedLayerIds().includes(l.id))
  );
  readonly canUndo = computed(() => this.historyIndex() > 0);
  readonly canRedo = computed(() => this.historyIndex() < this.historyStack().length - 1);
}
```

---

## Components Reference

### Layout Components

| Component | Description |
|---|---|
| `AppShellComponent` | Root layout shell |
| `SidebarComponent` | Navigation sidebar |
| `HeaderComponent` | Top navigation bar |
| `BreadcrumbComponent` | Page breadcrumb trail |

### Editor Components

| Component | Description |
|---|---|
| `CanvasComponent` | Core Fabric.js canvas wrapper |
| `LayersPanelComponent` | Layer list with drag-and-drop reorder |
| `LayerItemComponent` | Individual layer row (visibility, lock, rename) |
| `ToolbarComponent` | Top toolbar (tool selection, zoom, undo/redo) |
| `TransformInspectorComponent` | X/Y/W/H/rotation/flip controls |
| `StyleInspectorComponent` | Fill, stroke, opacity, blend mode |
| `EffectsInspectorComponent` | Shadows, glows, filters |
| `FiltersPanelComponent` | Brightness, contrast, saturation, blur, sharpen |
| `AiToolsPanelComponent` | Generate, enhance, remove BG, fill, outpaint |
| `AssetLibraryComponent` | Uploaded assets, drag to canvas |
| `TemplatePickerComponent` | Browse and apply templates |
| `HistoryPanelComponent` | Undo/redo step list |
| `ExportDialogComponent` | Format, size, quality export controls |
| `TextEditorOverlayComponent` | Inline text editing on canvas |
| `ColorPickerComponent` | Color swatch + hex/RGB/HSL input |
| `FontPickerComponent` | Font family, size, weight, spacing |

### Asset Components

| Component | Description |
|---|---|
| `AssetGridComponent` | Grid view of assets with lazy loading |
| `AssetCardComponent` | Individual asset thumbnail card |
| `AssetUploadZoneComponent` | Drag-and-drop upload area |
| `AssetDetailDrawerComponent` | Slide-in asset metadata panel |
| `FolderTreeComponent` | Hierarchical folder browser |

### Project Components

| Component | Description |
|---|---|
| `ProjectCardComponent` | Project thumbnail card |
| `ProjectGridComponent` | Masonry/grid project listing |
| `ProjectSettingsModalComponent` | Name, tags, canvas size settings |

---

## Drag-and-Drop

Uses `@angular/cdk/drag-drop` for:
- Layer reordering in layers panel
- Asset drag from library to canvas
- Canvas element repositioning (delegated to Fabric.js)

---

## History / Undo-Redo

Client-side history stack managed in `EditorStore`:

```
[action: ADD_LAYER]     → push snapshot to historyStack, increment index
[action: UNDO]          → decrement index, restore snapshot
[action: REDO]          → increment index, restore snapshot
[action: SAVE]          → persist current state to backend
```

Server-side project history (via `ProjectsModule`) stores named versions for restore-to-version functionality.

---

## Real-Time Collaboration

WebSocket connection to `EditorSessionsModule`:

- Presence indicators (active editors per project)
- Layer lock/unlock events
- Cursor position broadcasting (future)
- Auto-save heartbeat every 30s

---

## Responsive Image Delivery

Cloudinary-powered responsive images via `srcset`:

```typescript
@Pipe({ name: 'cloudinaryResponsive', standalone: true })
export class CloudinaryResponsivePipe implements PipeTransform {
  transform(publicId: string, widths = [320, 640, 1280]): string {
    return widths
      .map(w => `${buildCloudinaryUrl(publicId, { width: w })} ${w}w`)
      .join(', ');
  }
}
```

---

## HTTP Interceptors

| Interceptor | Responsibility |
|---|---|
| `AuthInterceptor` | Attach `Authorization: Bearer <token>` header |
| `RefreshTokenInterceptor` | Auto-refresh expired access tokens |
| `ErrorInterceptor` | Global error toast + Sentry capture |
| `LoadingInterceptor` | Global loading state signal |

---

## Route Guards

| Guard | Protects |
|---|---|
| `AuthGuard` | All authenticated routes |
| `RoleGuard` | Admin-only routes |
| `WorkspaceMemberGuard` | Workspace-scoped routes |
| `EditorGuard` | Editor route — loads project + session |
| `BillingGuard` | Premium feature routes |

---

## Lazy Loading Strategy

All feature modules are lazy-loaded:

```typescript
const routes: Routes = [
  { path: 'editor/:id', loadComponent: () => import('./features/editor/EditorPage') },
  { path: 'assets',     loadComponent: () => import('./features/assets/AssetsPage') },
  { path: 'billing',    loadComponent: () => import('./features/billing/BillingPage') },
  // ...
];
```

---

## AI Tools Panel — UX Flow

```
User selects tool: "Generate Image"
  → Prompt input (text)
  → Style / model selector
  → Aspect ratio picker
  → [Generate] button
      → POST /ai-pipelines/generate
      ← jobId
      → Poll / WebSocket for completion
      ← Asset ready
      → Add to canvas as new layer
```

```
User selects tool: "Remove Background"
  → Select layer (must be image)
  → [Remove BG] button
      → POST /ai-pipelines (type: background-removal)
      ← Preview result
      → [Apply] or [Discard]
```

---

## Export Center — UX Flow

```
[Export] button
  → Export dialog opens
  → Select format: PNG / JPG / WebP / PDF / ZIP
  → Select size preset or custom dimensions
  → Select quality (lossy formats)
  → [Export] button
      → POST /export-pipelines
      ← jobId
      → Progress indicator
      ← Download URL (signed, time-limited)
      → Auto-download or [Download] button
```

---

## Testing

```bash
# Unit tests (Jest)
yarn test

# Coverage
yarn test:cov      # Minimum 80% required

# E2E (Playwright)
yarn e2e
```

**Test patterns:**
- Components: Testing Library `render()` + user-event
- Stores: unit test signal mutations directly
- Services: mock `HttpClient` with `HttpClientTestingModule`
- E2E: Playwright page objects per feature
