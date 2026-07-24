### 1.4 Deployment

- **Platform**: GitHub Pages
- **Build step**: `pnpm build` (Vite bundles to `dist/`), deployed via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
- **CI**: GitHub Actions — checks out → installs pnpm → builds → deploys to Pages
