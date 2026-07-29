---
description: >
  Deployment: GitHub Pages via GitHub Actions workflow. Build step: pnpm build (Vite bundles to dist/),
  deployed by .github/workflows/deploy.yml.
  Use when: modifying CI/CD, deployment workflow, or build output configuration.
applyTo: >
  .github/workflows/*.yml;
  .github/workflows/*.yaml
---

### 1.4 Deployment

- **Platform**: GitHub Pages
- **Trigger**: push to `main` branch, or manual dispatch via `workflow_dispatch`
- **Runner**: `ubuntu-latest`
- **CI pipeline** ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)):
  1. Checkout (`actions/checkout@v4`)
  2. Setup Node.js 22 (`actions/setup-node@v4`)
  3. Install pnpm (`pnpm/action-setup@v4`, latest)
  4. Install dependencies (`pnpm install --no-frozen-lockfile`)
  5. Build (`pnpm run build` — Vite bundles to `dist/`)
  6. Setup Pages (`actions/configure-pages@v4`)
  7. Upload artifact (`actions/upload-pages-artifact@v3`, `path: ./dist`)
  8. Deploy to GitHub Pages (`actions/deploy-pages@v4`)
- **Concurrency**: single `pages` group, `cancel-in-progress: false` (prevents race conditions)
