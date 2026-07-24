### 4.12 Tooltips

**Brief**: Initializes Bootstrap tooltips with proper ARIA attributes. Provides reusable utility functions for single-element tooltip creation and disposal.

**Related Files**:

| File                 | Role                                                                                                                               |
|----------------------|------------------------------------------------------------------------------------------------------------------------------------|
| `src/ui/tooltips.ts` | Tooltip lifecycle: `initAllTooltips()`, `disposeAllTooltips()`, `createTooltip()`, `disposeTooltip()`, `initAllCopyLinkTooltips()` |

**Key Functions**:

- `initAllTooltips()` - scans all `[data-bs-toggle="tooltip"]` elements and creates tooltip instances via `createTooltip()`.
- `disposeAllTooltips()` - disposes all tooltip instances on the page via `disposeTooltip()`. Called before page transitions to prevent orphaned tooltips.
- `createTooltip(element)` - creates a Bootstrap Tooltip on a single element. Idempotent: disposes any existing tooltip on the element first.
- `disposeTooltip(element)` - disposes a Bootstrap Tooltip from a single element, if one exists.
- `initAllCopyLinkTooltips()` - batch function: sets up copy-link tooltips on all `.copy-link` elements via `initCopyLinkTooltip()`.
- `initCopyLinkTooltip(link)` - sets tooltip attributes and attaches the named `handleCopyLinkClick` handler to a single `.copy-link` element.
- `disposeCopyLinkTooltip(link)` - removes the click handler, tooltip attributes, and disposes the Bootstrap Tooltip instance from a single `.copy-link` element.


