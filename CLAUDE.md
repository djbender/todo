# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Dev server: `npm run dev` - Starts Vite dev server with HMR
- Build: `npm run build` - Type-checks (`tsc -b`) then builds with Vite
- Lint: `npm run lint` - Runs ESLint on all files
- Preview: `npm run preview` - Previews production build locally

## Architecture

### State Management
Uses Redux Toolkit with RTK Query for data fetching and caching:

- Store: Configured in `src/store/store.ts`
  - Single slice: `todosApi` (RTK Query API slice)
  - Middleware: RTK Query middleware auto-configured

### API Layer
- RTK Query API: `src/services/api.ts` - Defines `todosApi` with endpoints for todos CRUD
  - Uses `fakeBaseQuery()` instead of `fetchBaseQuery()`
  - Delegates to `mockApi` via `queryFn` pattern
  - Tag-based cache invalidation (`Todo` tags)
  - Exports auto-generated hooks: `useGetTodosQuery`, `useCreateTodoMutation`, etc.

- Mock API: `src/services/mockApi.ts` - In-memory simulated backend
  - Provides async functions with artificial delays
  - Serves as data source until real API integrated

### Types
- `src/types/todo.ts` - Shared type definitions (e.g., `Todo` interface)

### Components
- `src/components/TodoList.tsx` - Main component consuming RTK Query hooks
- `src/App.tsx` - Root component, renders TodoList

### Key Patterns
- RTK Query handles all data fetching, caching, and cache invalidation
- Components use generated hooks (`useGetTodosQuery`, mutations) - no manual Redux logic
- Mock API layer allows easy swap to real API by changing `queryFn` implementations
