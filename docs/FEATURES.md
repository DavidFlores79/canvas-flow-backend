# Features — Canvas Flow

Progressive feature rollout organized by tier and capability area.

---

## Tier 1 — Core Foundation

### Secure Upload & Asset Management
- [x] Cloudinary signed upload URL generation (server-side, short-lived)
- [x] Direct client-to-Cloudinary upload (no binary proxy)
- [x] Asset registration after upload (metadata persistence)
- [x] Asset listing with pagination and filters (type, folder, tags, date)
- [x] Asset versioning (every edit creates a new version)
- [x] Version restore
- [x] Asset duplication
- [x] Batch asset operations (delete, move, tag)
- [x] Folder hierarchy for asset organization
- [x] Auto-format and auto-quality delivery via Cloudinary CDN
- [x] Asset soft-delete and archive

### Authentication & Users
- [x] Email + password sign-up / sign-in
- [x] JWT access tokens (15 min) + refresh tokens (7 days)
- [x] Token refresh without re-login
- [x] Password recovery via email
- [x] Phone number verification via SMS OTP (Twilio)
- [x] User profile management (name, avatar, preferences)
- [x] Account deletion

### Organizations & Workspaces
- [x] Organization creation and settings
- [x] Workspace creation within org
- [x] Member invitation by email
- [x] Role-based access: Owner, Admin, Editor, Viewer
- [x] Member removal

---

## Tier 2 — Classic Editing Tools

### Basic Editing Operations
- [ ] Crop (freeform, preset ratios: 1:1, 16:9, 4:3, 9:16, A4)
- [ ] Resize canvas (pixel dimensions or preset)
- [ ] Rotate (90°, 180°, 270°, free angle)
- [ ] Flip horizontal / vertical
- [ ] Brightness / Contrast adjustment (slider)
- [ ] Saturation / Vibrance adjustment
- [ ] Blur (Gaussian, strength control)
- [ ] Sharpen (strength control)
- [ ] Grayscale conversion
- [ ] Sepia tone
- [ ] Color temperature adjustment
- [ ] Hue shift
- [ ] Vignette effect
- [ ] Background color fill

### Canvas & Layer System
- [ ] Multi-layer canvas (image, text, shape, sticker, video layers)
- [ ] Layer visibility toggle
- [ ] Layer lock/unlock
- [ ] Layer rename
- [ ] Layer reorder (drag-and-drop)
- [ ] Layer duplication
- [ ] Layer deletion
- [ ] Layer grouping
- [ ] Opacity control per layer
- [ ] Blend mode per layer (Normal, Multiply, Screen, Overlay, Darken, Lighten, Soft Light, Hard Light, Difference, Exclusion)

### Text Overlays
- [ ] Add text layer to canvas
- [ ] Font family selection (Google Fonts + custom uploads)
- [ ] Font size, weight, style (bold, italic, underline)
- [ ] Letter spacing / line height
- [ ] Text color (solid, gradient)
- [ ] Text alignment (left, center, right, justify)
- [ ] Text shadow
- [ ] Text stroke / outline
- [ ] Text background box
- [ ] Curved text

### Shapes & Stickers
- [ ] Basic shapes (rectangle, circle, triangle, polygon, star, arrow)
- [ ] Shape fill color (solid, gradient, pattern)
- [ ] Shape stroke (color, width, dash style)
- [ ] Corner radius for rectangles
- [ ] Sticker library (decorative elements, emojis)
- [ ] Logo/brand asset overlay

### Project Management
- [ ] Create project with canvas size presets
- [ ] Project naming and tagging
- [ ] Project duplication
- [ ] Project delete (with confirmation)
- [ ] Project listing with thumbnails
- [ ] Project search and filter
- [ ] Project sharing (view link)

### History / Undo-Redo
- [ ] Client-side undo/redo stack (50 steps)
- [ ] Server-side project version history
- [ ] Restore to named version
- [ ] Auto-save every 30 seconds

---

## Tier 3 — Advanced Layer Composition

