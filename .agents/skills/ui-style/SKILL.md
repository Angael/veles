---
name: ui-style
description: Use when creating, restyling, or reviewing web UI in apps/web — CSS modules, theme tokens, breakpoints, hover/press/focus states, animation, hit areas, or picking shared components from apps/web/src/components.
---

# UI Polish

Follow the existing visual language before introducing a new pattern.

## Rules

- Inspect the surrounding page, `apps/web/src/styles/theme.css`, and existing CSS modules before editing; reuse theme tokens and established spacing, typography, radii, and responsive patterns.
- Use primitives from `@apps/web/src/components/` before creating controls or surfaces; import each primitive from its concrete file, not a barrel.
- Prefer CSS modules (`import css from ...`) and nested selectors when they keep related states together; use `--phone`, `--tablet`, and `--laptop` from `apps/web/src/styles/breakpoints.css` instead of raw width queries.
- Respect the global reset: text margins, font inheritance, and line-height already have defaults, so override them only for an intentional visual reason.
- Follow the [Fluid Functionalism typography principles](https://www.fluidfunctionalism.com/docs/typography), adapted to the existing self-hosted Geist fonts; never replace Geist with Inter. Use the five paired size/line-height/weight roles: `font: var(--type-display)`, `var(--type-title)`, `var(--type-subtitle)`, `var(--type-body)`, or `var(--type-caption)`. Use individual `--text-*` and `--leading-*` role tokens only when the font shorthand would overwrite intentional inheritance.
- Use weights 400 (body), 600 (headings, emphasis, selected items), and 700 (page titles). Do not copy Inter optical-size settings or assume Geist weight changes preserve label width.
- Use foreground `--c-text` and secondary `--c-muted` for ordinary text, with semantic link, status, macro, and on-action contrast colors as exceptions. Do not fade ordinary text with opacity; disabled states and appearance animations remain exceptions.
- Do not add uppercase transforms, custom tracking, or per-component font-size clamps to ordinary UI text. Brand artwork is not a UI text role.
- Use `--type-metric` only for primary numeric readouts; Geist Mono remains available for numeric data and code, not ordinary labels. Use `--type-input` for editable controls (16px prevents iOS focus zoom), including multiline diary text; do not shrink input text in compact variants.
- Paragraphs share `--type-body`; keep block spacing in the owning layout with existing spacing tokens. The diary is plain-text editing/preview, not a new Markdown renderer. If rendered Markdown is added later, map it to these same roles.
- Treat `text-box` trimming as progressive enhancement for short control labels only; keep multiline text and control hit areas intact.
- Never use eyebrow or kicker styles, components, or text. Do not add small labels above headings or values—even when they provide new context; express that information in the heading, body copy, metadata, or accessible name instead.
- Keep pointer targets stable: never lift, translate, float, resize, or scale interactive elements on hover or press, and never animate their shadows.
- Express hover and press with `background-color`, `border-color`, `color`, underline, or opacity; gate hover-only behavior with `@media (hover: hover) and (pointer: fine)` when touch has no equivalent.
- Never use `transition: all`; name only changed properties, usually for 100–250ms, and keep keyboard-triggered or high-frequency actions immediate.
- Animate only to explain space, state, feedback, or appearance: use `ease-out` for entrances, `ease-in-out` for movement, faster/subtler exits, and no `ease-in` entrances.
- Do not animate from `scale(0)`; when scale is justified, start near `0.95` with opacity, make anchored popovers originate at their trigger, and never block interaction behind staggered decoration.
- Honor `prefers-reduced-motion` by removing positional motion while retaining useful color or opacity feedback; add `will-change` only after observing first-frame stutter.
- Give controls at least a 40×40px hit area, ideally 44×44px, without overlapping targets; provide stable visible keyboard focus and preserve semantic labels and live-region behavior.
- Use borders for separation and form affordance, subtle static shadows only where depth matters, and concentric nested radii (`outer = inner + padding`) when surfaces visually belong together.
- Use `text-wrap: balance` for short headings, `text-wrap: pretty` for short-to-medium copy, and `font-variant-numeric: tabular-nums` where changing numbers would shift layout. Reapply numeric variants after a `font` shorthand on numeric descendants; the shorthand resets font variants. When removing theme tokens, migrate every consumer, including demo pages, and run the existing theme-token test through `pnpm check:fix`.
- For UI reviews, report focused changes in a `Before | After | Why` markdown table; verify the actual rendered surface at relevant viewport sizes, interaction states, keyboard focus, and reduced motion.

## Reusable Web Primitives

Use these components from `@apps/web/src/components/` rather than recreating their behavior or styling. Read the concrete component and its CSS module before use so props, variants, accessibility, and responsive behavior remain consistent.