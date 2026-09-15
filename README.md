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
