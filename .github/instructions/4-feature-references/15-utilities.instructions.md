---
description: >
  General-purpose utility functions: path normalization (normalizeInternalPath), page name extraction
  (extractPageName), dash-case conversion (toDashCase), plain text extraction (extractPlainText),
  element attribute setting (setElementAttributes), internal page detection (isInternalPage),
  internal/excluded page lists.
  Use when: modifying utils.ts or page-title.ts, or adding new shared utility functions.
applyTo: >
  src/core/utils.ts;
  src/ui/page-title.ts
---

### 4.15 Utilities

**Brief**: General-purpose helper functions used across the project.

**Related Files**:

| File                   | Role                                                                      |
| ---------------------- | ------------------------------------------------------------------------- |
| `src/core/utils.ts`    | Shared utility functions (path normalization, page name extraction, etc.) |
| `src/ui/page-title.ts` | Page title management                                                     |
