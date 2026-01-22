---
name: typescript
description: use when editing any typescript file
---

When editing TypeScript files, follow these practices:

- Write only non-obvious comments, or function jsdoc comments (without redundant type info)
- Follow the existing codebase patterns and conventions. Maintain consistency with existing types.
- Use the project's path alias `@/*` for imports from `src/`
- After making changes, ensure they are correct with `pnpm fix`. This will run all Biome checks and fixes automatically and check for TS errors.