### Masks & Clipping
- [ ] Layer clipping mask
- [ ] Alpha channel mask
- [ ] Shape mask (clip layer to shape)
- [ ] Image mask (clip using another image's luminance)

### Advanced Effects
- [ ] Drop shadow (x, y, blur, spread, color, opacity)
- [ ] Inner shadow
- [ ] Outer glow / inner glow
- [ ] Bevel and emboss
- [ ] Color overlay
- [ ] Gradient overlay
- [ ] Pattern overlay

### Watermarking
- [ ] Apply org logo watermark to exports
- [ ] Watermark position, opacity, and size controls
- [ ] Repeating tile watermark option
- [ ] Conditional watermark (remove for premium exports)

### Advanced Text
- [ ] Text on path (follow a curve)
- [ ] Text inside shape
- [ ] Rich text with mixed styles per word

---

## Tier 4 — Document Scanning & OCR

### Document Scanning Workflow
- [ ] Upload physical document photo
- [ ] Auto edge detection (Cloudinary)
- [ ] Perspective correction / deskew
- [ ] Contrast enhancement for document clarity
- [ ] Multi-page document assembly

### OCR Extraction
- [ ] Full-page text extraction (Cloudinary adv_ocr)
- [ ] Structured data detection (tables, columns)
- [ ] Bounding box visualization of extracted text regions
- [ ] Editable extracted text output
- [ ] Export extracted text as plain text or JSON

### PDF Workflows
- [ ] Convert scanned image to PDF
- [ ] Multi-image to multi-page PDF
- [ ] PDF compression
- [ ] PDF page extraction (render specific page as image)
- [ ] Export canvas as PDF (single/multi-page)

---

## Tier 5 — AI-Assisted Background Workflows

### Background Removal
- [ ] One-click background removal (Cloudinary AI)
- [ ] Refined edge mask preview
- [ ] Apply transparent background (PNG)
- [ ] Apply solid color background after removal
- [ ] Apply gradient background after removal

### Background Replacement
- [ ] Remove background + replace with uploaded image
- [ ] Remove background + replace with AI-generated background (Leonardo)
- [ ] Background prompt input ("beach at sunset", "modern office interior")
- [ ] Background variation generation (multiple options)

### Background Generation
- [ ] Generate entirely new background from text prompt
- [ ] Style control (photorealistic, illustration, abstract)
- [ ] Generate multiple background variations
- [ ] Preview and select before applying

---

## Tier 6 — Smart AI Enhancement

### Auto Enhancement
- [ ] One-click auto enhance (Cloudinary viesus_correct)
- [ ] AI-powered upscaling (2x, 4x) — Cloudinary / Leonardo
- [ ] AI denoising
- [ ] AI image restoration (remove artifacts, enhance old photos)
- [ ] Super resolution
- [ ] Face enhancement / skin smoothing (optional)

### Generative Operations (Leonardo AI)
- [ ] Text-to-image generation with prompt
- [ ] Image-to-image transformation (style/content transfer)
- [ ] Inpainting — fill selected masked region with generated content
- [ ] Outpainting — extend canvas edges with generated content
- [ ] Generative fill (Cloudinary gen_fill)
- [ ] Object removal with AI fill (Cloudinary gen_remove)
- [ ] Object replacement via prompt
- [ ] Style transfer (apply artistic style of reference image)
- [ ] Creative variation generation (N variations from one input)
- [ ] Prompt-driven reconstruction

---

## Tier 7 — Templates & Export

### Template System
- [ ] Platform template gallery (50+ templates at launch)
- [ ] Template categories: social media, presentation, marketing, document, certificate, card
- [ ] Size presets per category (Instagram Post, Story, LinkedIn, YouTube Thumbnail, A4, etc.)
- [ ] Instantiate template as new project
- [ ] Save current project as custom template
- [ ] Template sharing within organization
- [ ] Template tagging and search

### Export Center
- [ ] Export as PNG (transparent background support)
- [ ] Export as JPG (quality control)
- [ ] Export as WebP (quality control)
- [ ] Export as PDF (single / multi-page)
- [ ] Export as ZIP (bundle of multiple formats/sizes)
- [ ] Export with custom dimensions (override canvas size)
- [ ] Export presets (social media, print, web)
- [ ] Watermark toggle for exports
- [ ] Export history (download previous exports)
- [ ] Signed, time-limited download URLs

---

## Tier 8 — Collaboration & Permissions

### Real-Time Collaboration
- [ ] Multi-user editor presence (see who is editing)
- [ ] Layer locking (prevent concurrent edits to same layer)
- [ ] Live save indicator
- [ ] Comment system on projects
- [ ] Comment @mention notifications
- [ ] Resolve/unresolve comments

### Role-Based Permissions
- [ ] Owner: full control including billing and deletion
- [ ] Admin: manage members, projects, templates
- [ ] Editor: create and edit projects, upload assets
- [ ] Viewer: view and comment only, no edit
- [ ] Per-workspace role assignment
- [ ] Per-project sharing override (share with specific user as viewer)

---

## Tier 9 — Billing & Subscriptions

### Subscription Plans
- [ ] Free: 5 projects, 500 MB storage, 10 AI credits/month
- [ ] Starter: 20 projects, 5 GB storage, 50 AI credits/month
- [ ] Pro: unlimited projects, 50 GB storage, 200 AI credits/month
- [ ] Business: unlimited everything, 500 AI credits/month, team seats
- [ ] Enterprise: custom limits, SSO, SLA

### Credit System
- [ ] Credit balance display
- [ ] Credit deduction per AI operation
- [ ] Credit purchase (top-up packs)
- [ ] Credit usage history
- [ ] Low credit warning notification
- [ ] Refund on failed AI jobs

### Usage Metering
- [ ] Storage usage tracking per org
- [ ] API call tracking per org
- [ ] Export count tracking
- [ ] AI generation count tracking
- [ ] Monthly usage summary

---

## Tier 10 — Analytics, Audit & Admin

### Analytics Dashboard
- [ ] Assets uploaded over time
- [ ] Storage usage trend
- [ ] AI credits consumed breakdown
- [ ] Active users per workspace
- [ ] Export activity
- [ ] Most-used templates

### Audit Logs
- [ ] Immutable log of all significant actions
- [ ] Filter by user, action type, date range
- [ ] Export audit log as CSV

### Admin Tools
- [ ] User management (view, suspend, delete)
- [ ] Organization management
- [ ] Manual credit grants
- [ ] Platform-wide analytics
- [ ] Job queue monitoring
- [ ] Feature flag management (future)

---

## Future Roadmap

| Feature | Notes |
|---|---|
| Mobile app (React Native / Flutter) | View, comment, basic edit |
| Real-time cursor sharing | Full multi-user collaborative editing |
| OpenAI DALL-E 3 integration | Alternative text-to-image |
| Stability AI integration | Alternative generation engine |
| Replicate custom models | Self-hosted ML inference |
| Video editor | Timeline-based video editing |
| Brand kit | Org-level fonts, colors, logos |
| Custom AI model fine-tuning | Train on org's brand assets |
| Figma import | Import .fig files as projects |
| Canva import | Import .canva files |
| API access tier | Developer API with OAuth |
| White-label / embed | Embeddable editor for third-party apps |
