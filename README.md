# Todo

React + TypeScript todo app with Redux Toolkit and RTK Query.

## Stack

- React 19 + TypeScript
- Redux Toolkit + RTK Query
- Vite

## Setup

Requires the Node.js version pinned in [`.node-version`](.node-version) and npm.

```bash
# Install dependencies
npm install

# Install Playwright browsers (required for e2e tests)
npx playwright install --with-deps chromium

# Start dev server
npm run dev
```

Verify the setup with `npm run test:all`.

## Commands

```bash
npm run dev            # dev server
npm run build          # typecheck + build
npm run lint           # eslint
npm run preview        # preview prod build
npm run test           # unit tests (one-shot)
npm run test:watch     # unit tests in watch mode
npm run test:coverage  # unit tests with coverage
npm run test:e2e       # playwright e2e
npm run test:e2e:ui    # playwright UI mode
npm run test:all       # lint + build + coverage + e2e
```

## Deploy to Dokku

Deploys as a Docker container (multi-stage build: Node → nginx on port 5000).

### First-time setup

```bash
# On Dokku server
dokku apps:create todo
dokku domains:set todo todo.example.com

# Optional: enable HTTPS
dokku letsencrypt:enable todo
```

### Deploy

```bash
# Add Dokku remote (once)
git remote add dokku dokku@your-server.com:todo

# Deploy
git push dokku main
```

### How it works

- `Dockerfile`: builds static assets with Node, serves via nginx
- `nginx.conf`: SPA fallback routing, gzip, caching, security headers
- Listens on port 5000 (Dokku default)
- Includes health check at `/`

## Architecture

- State: Redux Toolkit with RTK Query for data fetching/caching
- API: `src/services/api.ts` - RTK Query endpoints with tag-based cache invalidation
- Mock API: `src/services/mockApi.ts` - in-memory backend (swap for real API later)
- Components: `TodoList.tsx` consumes RTK Query hooks directly
