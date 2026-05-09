@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: verify before coding

The stack is **Next.js 16.2.4 + React 19.2.4 + Tailwind v4 + shadcn 4**. All four have breaking changes from older versions you may recall. Before writing code that touches framework APIs, routing, server/client components, fonts, metadata, or Tailwind config, read the relevant page under `node_modules/next/dist/docs/` (entrypoints: `01-app/`, `02-guides/`, `03-api-reference/`). Heed deprecation notices.

## Commands

- `npm run dev` — start dev server on http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`); no separate typecheck script — `next build` and the `next` TS plugin handle types

## Architecture

- **App Router only.** Routes live in `app/`. `app/layout.tsx` is the root layout (currently minimal: `<html>` + `<body className="min-h-full flex flex-col">`); `app/page.tsx` is the home route.
- **Tailwind v4, CSS-first config.** There is no `tailwind.config.js`. All Tailwind setup happens in `app/globals.css` via `@import "tailwindcss"`, `@import "tw-animate-css"`, and `@import "shadcn/tailwind.css"`. PostCSS uses `@tailwindcss/postcss`. Add theme tokens / customizations in CSS, not a JS config.
- **shadcn (style: `radix-nova`, RSC-enabled).** Configured in `components.json`. Icons come from `lucide-react`. Add components with the shadcn CLI; they land in `components/ui/`.
- **Radix import shape is non-standard here.** The dependency is the umbrella `radix-ui` package (not `@radix-ui/react-*`). Primitives are imported as namespaces, e.g. `import { Slot } from "radix-ui"` then `Slot.Root` (see `components/ui/button.tsx`). Match this pattern when adding new primitives.
- **Path alias.** `@/*` maps to the repo root (`tsconfig.json`). shadcn aliases: `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`.
- **`cn()` helper** in `lib/utils.ts` wraps `clsx` + `tailwind-merge`; use it for conditional/variant class composition. Variants use `class-variance-authority` (`cva`) — see `components/ui/button.tsx` for the canonical pattern (variants + sizes + `data-slot` / `data-variant` / `data-size` attributes for styling hooks).

## Project state

The app is freshly scaffolded — `app/page.tsx` is an empty fragment, only `Button` exists in `components/ui/`. Treat early decisions (folder layout, theming approach, component conventions) as load-bearing for everything that follows.
