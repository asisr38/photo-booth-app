# Repository Guidelines

## Project Structure & Module Organization
- Entry points: `index.html` and `src/main.tsx`.
- App shell and UI: `src/App.jsx` with global styles in `src/styles.css`.
- Layout templates: `src/lib/layouts.ts`.
- Frame definitions: `src/lib/frames.ts`.
- Canvas rendering and composition: `src/lib/canvas/renderComposition.ts`.
- Static references (images, etc.): `src/ref/`.
- There is no dedicated `tests/` directory yet.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start the Vite dev server at `http://localhost:5173`.
- `npm run build`: create a production build in `dist/`.
- `npm run preview`: serve the production build locally.

## Coding Style & Naming Conventions
- Match current style: 2-space indentation, semicolons, and double quotes.
- Prefer small, focused modules under `src/lib/` for non-UI logic.
- Use `PascalCase` for React components (example: `App`).
- Use `camelCase` for functions and variables (example: `drawImageCover`).
- Use `UPPER_SNAKE_CASE` for constants (example: `PRINT_WIDTH`).
- In TypeScript, define explicit exported types for shared shapes (example: `LayoutTemplate`).

## Testing Guidelines
- No test runner is configured in `package.json` yet.
- If adding tests, prefer Vitest with React Testing Library.
- Keep unit tests near the source (example: `src/lib/layouts.test.ts`).
- Focus test coverage on layout math and canvas composition behavior.

## Commit & Pull Request Guidelines
- Git history is not available in this workspace, so follow Conventional Commits.
- Example commit: `feat(layouts): add 3x1 strip template`.
- PRs should state what changed, why it changed, and how to test it.
- Include screenshots or short GIFs for UI or rendering changes.

## Security & Configuration Tips
- Camera access requires a secure context: HTTPS or `localhost`.
- Prefer `ideal` media constraints and handle permission denial gracefully.
