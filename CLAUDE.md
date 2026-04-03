# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server at http://localhost:5173
npm run dev:host         # LAN-accessible dev server (no HTTPS)
npm run dev:host:https   # LAN dev server with HTTPS (required for mobile camera)
npm run build            # Production build → dist/
npm run preview          # Serve production build locally
npm test                 # Run Vitest unit tests
```

To run a single test file:
```bash
npx vitest run src/lib/layouts.test.ts
```

## Architecture

**React 18 + Vite + TypeScript** photo booth app. Mobile-first, portrait-orientation.

### 4-Step Wizard Flow

```
LayoutStep → CaptureStep → FrameStep → ExportStep
```

`App.tsx` is the wizard shell. It owns all step-routing logic (`canNavigateTo`, `goToStep`, `handleNext`, `handleBack`) and uses the View Transitions API (`document.startViewTransition`) for directional slide animations. Auto-advance rules live here: selecting a layout jumps to capture; completing capture jumps to frames (except Fuji Instant → export directly).

### State Management

Single context: `src/store/useBoothStore.tsx` — React Context + reducer pattern. Persists to `localStorage` under key `photo-booth-state`. Old image data URLs are automatically cleared on load to prevent storage quota overflow. Derived fields (`shotsBySlot`, `isCaptureComplete`, `nextEmptySlotIndex`) are computed inside the hook.

### Data-Driven Systems

**Layouts** (`src/lib/layouts.ts`) — 8 templates (`strip-3`, `strip-4`, `hero-3`, `pairs-h/v`, `triptych-wide`, `duo-tall`, `single`, `grid-2x2`). Each slot uses normalized coordinates (0..1 range). Export dimensions are stored per-layout (1200×1600 up to 3000×4800 px).

**Frames** (`src/lib/frames.ts`) — 17 preset styles + user-created custom frames. Key properties: `borderWidthRatio`, `cornerRadiusRatio`, `backgroundColor`, `borderColor`, `overlayKind`, `shadowStrength`. `FUJI_FRAME_ID` is special: selecting it skips the frame step entirely and goes straight to export. Custom frames are stored in `useBoothStore` state and persisted to localStorage; they are merged with presets in `derived.allFrames`.

Adding a new preset layout or frame is purely a data change — no changes to rendering logic required. Custom frames can also be created in-app via the Custom Frame Builder, or imported/exported as JSON.

### Canvas Rendering

`src/lib/canvas/renderComposition.ts` — deterministic, no React. Renders the final composition at full resolution: slot images (cover-fit), frame border, decorative overlays, caption text, optional watermark. Uses a seeded RNG for consistent overlay positioning across re-renders.

`CompositionCanvasPreview.tsx` calls this renderer for the live preview with swipe navigation between shots.

### Camera

`CameraPreview.tsx` uses `getUserMedia`. Supports countdown timer (0/3/5/10s) and mirror preview toggle. Captures each shot as a data URL stored in state. Camera access requires HTTPS or localhost — use `npm run dev:host:https` for mobile testing.

## Coding Conventions

- 2-space indentation, semicolons, double quotes
- `PascalCase` components, `camelCase` functions/variables, `UPPER_SNAKE_CASE` constants
- Shared types are exported from their module (e.g., `LayoutTemplate` from `layouts.ts`)
- Non-UI logic belongs in `src/lib/`; screens in `src/screens/`; reusable UI in `src/components/`

## Testing

Vitest + React Testing Library, jsdom environment. Setup: `src/test/setup.ts`. Tests live next to source files (e.g., `src/lib/layouts.test.ts`). Focus coverage on layout math, canvas composition, and store reducer logic.

## Commit Style

Conventional Commits: `feat(layouts): add 3x1 strip template`, `fix(camera): handle permission denial on iOS`.
