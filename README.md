# HelloTeror

A deep-space personal site: real-time WebGPU/WebGL scene, ThreeUI shader accents, and a single-route SPA with cinematic page transitions.

## Design

The UI follows the **VOID PROTOCOL** language documented in [`docs/REDESIGN.md`](docs/REDESIGN.md): obsidian surfaces, phosphor cyan / plasma magenta / signal amber, HUD typography, volumetric 3D depth, and four camera-style page transitions (`depth-dive`, `fracture`, `warp-tunnel`, `lattice-wipe`).

## Tech Stack

- **Next.js 16** — App Router, React 19, TypeScript
- **shadcn/ui** — Radix primitives + Tailwind CSS v4
- **Tailwind CSS v4** — oklch design tokens
- **anime.js v4** — Kinetic animations and transition timelines
- **vgpu** — WebGPU volumetric scene (inline WGSL, typed runtime shader prep)
- **Three.js + React Three Fiber + drei** — WebGL fallback scene and 3D geometry
- **ThreeUI** — Per-page shader accent layers (asset-free components)
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
    animations/     # Kinetic animation primitives
    scene/          # Persistent WebGPU/WebGL scene + ThreeUI layers
    sections/       # Section-specific 3D/HUD subcomponents
    void/           # Shared HUD primitives (GlassPanel, HudLabel, ...)
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