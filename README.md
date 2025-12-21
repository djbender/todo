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

## Architecture

- State: Redux Toolkit with RTK Query for data fetching/caching
- API: `src/services/api.ts` - RTK Query endpoints with tag-based cache invalidation
- Mock API: `src/services/mockApi.ts` - in-memory backend (swap for real API later)
- Components: `TodoList.tsx` consumes RTK Query hooks directly
