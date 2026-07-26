# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install        # Node >= 24, pnpm 11.8.0 (see .nvmrc / packageManager)
pnpm dev            # dev server
pnpm build          # production build (output: "standalone")
pnpm start          # serve the production build
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm check          # lint + typecheck + build — the verification gate before committing
```

There is **no test framework** in this repo (no Jest/Vitest/Playwright config, no `*.test.*` files), so there is no single-test command. `pnpm check` is the only automated verification. CI (`.github/workflows/ci.yml`, on push/PR to `master`) runs only `typecheck` + `build` — lint failures do not block CI, so run `pnpm lint` locally.

Env vars are optional: copy `.env.example` → `.env.local`. Without them the site still renders using hardcoded fallback data (see Data layer below).

## Architecture

### Single-route SPA (not Next routing)

`src/app/page.tsx` is the only page route. The six "pages" (`home` `about` `tech` `stats` `projects` `blog`) are **components swapped in place** — there is no URL change, no browser history, no scrolling. `<body>` is `overflow-hidden` and the app is `fixed inset-0`; every section renders as `w-full h-full` centered content.

`/` is **dynamically rendered** (`ƒ` in build output), not static: `layout.tsx` reads the locale cookie / `Accept-Language` (see i18n below). The three API routes keep their ISR.

Navigation state lives in `src/contexts/PageContext.tsx` (`PageId`, `PAGE_ORDER`, `navigate`, forward/backward `direction`, a `TRANSITION_CYCLE` that rotates through the four transition types on each move, and `transitioning` + `setTransitioning`). `transitioning` is written by `PageShell` but **lives in the context** so persistent layers outside `PageShell` can react to a transition — currently `AuroraBackground`'s surge. Wheel/touch/arrow-key stepping comes from `useFullPageScroll`.

**To add a page**, all five must be updated: the `PageId` union + `PAGE_ORDER` (`contexts/PageContext.tsx`), the `PAGES` map (`components/PageShell.tsx`), `NAV_LINKS` (`components/SiteNav.tsx` — now just `PageId[]`, labels come from the dictionary), the `nav` + `wordmark` keys in **both** locales (`src/i18n/dictionaries.ts`), and the section's `SectionGhostNumber index` (`01`–`05`, `home` has none).

### Page transition machinery (`PageShell` + `lib/pageTransitions.ts`)

The trickiest part of the codebase. During a transition **two layers render simultaneously**: an exit layer (old page) and an enter layer (new page). `runTransition` drives both with a single anime.js timeline; its `onComplete` calls `finish()`, which swaps `displayed`, clears leftover inline styles (`clearTransitionStyles`), and unlocks scrolling.

Four transition types rotate via `TRANSITION_CYCLE`:

| type | shape | overlay DOM | duration |
|---|---|---|---|
| `curtain` | accent 幕布横扫覆盖 → 揭示 | `.curtain-panel` | 550 |
| `zoom-blur` | 缩放 + 模糊交叉淡入淡出 | — | 550 |
| `type-wipe` | 幕布 + 目标页超大词标反向视差 | `.curtain-panel` > `.curtain-wordmark` | 780 |
| `slats` | 10 条竖条 stagger 覆盖 → 同向划出 | `.slats-overlay` > `.slat-cell` | 820 |

Adding a type means touching four places: the `TransitionType` union, `TRANSITION_CYCLE` (both in `contexts/PageContext.tsx`), `TRANSITION_DURATIONS` + the `runTransition` switch (`lib/pageTransitions.ts`), and the overlay DOM + ref in `PageShell`. `TRANSITION_DURATIONS` is a `Record<TransitionType, number>`, so forgetting to register a duration is a type error.

Invariants to preserve when touching this:
- The enter layer's `key` is `` `enter-${page}-${locale}` `` — the remount is deliberate: it replays each section's entrance animations on navigation **and** on a language switch.
- The exit layer is wrapped in `.transition-exit-snapshot`, whose CSS forces the subtree visible (`opacity/animation/filter/clip-path` with `!important`) so the remounted old page doesn't flash or replay animations. It intentionally does **not** touch `transform`. Note `filter: none` strips *all* filters in that subtree, including non-entrance ones — that is why the aurora orbs were promoted out of `PageShell` (see below); a new persistent `filter` inside a section would need a `:not()` exception.
- A `setTimeout(finish, TRANSITION_DURATIONS[transition] + 400)` safety net exists so a broken timeline can never leave the UI permanently locked.
- `useFullPageScroll`'s `cooldownMs` is derived from `MAX_TRANSITION_MS` rather than hardcoded — no more "changed one, forgot the other".
- `prefersReducedMotion()` short-circuits `runTransition` to an immediate `finish()`. Overlays therefore render for a single frame; their init-hidden/off-screen CSS is what keeps that frame invisible (see the reduced-motion caveat below).

### anime.js conventions

**Always import animation APIs from `@/lib/anime`**, never from `animejs` directly. That module re-exports the v4 API and owns the `EASE` presets, spring factories (functions, not shared instances — avoids concurrent reuse), `TRANSITION_MS`, and `prefersReducedMotion()`.

Every animated component follows the same contract:
1. Animate inside `useEffect` in a `"use client"` component (SSR safety).
2. Guard with `prefersReducedMotion()` — either skip (CSS shows the final state) or set the final state imperatively.
3. Return cleanup calling `.revert()` / `scope.revert()` so React strict-mode double-mounts leave no inline styles behind.
4. Prevent FOUC with the helper classes in `globals.css`: `.anime-init` (self hidden), `.anime-init-children` (direct children hidden), `.anime-line` (`scaleX:0`). The `@media (prefers-reduced-motion: reduce)` block at the bottom of `globals.css` un-hides all of them — **any new init-hidden class for content must be added to that block**, otherwise reduced-motion users see blank content.
   - Exception: **transition overlays** (`.curtain-wordmark`, `.slat-cell`) are deliberately *not* in that block. They are decorative and only exist for one frame under reduced motion; forcing `opacity:1` / `transform:none` there would flash a giant word or park the slats across the middle of the screen.

Two anime.js v4 typing gotchas already hit in this repo:
- `FunctionValue` (used for per-target `delay`/`duration`) declares **all parameters optional**, so a callback with required params fails to typecheck — write `(_target?: unknown, i?: number) => …`.
- `ease` accepts plain strings (`"inExpo"`, `"outQuad"`) beyond the `EASE` presets.

Block-level one-shot entrances may use the `useAnimeScope` hook; inline/event-driven components (`AnimeText`, `MagneticButton`, `TiltCard`, `EnhancedCursor`) use `useEffect` + element refs directly.

Animations are coordinated by **hand-tuned millisecond delays**, not orchestration. `SectionHeading` (index → accent line → label → title), `StaggerGroup` `startDelay`/`staggerMs`, and `HeroSection`'s loader handoff all depend on those numbers agreeing. `HeroSection` reads `sessionStorage["teror-fox-loader-played"]` (written by `KineticLoader` when its intro finishes) to pick `startDelay` 1900ms on first visit vs 200ms when returning to home.

### Data layer: server fetch → ISR route → client cache, never fails

- `src/lib/github.ts` and `src/lib/mxspace.ts` are **server-only** (they read `process.env` and are called by route handlers). Both export `FALLBACK_*` data and swallow every error, so a missing token or a dead upstream degrades content but never the page.
- `src/app/api/{blog,github/projects,github/stats}/route.ts` are thin wrappers exporting `revalidate` (1800s for blog, 3600s for GitHub) and always returning 200.
- `src/hooks/useApiData.ts` is required on the client because `PageShell` remounts sections on every navigation. It holds a **module-level cache + in-flight dedup** so returning to a page renders instantly, and falls back to stale cache on fetch failure rather than surfacing an error. Don't replace it with a bare `useEffect` + `fetch`.
- GitHub data comes exclusively from GraphQL (pinned repos, contributions), keyed on `GITHUB_TOKEN` / `GITHUB_USERNAME`. MX-Space merges `posts` + `notes` sorted by modified date; `resolveApiBase()` tolerates `MXSPACE_API_BASE` being given with or without a trailing `/posts`.
- `GitHubStatsResponse.calendar` carries the contribution heatmap. `normalizeCalendar` pads **every** week to exactly 7 slots (Sun→Sat) with `null` outside the window, because the stats window is Jan 1 → next Jan 1 while GitHub's weeks break on Sunday, so the first and last weeks are short. The fallback calendar is generated with a multiplicative hash (**never `Math.random`** — the same process must return a stable shape, or the client cache visibly jumps between requests).
- `BlogPost.date` is an **ISO `YYYY-MM-DD` string**, not a display string. Localized formatting happens client-side in `BlogSection` via `Intl.DateTimeFormat` with `timeZone: "UTC"` (matching `toIsoDate`'s UTC basis). Upstream-owned text (post titles/categories, repo descriptions) is deliberately **not** translated — it is whatever MX-Space / GitHub returns.

### i18n (en / zh)

Locale resolution order: **cookie `teror-fox-locale`** (explicit user choice, one year) → **`Accept-Language`** (follows the system) → `en`.

Unlike `ThemeContext`, the locale **must not** be corrected in a client effect. Theme only flips attributes; locale changes rendered *text*, so a "default first, fix after mount" approach would produce a whole-page hydration mismatch plus a one-frame language flash. Therefore:

- `src/i18n/config.ts` — `Locale`, cookie constants, `Accept-Language` parsing. No `next/headers` import, so it is safe on both sides.
- `src/i18n/server.ts` — **server-only** (`cookies()` / `headers()`); this is what makes `/` dynamic.
- `layout.tsx` is `async`: it resolves the locale, sets `<html lang>`, localizes metadata via `generateMetadata`, and injects the result into `LocaleProvider initialLocale`.
- `src/contexts/LocaleContext.tsx` — `useLocale()` → `{ locale, t, intlLocale, setLocale, toggleLocale }`, plus a `useT()` shorthand. Switching writes the cookie client-side (`document.cookie`) so the next SSR agrees.

`src/i18n/dictionaries.ts` uses `en` as the **type source**: `Dictionary = typeof en` (no `as const`) and `zh` is explicitly annotated with it, so a missing/extra/mistyped key is a `tsc` error. Interpolation is done with functions in the dictionary (e.g. `graphTotal(total: string)`), where numbers/dates are pre-formatted by the caller with `intlLocale`.

Not in the dictionary: brand and proper nouns (Teror Fox, GitHub, BiliBili, TF Studio, GitHub achievement badge names), shell **commands** in the terminal blocks (only their output is translated), and upstream data.

Components read text via `useT()`; numbers use `toLocaleString(intlLocale)`. Note `SiteNav`'s indicator effect depends on `locale` — Chinese labels are narrower, so the accent dot must re-measure after a switch.

### Theming

Three-layer setup, all in `src/app/globals.css`: shadcn/Tailwind v4 `@theme inline` mappings, then the token sets under `:root, [data-theme="dark"]`, `[data-theme="light"]`, and a **duplicate `.light-theme` block kept for backwards compatibility** — light-theme token edits must be made in both places.

Beyond shadcn's tokens the site defines its own vocabulary that business components rely on: `--text-primary/secondary/tertiary`, `--surface`/`--surface-hover`/`--surface-strong`, `--border-subtle`/`--border-strong`, `--accent-soft`/`--accent-border`/`--accent-glow`, `--aurora-1..4`, `--transition-curtain-bg` (also reused per-slat by the `slats` transition, and mixed via `color-mix` for heatmap levels). Components consume these through **inline `style={{ color: "var(--text-primary)" }}`** (and inline `onMouseEnter`/`onMouseLeave` for hover) rather than Tailwind color classes — match that pattern in existing files instead of introducing `text-*`/`bg-*` color utilities.

`ThemeContext` writes `data-theme` + `.light-theme` to `<html>` and persists to `localStorage["teror-fox-theme"]`, following the system preference only until the user picks explicitly. A small inline bootstrap script in `layout.tsx`'s `<head>` applies the stored theme before React hydrates to avoid a flash; `<html>` is `suppressHydrationWarning` and defaults to `dark`.

### Section component shape

Each of the five non-home sections looks like:

```tsx
<section id="stats" className="relative isolate w-full h-full flex items-center justify-center px-5 sm:px-6">
  <SectionGhostNumber index="03" />          {/* needs the parent's `isolate` for its -z-10 */}
  <div className="relative isolate w-full max-w-5xl max-h-full overflow-y-auto no-scrollbar py-12">
    <SectionHeading index="03" label={t.stats.label} title={t.stats.title} />
    <StaggerGroup ...>{items.map(i => <div key={i.id} data-stagger-item>…</div>)}</StaggerGroup>
  </div>
