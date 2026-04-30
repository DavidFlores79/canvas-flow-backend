# Context Session: AI Media Editing Platform (Frontend)

## Feature Description
Build a Canva-like web editor interface using Angular 20, capable of complex layer composition, real-time transformations, and seamless integration with Cloudinary and Leonardo AI.

## Architecture & Tech Stack
- **Framework:** Angular 20 (Strict TypeScript, Standalone Components)
- **State Management:** Angular Signals integrated with local stores
- **Styling:** Tailwind CSS
- **Architecture Pattern:** Clean Architecture
- **Canvas Engine:** Fabric.js

## Finalized Strategy
- **Canvas Rendering Engine:** Fabric.js.
- **State Management:** Angular Signals for maximum performance and minimal boilerplate during real-time dragging/resizing.

## Complete Implementation Roadmap

### Phase 1: Foundation & Clean Architecture
- Initialize Angular 20 workspace.
- Setup Presentation, Domain, Business, and Data layer directories.
- Configure Tailwind CSS.

### Phase 2: Editor Engine & State
- Setup `EditorStore` using Angular Signals to manage the active project and `historyStack`.
- Build the `CanvasComponent` wrapper for Fabric.js, hooking up `ngAfterViewInit` and syncing Fabric events to the Angular Signal state.

### Phase 3: UI Panels & Tooling
- Implement `ToolbarComponent` for classic tools (crop, rotate, filters).
- Implement `InspectorComponent` bound to the active selected layer properties.
- Implement `LayersPanelComponent` to rearrange z-index.

### Phase 4: API Integration
- Build Data Layer Services to interact with NestJS backend.
- Connect Cloudinary upload widget.
- Connect Leonardo AI generation UI panel.

## Branch Strategy & Naming
- **Feature Branch:** `feat/media-platform-frontend-core`
- **Target Branch:** `develop`

## File Structure & Component Organization
- **Presentation:** `feature/presentation/components/`, `pages/`
- **Domain:** `feature/domain/models/`, `repositories/`, `dtos/`
- **Business:** `feature/business/use-cases/`, `state/`
- **Data:** `feature/data/services/`

## Next Steps (Execution Phase)
- Review the detailed technical specs at `.claude/doc/media-platform/angular-frontend.md`.
- Initialize new Angular workspace.
- Setup Fabric.js integration.
