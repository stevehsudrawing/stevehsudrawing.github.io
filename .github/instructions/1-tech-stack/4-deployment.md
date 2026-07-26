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
- **Build step**: `pnpm build` (Vite bundles to `dist/`), deployed via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
- **CI**: GitHub Actions — checks out → installs pnpm → builds → deploys to Pages
