# mars_hackathon_2026

Mars Hackathon 2026. Built from a Next.js starter — GitHub and Vercel remotes are not wired yet.

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **shadcn/ui** (base-nova, all components pre-installed)
- **pnpm**
- **Zod**, **motion**, **lucide-react**

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm dev        # development server
pnpm build      # production build
pnpm lint       # ESLint
pnpm typecheck  # TypeScript
pnpm format     # Prettier
```

## Sol Zero Console (Track A build)

Interactive presentation: ten settlement decisions from robot landing to the first crewed dust storm, each settled by numbers from the organiser packs with the source file named. Live canvases draw the real pack series (solar per sol, terrain cost map with a planned route, wind rose, storm onset, cabin CO2). Pick an option on each card to see the consequence.

- Demo: `pnpm dev` then <http://localhost:3000/sol-zero-console/> (static timeline at `/sol-zero-console/timeline.html`)
- Code and models: [ml/settlement/README.md](./ml/settlement/README.md). `python ml/settlement/run_all.py` reproduces every figure and retrains the two ML decisions (terrain cost surface + route planner; sensor-only storm detector + ECLSS forecasts).
- Data used: Pack A EMARS weather, Pack B trip table, Pack B2 mobility grid, Pack C ECLSS log. Packs A, B2 and C are simulated; say so on stage.

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/setup.md](./docs/setup.md) | Local install and commands |
| [docs/github-private-repo.md](./docs/github-private-repo.md) | Create private GitHub repo and push |
| [docs/vercel.md](./docs/vercel.md) | Optional Vercel linking and deploy |
| [docs/env.md](./docs/env.md) | Environment variables |
| [docs/collaboration-workflow.md](./docs/collaboration-workflow.md) | Branches, PRs, collaborators |
| [docs/agent-workflow.md](./docs/agent-workflow.md) | Agent and human workflow |
| [docs/design-system.md](./docs/design-system.md) | Tailwind and shadcn conventions |
| [docs/coding-style.md](./docs/coding-style.md) | TypeScript and React style |
| [docs/product-principles.md](./docs/product-principles.md) | Scoping and shipping principles |
| [docs/hackathon.md](./docs/hackathon.md) | Event brief, tracks, rubric, tonight's clock |
| [docs/hackathon/datasets.md](./docs/hackathon/datasets.md) | Local Mars rasters, official packs, and ML env |
| [docs/hackathon/official-packs.md](./docs/hackathon/official-packs.md) | Organiser guided packs and per-track discovery |
| [docs/hackathon/final-checklist.md](./docs/hackathon/final-checklist.md) | Freeze checklist: track, data used, README, demo |
| [docs/skills.md](./docs/skills.md) | Global skills for locking the goal and polishing UI |

## Agent context

- [AGENTS.md](./AGENTS.md) — canonical agent instructions
- [.cursor/rules/](./.cursor/rules/) — Cursor rules (stack, dev server policy)

## Official Next.js docs

- [nextjs.org/docs](https://nextjs.org/docs)
- [Upgrading](https://nextjs.org/docs/app/guides/upgrading)
- In-repo version-matched docs: `node_modules/next/dist/docs/`

## Upgrading Next.js

```bash
pnpm add next@latest
pnpm add -D eslint-config-next@latest
pnpm build
```

## Not included (by design)

- No marketing landing page
- No monorepo / Turborepo
- No GitHub remote (yet) — see [docs/github-private-repo.md](./docs/github-private-repo.md)

## Licence

Private starter — add a licence when you publish or share outside your team.
