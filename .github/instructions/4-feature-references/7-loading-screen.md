### 4.7 Loading Screen

**Brief**: Displays a loading overlay on page load, hidden after all initialization completes.

**Related Files**:

| File                                 | Role                               |
|--------------------------------------|------------------------------------|
| `src/core/loading-screen.ts`         | Controls loading screen visibility |
| `src/stylesheets/loading-screen.css` | Loading screen overlay styles      |

**Data Flow**:

| Mechanism   | Key / Event       | Purpose                                                                      |
|-------------|-------------------|------------------------------------------------------------------------------|
| CustomEvent | `pageInitialized` | Signals that all init scripts have finished; deferred listeners can then run |
| URL hash    | `#section-id`     | Scroll to anchor after page load (via `initHashChangeScroll()`)              |


