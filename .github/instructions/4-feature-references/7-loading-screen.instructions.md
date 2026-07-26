---
description: >
  Loading screen: overlay displayed during page initialization, hidden via hideLoadingScreen() after
  all init completes, pageInitialized CustomEvent signals readiness, hash-based scroll after page
  load via initHashChangeScroll().
  Use when: modifying loading-screen.ts, loading-screen.css, or page initialization sequence.
applyTo: >
  src/ui/loading-screen.ts;
  src/stylesheets/loading-screen.css
---

### 4.7 Loading Screen

**Brief**: Displays a loading overlay on page load, hidden after all initialization completes.

**Related Files**:

| File                                 | Role                               |
| ------------------------------------ | ---------------------------------- |
| `src/ui/loading-screen.ts`           | Controls loading screen visibility |
| `src/stylesheets/loading-screen.css` | Loading screen overlay styles      |

**Data Flow**:

| Mechanism   | Key / Event       | Purpose                                                                      |
| ----------- | ----------------- | ---------------------------------------------------------------------------- |
| CustomEvent | `pageInitialized` | Signals that all init scripts have finished; deferred listeners can then run |
| URL hash    | `#section-id`     | Scroll to anchor after page load (via `initHashChangeScroll()`)              |
