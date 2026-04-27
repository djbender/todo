# Development

# Start Vite dev server with HMR
dev:
    npm run dev

# Type-check with tsc then build with Vite
build:
    npm run build

# Run ESLint on all files
lint:
    npm run lint

# Preview production build locally
preview:
    npm run preview

# Testing

# Run unit tests once
test:
    npm test

# Run unit tests in watch mode
test-watch:
    npm run test:watch

# Run unit tests with coverage report
test-coverage:
    npm run test:coverage

# Run Playwright E2E tests headless
test-e2e:
    npm run test:e2e

# Open interactive Playwright UI with DOM snapshots and traces
test-e2e-ui:
    npm run test:e2e:ui

# Full suite: lint, build, coverage, e2e
test-all:
    npm run test:all

# Deploy

# Run full test suite then push to dokku
deploy: test-all
    git push dokku main
