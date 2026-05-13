<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md

This file provides guidance to Codex when working with code in this repository.

## Critical: verify before coding

The stack is **Next.js 16.2.4 + React 19.2.4 + Tailwind v4 + shadcn 4**. All four have breaking changes from older versions you may recall. Before writing code that touches framework APIs (routing, server/client components, fonts, metadata, caching, route handlers) or Tailwind theme/config, read the relevant page under `node_modules/next/dist/docs/` — `01-app/01-getting-started/` is the practical entrypoint. Heed deprecation notices.

## Commands

- `npm run dev` — start dev server on http://localhost:3000
- `npm run build` — production build (also runs the TS check via the `next` plugin)
- `npm run start` — serve the production build
- `npm run lint` — ESLint flat config (`eslint.config.mjs`); no separate typecheck script

## Architecture

### App Router + RSC boundaries

Routes live in `app/`. Current routes: `/` (Foody feed, `app/page.tsx`) and `/search` (`app/search/page.tsx`).

**Two valid `page.tsx` shapes coexist — pick by how interconnected the state is:**
- `app/page.tsx` is `'use client'` because `feedTab` is read by the header and would otherwise need a context. State is hoisted.
- `app/search/page.tsx` is RSC. Each piece of state (search query, recent list) is local to its island under `components/search/`. No state crosses island boundaries.

**Push `'use client'` as far down the tree as possible.** Most leaf visuals (`background-blobs`, `glass-surface`, `user-avatar`, `dish-photo`, `feed-header`, `section-header`) are RSC; only components with local `useState`/handlers (`post-card`, `bottom-tab-bar`, `search-header`, `recent-searches`, `popular-tags`, `category-picker`) are client.

### Navigation

`BottomTabBar` (`components/feed/bottom-tab-bar.tsx`) is shared by every route. The active tab is derived from `usePathname()` — **do not re-introduce an `active`/`onChange` controlled API.** Route-bound tabs render as `next/link`; stubs for routes that don't exist yet (`add`, `saved`, `me`) stay as `<button>`. To add a new route to the bar, set its `href` in the `TABS` array.

### Tailwind v4, CSS-first

There is no `tailwind.config.js`. All setup is in `app/globals.css`:
- `@import "tailwindcss"`, `@import "tw-animate-css"`, `@import "shadcn/tailwind.css"`
- `@theme inline { --font-sans: var(--font-inter), … }` — wires `next/font` Inter into Tailwind's font-sans.
- `@utility hide-scroll { … }` — custom v4 utility for the snap-scroll feed (Radix `ScrollArea` was deliberately avoided here because it conflicts with native `scroll-snap`).

Add theme tokens / utilities in CSS, not a JS config. v4 supports fractional spacing units in arbitrary classes — e.g. `pt-12.5` resolves to `padding-top: 3.125rem`.

### shadcn

`components.json`: style `radix-nova`, RSC-enabled, icons `lucide-react`, base color `neutral`. Installed: `button`, `avatar`, `scroll-area`. Add more with `npx shadcn@latest add <name> --yes`; they land in `components/ui/`.

**Radix import shape is non-standard.** The dep is the umbrella `radix-ui` package (not `@radix-ui/react-*`). Primitives are imported as namespaces:

```tsx
import { Slot } from "radix-ui"
// then: <Slot.Root />
```

See `components/ui/button.tsx`, `avatar.tsx`, `scroll-area.tsx`. Match this pattern when adding new primitives.

### Path alias + `cn()`

`@/*` maps to the repo root (`tsconfig.json`). shadcn aliases: `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`. The `cn()` helper in `lib/utils.ts` wraps `clsx` + `tailwind-merge`. Variants use `class-variance-authority` (`cva`) with `data-slot` / `data-variant` / `data-size` attributes — see `components/ui/button.tsx` for the canonical pattern.

### Domain components & "Liquid Glass + Flat" visual language

Per-screen components live in feature subfolders: `components/feed/`, `components/search/`. Mirror this when adding a new screen. Cross-screen primitives (e.g. `GlassSurface`) live under `components/feed/` for now — promote to `components/` only when a third consumer appears.

Visual conventions:
- `GlassSurface` (`components/feed/glass-surface.tsx`) is the reusable backdrop-blur + inset-highlight shell — use it for any new "liquid glass" surface (header, tab bar, etc.) instead of re-creating the effect inline.
- **Inline `style` is allowed only for dynamic values** (brand color from props, gradient angles computed from a seed, dynamically sized fonts). Static visuals must be Tailwind classes — including arbitrary-value utilities like `shadow-[inset_1px_1px_0_rgba(...)]` and `backdrop-blur-[22px]`. There is no project-wide `--brand` CSS variable; brand color flows from `lib/mock-data.ts → DEFAULT_TWEAKS` through props (the `Tweaks` shape is the design's tweakable surface area).
- Russian UI copy is canonical. Inter is loaded via `next/font/google` with both `cyrillic` and `latin` subsets in `app/layout.tsx` — keep both subsets when changing the font setup.

### Mock data

`lib/mock-data.ts` exports `POSTS`, `POPULAR_TAGS`, `RECENT_SEARCHES`, the `Post` / `Palette` / `Density` / `Tweaks` types, and `DEFAULT_TWEAKS`. When fetching real data later, preserve these types — components consume them directly.

### Out of scope

`source/` contains the Claude-design originals (`FeedScreen.jsx`, `Main Screen.html`) used as a visual + structural reference during the refactor. It is not part of the build and should not be imported. The owner removes it manually after review — don't delete it autonomously.
