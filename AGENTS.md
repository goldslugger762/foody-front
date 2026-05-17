<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md

This file provides guidance to Codex when working with code in this repository.

## Critical: verify before coding

The stack is **Next.js 16.2.4 + React 19.2.4 + Tailwind v4 + shadcn 4 + motion**. All five have breaking changes or conventions that may differ from older versions. Before writing code that touches framework APIs (routing, server/client components, fonts, metadata, caching, route handlers) or Tailwind theme/config, read the relevant page under `node_modules/next/dist/docs/` — `01-app/01-getting-started/` is the practical entrypoint. Heed deprecation notices.

Next 16 specifics already used in this codebase:
- Page `params`/`searchParams` and Route Handler context `params` are promises. Await them before reading values, matching `app/search/results/page.tsx` and dynamic `app/api/**/[param]/route.ts` files.
- Route Handlers use Web `Request`/`Response` APIs. `GET` handlers are not cached by default; only opt into caching deliberately.

## Commands

- `npm run dev` — start dev server on http://localhost:3000
- `npm run build` — production build (also runs the TS check via the `next` plugin)
- `npm run start` — serve the production build
- `npm run lint` — ESLint flat config (`eslint.config.mjs`); no separate typecheck script

## Architecture

### App shell

`app/layout.tsx` owns the shared mobile-app shell:
- `BackgroundBlobs` renders the global palette backdrop from `DEFAULT_TWEAKS.palette`.
- `PageTransition` wraps every route and animates route changes with `motion`.
- `BottomTabBar` is rendered once globally and receives `DEFAULT_TWEAKS.brand`.
- Inter and Roboto are loaded with both `latin` and `cyrillic` subsets. Inter is wired into Tailwind's `font-sans`; Roboto is available through `var(--font-roboto)`.

Keep route pages focused on their screen content. Do not duplicate the global background, page-transition wrapper, or bottom nav inside individual routes.

### Routes

Routes live in `app/`:
- `/` (`app/page.tsx`) — client Foody feed. It fetches `/api/feed?scope=...`, owns the `new`/`subs` feed tab, and passes mutation state into `PostCard`.
- `/search` (`app/search/page.tsx`) — RSC shell for search history. It renders the `SearchHistory` client island.
- `/search/results` (`app/search/results/page.tsx`) — async RSC results page. It awaits `searchParams`, filters `POSTS` via `lib/search.ts`, reads server-side interaction state from `lib/server/*-store.ts`, and renders `SearchResultsHeader`, `SaveRecentSearchQuery`, and `SearchResultsFeed` client islands.

API Route Handlers live under `app/api/`:
- `/api/feed` — reads the feed snapshot for `new` or `subs`.
- `/api/follows` and `/api/follows/[user]` — list/check/mutate follows.
- `/api/likes` and `/api/likes/[postId]` — list/check/mutate post likes.
- `/api/bookmarks` and `/api/bookmarks/[postId]` — list/check/mutate saved posts.
- `/api/comment-likes` and `/api/comment-likes/[commentId]` — list/check/mutate comment likes.

Handlers that touch local JSON stores export `runtime = "nodejs"` because they use `node:fs/promises`.

### RSC boundaries

Pick the `page.tsx` shape by how interconnected the state is:
- `app/page.tsx` is `'use client'` because feed state is shared by the header, feed cards, notices, and optimistic pending indicators.
- `app/search/page.tsx` is RSC because search query/history state is contained in `SearchHistory` and its children.
- `app/search/results/page.tsx` is RSC because it resolves URL params and server store snapshots before handing interactive state to client islands.

Push `'use client'` as far down the tree as practical. Server-friendly visuals include `background-blobs`, `glass-surface`, `user-avatar`, `dish-photo`, and `section-header`. Current app-level client islands include `app/page.tsx`, `page-transition`, `feed-header`, `post-card`, `comments-sheet`, `photo-viewer-modal`, `bottom-tab-bar`, `search-history`, `search-header`, `search-results-header`, `search-results-feed`, `search-input-glass`, `recent-searches`, `popular-tags`, `category-picker`, and `save-recent-search-query`.

Do not import `lib/server/*-store.ts` from Client Components. Server Components can read those helpers directly; Client Components should go through `lib/feed-api.ts`.

### Data flow and persistence

`lib/mock-data.ts` remains the canonical seeded content and type surface. It exports `POSTS`, `COMMENTS_BY_POST_ID`, `POPULAR_TAGS`, `RECENT_SEARCHES`, `Post`, `PostComment`, `Palette`, `Density`, `Tweaks`, and `DEFAULT_TWEAKS`. Preserve these shapes when replacing mock data with a real backend; components consume them directly.

`lib/current-user.ts` defines the demo user (`@you`). Use it instead of duplicating the handle in routes or components.

`lib/feed-api.ts` owns client fetch helpers and API response types. Use these helpers for follow, like, bookmark, comment-like, and feed requests instead of scattering ad hoc `fetch` calls through components.

Local demo persistence lives in ignored JSON files under `.data/`:
- `.data/follows.json`
- `.data/likes.json`
- `.data/bookmarks.json`
- `.data/comment-likes.json`

The server stores in `lib/server/` validate inputs against mock data, dedupe records, serialize writes through an in-process queue, and write atomically through a temp file + rename. Treat `.data/` as local demo state, not source code. Do not commit it or depend on it existing.

Comment text submission in `CommentsSheet` is currently local optimistic UI only. Comment likes are persisted through the comment-like API.

### Navigation

