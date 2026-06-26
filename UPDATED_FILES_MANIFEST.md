# Cruise Explorer CSS Architecture Slice

This ZIP contains only changed or new files from the submitted `cruise(211).zip` project.

## Intent

Move the React CSS architecture to a common best-practice layered structure:

- `frontend/react/src/styles/foundation/` for tokens, theme, and reset
- `frontend/react/src/styles/layout/` for shared layout primitives
- `frontend/react/src/styles/components/` for reusable CSS component primitives
- `frontend/react/src/styles/utilities/` for single-purpose utilities

The existing `app.css` and `design-system.css` remain imported as legacy compatibility layers. New design-system work should not be added to those files.

## Retired flat files

These flat files are included as changed files and intentionally reduced to retirement comments because their implementation moved into the directories above:

- `frontend/react/src/styles/tokens.css`
- `frontend/react/src/styles/theme.css`
- `frontend/react/src/styles/layout.css`
- `frontend/react/src/styles/primitives.css`
- `frontend/react/src/styles/utilities.css`

They are no longer imported by `index.css`.
