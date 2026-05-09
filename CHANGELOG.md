# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `preinstall` script that fails the install if `react` and `react-dom` declared ranges drift
- Dependabot group bundling `react`, `react-dom`, `@types/react`, and `@types/react-dom` so version bumps land in a single PR
- Justfile mirroring npm scripts
- Playwright E2E test suite and CI workflows (CI, CodeQL, Pages coverage deploy)
- Drag-and-drop todo reordering via `@dnd-kit`
- Dark mode toggle with animated slider
- Toast notifications for error handling
- Optimistic updates for todo toggle
- Sticky footer with data persistence note
- Dockerfile deployment config and Dokku zero-downtime deploy via `app.json`

### Changed
- Bumped React to 19.2.6 (and `react-dom` to match)
- Bumped Node base image to `26-alpine`
- Bumped Vite to 8.0.11, ESLint to 10.x, TypeScript to 6.0.3, Vitest to 4.1.5
- README updated to reflect React 19 and current npm scripts
- 100% unit-test coverage; reorganized npm scripts; Vitest excludes `e2e/`

### Fixed
- Toggle race condition: checkbox disabled during update
- Empty-state test stability via `setMockTodos([])`
- Build: exclude test files from `tsc`, use `vitest/config`
- Infinite recursion in mock API log function
- Lint errors: unused vars, `setState` in effect, fast refresh

[Unreleased]: https://github.com/djbender/todo/compare/HEAD