`BottomTabBar` (`components/feed/bottom-tab-bar.tsx`) is shared by every route through `app/layout.tsx`. The active tab is derived from `usePathname()` — do not re-introduce an `active`/`onChange` controlled API. Route-bound tabs render as `next/link`; stubs for routes that do not exist yet (`add`, `saved`, `me`) stay as `<button>`.

Nested search pages are considered active under the `/search` tab. `BottomTabBar` hides while a post card is expanded by listening for the `foody:post-card-expanded` window event from `PostCard`.

To add a new route to the bar, set its `href` in the `TABS` array and update `TAB_ORDER` in `components/page-transition.tsx` so route slide direction stays correct.

### Feed and post cards

`PostCard` is the main interactive content unit. It owns collapsed/expanded modes, photo carousel drag state, photo viewer, comments sheet, share/copy behavior, tag search navigation, and event emission for hiding the bottom tab bar.

The card UI is split between:
- `components/feed/post-card.tsx` — state and orchestration.
- `components/feed/post-card-sections.tsx` — collapsed/expanded composition.
- `components/feed/post-card/*` — focused leaf pieces for header, details, tags, engagement bar, photo carousel, viewer modal, and shared animation/color constants.

When changing the card, preserve the single `PostCard` prop contract used by both the feed and search-results feed.

### Search

Search navigation goes through `useSearchSubmit()` and `getSearchResultsHref()` so query trimming and URL shape stay consistent. `lib/search.ts` currently matches posts by dish name and tags only.

Recent searches are client-side localStorage state in `components/search/recent-search-store.ts`. `SaveRecentSearchQuery` writes result-page queries back into that store after a small delay. Keep this local browser state separate from server `.data` stores.

### Tailwind v4, CSS-first

There is no `tailwind.config.js`. All setup is in `app/globals.css`:
- `@import "tailwindcss"`, `@import "tw-animate-css"`, `@import "shadcn/tailwind.css"`
- `@theme inline { --font-sans: var(--font-inter), ... }` wires `next/font` Inter into Tailwind's font-sans.
- `@utility hide-scroll { ... }` is the custom v4 utility used by the snap-scroll feed and search pages.

Add theme tokens / utilities in CSS, not a JS config. v4 supports fractional spacing units in arbitrary classes, e.g. `pt-12.5` resolves to `padding-top: 3.125rem`.

### shadcn

`components.json`: style `radix-nova`, RSC-enabled, icons `lucide-react`, base color `neutral`. Current `components/ui/` includes `aspect-ratio`, `avatar`, `button`, `card`, `dropdown-menu`, `input`, `input-group`, `label`, `progress`, `scroll-area`, `spinner`, `tabs`, and `textarea`. Add more with `npx shadcn@latest add <name> --yes`; they land in `components/ui/`.

**Radix import shape is non-standard.** The dep is the umbrella `radix-ui` package (not `@radix-ui/react-*`). Primitives are imported as namespaces:

```tsx
import { Slot } from "radix-ui"
// then: <Slot.Root />
```

See `components/ui/button.tsx`, `avatar.tsx`, and `scroll-area.tsx`. Match this pattern when adding new primitives.

### Motion

Use the `motion` library for React animations. Prefer existing Motion primitives and patterns for interactive transitions, enter/exit states, gesture-driven animation, layout animation, and reduced-motion behavior instead of adding ad hoc animation helpers.

`PageTransition` owns route slide transitions and uses `TAB_ORDER`; update that map when adding route-bound bottom tabs or important nested routes.

### Path alias + `cn()`

`@/*` maps to the repo root (`tsconfig.json`). shadcn aliases: `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`. The `cn()` helper in `lib/utils.ts` wraps `clsx` + `tailwind-merge`. Variants use `class-variance-authority` (`cva`) with `data-slot` / `data-variant` / `data-size` attributes — see `components/ui/button.tsx` for the canonical pattern.

### Domain components & "Liquid Glass + Flat" visual language

Per-screen components live in feature subfolders: `components/feed/`, `components/search/`. Mirror this when adding a new screen. Cross-screen primitives (e.g. `GlassSurface`) live under `components/feed/` for now — promote to `components/` only when a third consumer appears.

The project has its own design system. **All new UI must use it, and every next page must visually feel like the feed page**: same mobile app shell, shared bottom navigation, liquid-glass surfaces, soft green food-social palette, tight rounded geometry, Russian copy, Motion interaction style, and the same typography rhythm. Do not introduce a separate visual direction, generic landing-page layout, or unrelated component style unless the user explicitly asks for a redesign.

Visual conventions:
- `GlassSurface` (`components/feed/glass-surface.tsx`) is the reusable backdrop-blur + inset-highlight shell. Use it for new "liquid glass" surfaces instead of re-creating the effect inline.
- Inline `style` is allowed only for dynamic values (brand color from props, gradient angles computed from a seed, dynamically sized fonts). Static visuals must be Tailwind classes, including arbitrary-value utilities like `shadow-[inset_1px_1px_0_rgba(...)]` and `backdrop-blur-[22px]`.
- There is no project-wide `--brand` CSS variable; brand color flows from `lib/mock-data.ts` through `DEFAULT_TWEAKS` props.
- Russian UI copy is canonical. Keep both `cyrillic` and `latin` subsets when changing font setup.

### Out of scope

`source/` contains the Claude-design originals (`FeedScreen.jsx`, `SearchScreen.jsx`, `Main Screen.html`, `Search Screen.html`, `tweaks-panel.jsx`) used as a visual + structural reference during the refactor. It is not part of the build and should not be imported. The owner removes it manually after review — do not delete it autonomously.
