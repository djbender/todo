# Todo

React + TypeScript todo app with Redux Toolkit and RTK Query.

## Stack

- React 18 + TypeScript
- Redux Toolkit + RTK Query
- Vite

## Commands

```bash
npm run dev       # dev server
npm run build     # typecheck + build
npm run lint      # eslint
npm run preview   # preview prod build
npm run test      # tests in watch mode
npm run test:run  # tests once + coverage
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
