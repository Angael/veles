---
name: ui-style
description: Repo UI styling polish rules
---

# UI Polish

Use this skill when building or reviewing frontend UI. Follow the existing visual language before introducing a new pattern.

## Rules

- Inspect the surrounding page, `apps/web/src/styles/theme.css`, and existing CSS modules before editing; reuse theme tokens and established spacing, typography, radii, and responsive patterns.
- Use primitives from `@apps/web/src/components/` before creating controls or surfaces; import each primitive from its concrete file, not a barrel.
- Prefer CSS modules (`import css from ...`) and nested selectors when they keep related states together; use `--phone`, `--tablet`, and `--laptop` from `apps/web/src/styles/breakpoints.css` instead of raw width queries.
- Respect the global reset: text margins, font inheritance, and line-height already have defaults, so override them only for an intentional visual reason.
- Never use eyebrow or kicker styles, components, or text. Do not add small labels above headings or values—even when they provide new context; express that information in the heading, body copy, metadata, or accessible name instead.
- Keep pointer targets stable: never lift, translate, float, resize, or scale interactive elements on hover or press, and never animate their shadows.
- Express hover and press with `background-color`, `border-color`, `color`, underline, or opacity; gate hover-only behavior with `@media (hover: hover) and (pointer: fine)` when touch has no equivalent.
- Never use `transition: all`; name only changed properties, usually for 100–250ms, and keep keyboard-triggered or high-frequency actions immediate.
- Animate only to explain space, state, feedback, or appearance: use `ease-out` for entrances, `ease-in-out` for movement, faster/subtler exits, and no `ease-in` entrances.
- Do not animate from `scale(0)`; when scale is justified, start near `0.95` with opacity, make anchored popovers originate at their trigger, and never block interaction behind staggered decoration.
- Honor `prefers-reduced-motion` by removing positional motion while retaining useful color or opacity feedback; add `will-change` only after observing first-frame stutter.
- Give controls at least a 40×40px hit area, ideally 44×44px, without overlapping targets; provide stable visible keyboard focus and preserve semantic labels and live-region behavior.
- Use borders for separation and form affordance, subtle static shadows only where depth matters, and concentric nested radii (`outer = inner + padding`) when surfaces visually belong together.
- Use `text-wrap: balance` for short headings, `text-wrap: pretty` for short-to-medium copy, and `font-variant-numeric: tabular-nums` where changing numbers would shift layout.
- For UI reviews, report focused changes in a `Before | After | Why` markdown table; verify the actual rendered surface at relevant viewport sizes, interaction states, keyboard focus, and reduced motion.

## Reusable Web Primitives

Use these components from `@apps/web/src/components/` rather than recreating their behavior or styling. Read the concrete component and its CSS module before use so props, variants, accessibility, and responsive behavior remain consistent.