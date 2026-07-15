# Sirius CRM — AI Agent Guide

## Purpose
This file helps AI coding agents work effectively in the `sirius-crm` workspace.
Use it as the primary project guide for architecture, conventions, and commands.

## Key project facts
- Frontend prototype only: no backend, no API integration, all data is mock in memory.
- Built with Next.js App Router (`next` 16.2.9) and React 19.
- Uses TypeScript, Tailwind CSS, and a Dark theme UX.
- Expected stack includes: `@tanstack/react-table`, `@dnd-kit/core`, `@dnd-kit/sortable`, `recharts`, `react-hook-form`, `zod`, `sonner`, `cmdk`, `next-themes`.
- UI should be polished even as a prototype, with mobile/tablet responsiveness.

## Where the requirements live
- `CLAUDE.md` contains the full feature and design brief for the prototype.
- `README.md` is the default Next.js starter readme and not the implementation spec.

## Important conventions
- File names: `kebab-case`.
- React components: `PascalCase`.
- Functions and variables: `camelCase`.
- Prefer absolute imports from `@/`.
- No `console.log` in production code.
- Keep components small and focused: one file per component when practical.
- Use strict TypeScript types and avoid `any`.

## Core command shortcuts
- `npm run dev` — start development server
- `npm run build` — production build
- `npm run start` — run the built app
- `npm run lint` — run ESLint checks

## Project structure
- `app/` — Next.js App Router pages and layout
- `app/layout.tsx` — root shell for sidebar, topbar, theme, and global layout
- `app/page.tsx` — starter home page; likely to be replaced by the CRM dashboard or login flow
- `app/globals.css` — global styles
- `public/` — static assets

## Recommended agent behavior
- Prefer implementing features against `CLAUDE.md` rather than guessing requirements.
- Preserve any existing user-created files and only add new files when needed.
- When adding new pages/components, keep the UI consistent with the dark CRM theme and mobile-first responsiveness.
- If a feature is requested but not yet implemented, check whether `CLAUDE.md` already defines the behavior.

## Notes for future customization
- If more detailed AI guidance is needed, add a `.github/copilot-instructions.md` with examples of current code conventions and preferred response style.
- This workspace currently has no dedicated test suite or CI config; focus on build and lint workflows.
