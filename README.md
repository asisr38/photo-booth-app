# Paper Snap Photo Booth

A modular, mobile-first photo booth web app built with React + Vite + TypeScript. It guides the user through a clean 4-step flow:

1. Layout
2. Capture
3. Frame
4. Export

## Run locally

Camera APIs require a secure context (HTTPS or localhost).

1. Install dependencies:
   - `npm install`
2. Start the dev server:
   - `npm run dev`
3. Open:
   - `http://localhost:5173`

### Run on your phone (local network)

Most phones require HTTPS for camera access.

1. Install/update dependencies:
   - `yarn`
2. Start the HTTPS dev server bound to your LAN:
   - `yarn dev:host:https`
3. Find your computer's local IP (for example `192.168.x.x`)
4. On your phone (same Wi-Fi), open:
   - `https://YOUR_IP:5173`
5. If prompted, proceed past the certificate warning.

If you only need the UI (no camera), you can still use:
- `npm run dev:host`

## Project structure

Key folders and files:

- `src/App.tsx` - App shell + step routing
- `src/store/useBoothStore.tsx` - Single source of truth for booth state
- `src/lib/layouts.ts` - Layout templates + slot geometry
- `src/lib/frames.ts` - Frame style definitions
- `src/lib/canvas/renderComposition.ts` - Deterministic canvas renderer
- `src/components/*` - Reusable UI blocks
- `src/screens/*` - Step-level screens

## Extend layouts

Add a new layout in `src/lib/layouts.ts`:

- Define a unique `id`
- Set `slotCount`
- Provide `slotRects` in normalized coordinates (0..1)
- Provide an `exportSize`

Each slot rect uses:

- `x`, `y` - top-left origin
- `w`, `h` - width/height

## Extend frames

Add a new frame style in `src/lib/frames.ts`:

- `borderWidthRatio` and `cornerRadiusRatio` scale with export size
- `backgroundColor` and `borderColor` control the main look
- `overlayKind` determines subtle overlays (bubbles, sprinkles, ribbon, sparkle, sticker, etc.)

## Notes

- Captures are stored as data URLs for simplicity.
- The final export uses an offscreen canvas and re-renders at the target resolution.
- State is persisted to `localStorage` under `photo-booth-state`.
- The UI is mobile-first: sticky step actions, scrollable stepper on small screens, and larger tap targets.
- Flow is optimized for mobile: layout selection auto-advances, each shot has a confirm/retake step, and finishing capture auto-advances to frames.
- Downloads are gated behind a valid email entry on the export screen.
