# Repository Guidelines

## Project Structure & Module Organization
- App entry points: `App.tsx`, `index.ts`.
- Source code: `src/`
  - Screens (React components): `src/screens/` (e.g., `MapScreen.tsx`).
  - Services (APIs, data): `src/services/` (e.g., `googlePlaces.ts`).
- Static assets: `assets/` (icons, splash, favicon).
- Config: `app.json`, TypeScript config `tsconfig.json` (strict mode enabled).

## Build, Test, and Development Commands
- Install dependencies: `npm install`.
- Start Metro/Expo dev server: `npm run start`.
- Launch platform targets: `npm run ios`, `npm run android`, `npm run web`.
- Notes: No test script is configured yet; see Testing Guidelines to add one.

## Coding Style & Naming Conventions
- Language: TypeScript (strict). Prefer explicit types and avoid `any`.
- Components: Functional components with hooks; one component per file when possible.
- Indentation: 2 spaces; use single quotes; include semicolons to match existing files.
- Naming: PascalCase for React components/screens (e.g., `MapScreen.tsx`); camelCase for variables/functions; service modules in `src/services/` use camelCase filenames (e.g., `googlePlaces.ts`).
- Imports: External packages first, then internal modules from `src/...`.

## Testing Guidelines
- Recommended stack (not yet configured): Jest + `@testing-library/react-native`.
- Test locations: `src/__tests__/`; co-locate small unit tests next to modules when helpful.
- Naming: `*.test.ts` / `*.test.tsx`.
- Scope: Aim for tests on services (API mapping, error paths) and screen logic (hooks/state) with mocked modules.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- Commit messages: imperative, concise, include scope when useful (e.g., `feat(services): add Google Places mapper`).
- PRs: clear description, rationale, screenshots/GIFs for UI changes, steps to test, and linked issues.

## Security & Configuration Tips
- Configure `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` (used in `src/services/googlePlaces.ts`). Do not commit secrets.
- For local dev, export the var in your shell or use a `.env` loaded by your tooling; for CI/EAS, store as a secret. Restrict keys to required APIs and platforms.

## Agent-Specific Notes
- Keep changes focused and consistent with the current structure and naming.
- Avoid unrelated refactors; update this file when conventions evolve.