</section>
```

`SectionGhostNumber` carries its own scaffold (matching `px-5 sm:px-6` + `max-w-5xl`) so the giant background numeral lands at identical coordinates across pages regardless of content height — keep the section's padding and max-width in sync with it. `StaggerGroup` children must be **direct** children marked `data-stagger-item` (the FOUC class only hides direct children).

### Background layer

`AuroraBackground` is rendered by `app/page.tsx` (inside `PageProvider`, before `SiteNav`), **not** by `HeroSection`. It is a persistent cross-page layer that survives `PageShell`'s remounts, which is what lets it animate continuously across a transition. The root container carries `isolate` so the layer's `-z-10` cannot sink below the body background.

One effect owns both `opacity` and `scale` on the surge layer: `transitioning` → boost (300ms), release → settle to the current page's intensity (`home` 1, others 0.4, 900ms `outExpo`). Do not add a second animation to those two properties on that element; split a new behaviour into another nested layer instead.

### Contribution heatmap

`ContributionGraph` lays cells out **column-major** (`grid-auto-flow: column`, one column per week) so each cell is a *direct* child of the `.anime-init-children` grid. Because of that, the diagonal wave delay is hand-computed (`week * 16 + day * 26`) rather than using anime's grid stagger, which assumes row-major DOM order. It only animates once `start` is true (data ready).

### Other conventions

- Site metadata (social links, other-site links, ICP filing number, author, start year) is centralized in `src/config/site.ts` — deliberately hardcoded, not env. Only ids/hrefs live there; **display labels come from `t.links[id]`**.
- `useApiData` returning a warm cache on the very first render is a real code path (revisiting a page, or a locale-switch remount). Any "run this animation once data is ready" flag must therefore be **strict-mode double-mount safe** — guard on state, not a ref, or the first pass's cleanup cancels the timer and the second pass early-returns forever (this exact bug was fixed in `StatsSection`).
- Code comments are written in **Chinese**, and typically explain *why* a workaround exists (FOUC, strict-mode double mount, stale closures). Match that when editing. Commit messages are Conventional Commits with Chinese or English subjects.
- `eslint-config-next` 16 enables the new react-hooks rules; existing files carry targeted `eslint-disable-next-line react-hooks/{set-state-in-effect,refs,exhaustive-deps}` comments with a justification. Prefer following that pattern over restructuring working animation timing code.
- Remote images are restricted in `next.config.ts` to `github.com`, `raw.githubusercontent.com`, `avatars.githubusercontent.com` — add hosts there before using `next/image` with new domains.
- Dormant code, do not assume it is wired up: `hooks/useAnimeScope.ts`, `useInView`, `useParallax`, `useScrollProgress`, and `components/animations/TextReveal.tsx` currently have no consumers (`PageLoader` is superseded by `KineticLoader`).
- `package.json`'s `name`/`author`/`repository` still point at the upstream `ai-website-cloner-template` this repo was forked from; the actual project is HelloTeror (see `README.md`).
- OpenPanel analytics is configured inline in `layout.tsx` with a hardcoded `clientId` and self-hosted proxy URLs (`p.trfox.top`, `op.trfox.top`).
