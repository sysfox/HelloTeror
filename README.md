# HelloTeror

A modern Next.js website with kinetic animations and sleek design.

## Tech Stack

- **Next.js 16** — App Router, React 19, TypeScript
- **shadcn/ui** — Radix primitives + Tailwind CSS v4
- **Tailwind CSS v4** — oklch design tokens
- **anime.js v4** — Kinetic animations
- **Lucide React** — Icons

## Quick Start

```bash
pnpm install
pnpm dev
```

## Commands

```bash
pnpm dev        # Start development server
pnpm build      # Production build
pnpm start      # Start production server
pnpm lint       # ESLint check
pnpm typecheck  # TypeScript check
pnpm check      # Run lint + typecheck + build
```

## Project Structure

```
src/
  app/              # Next.js routes
  components/       # React components
    animations/     # Kinetic animation components
    ui/             # shadcn/ui primitives
  contexts/         # React contexts (Theme, Page)
  hooks/            # Custom React hooks
  lib/              # Utility functions
  types/            # TypeScript interfaces
public/
  images/           # Static images
  seo/              # Favicons, OG images
```

## License

MIT