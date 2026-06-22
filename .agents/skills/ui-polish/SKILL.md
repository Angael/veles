---
name: ui-polish
description: Canonical repo skill for practical UI polish, interaction design, motion restraint, typography, surfaces, hover states, shadows, borders, accessibility, and frontend design review.
---

# UI Polish

Use this skill when building or reviewing frontend UI. It combines the repo's taste rules with practical design-engineering guidance from animation craft and small interface details.

Great interfaces rarely come from one big idea. They come from many small decisions that make the UI feel stable, legible, responsive, and intentional.

## Repo Taste Rules

These rules override any general design advice.

- Never animate shadow changes on hover for interactive elements.
- Never move, lift, float, translate, or scale interactive elements on hover.
- Avoid scaling buttons or button contents for press feedback. Chrome often rasterizes text and icons during fractional transforms, making sharp controls look blurry.
- Prefer hover and press feedback through stable `background-color`, `border-color`, `color`, underline, opacity, or static focus rings.
- If a shadow must change for state clarity, do not transition `box-shadow`.
- High-frequency controls should feel stable under the pointer. Do not make the target shift, resize, or visually jump.

## Review Format

When reviewing UI code, present findings or changes as a markdown table.

| Before | After | Why |
| --- | --- | --- |
| `transition: all 300ms` | `transition: background-color 160ms ease-out` | Specify exact properties; avoid accidental animation |
| `.card:hover { transform: translateY(-2px); box-shadow: ... }` | `.card:hover { border-color: ...; background: ... }` | Hover should not fake lift or animate depth |
| `transform: scale(0)` | `transform: scale(0.95); opacity: 0` | Elements should not appear from nothing |

Do not use separate `Before:` and `After:` blocks. Keep each row focused on one change.

## Animation Decision Framework

Before writing animation code, answer these questions in order.

### Should this animate at all?

| Frequency | Decision |
| --- | --- |
| 100+ times/day, keyboard shortcuts, command palette toggles | No animation |
| Tens of times/day, hover effects, list navigation | Remove or drastically reduce |
| Occasional, modals, drawers, toasts | Standard animation |
| Rare or first-time, onboarding, celebrations | Can add delight |

Never animate keyboard-initiated actions. They should feel immediate.

### What is the purpose?

Valid purposes:

- Spatial consistency, such as a drawer entering from where it exits.
- State indication, such as a loading icon becoming a success icon.
- Explanation, usually in marketing or onboarding.
- Feedback, preferably through stable color, border, opacity, or background changes.
- Preventing jarring changes when elements appear or disappear.

If the purpose is only "it looks cool" and users will see it often, do not animate it.

### What easing should it use?

- Entering UI: `ease-out` or a strong custom ease-out.
- Moving or morphing on screen: `ease-in-out`.
- Hover color changes: `ease` or project default.
- Constant motion: `linear`.
- Avoid `ease-in` for UI entrances because it starts sluggishly.

Useful custom curves:

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

### How fast should it be?

| Element | Duration |
| --- | --- |
| Button feedback | 100-160ms |
| Tooltips, small popovers | 125-200ms |
| Dropdowns, selects | 150-250ms |
| Modals, drawers | 200-500ms |
| Marketing/explanatory | Can be longer |

Most UI animations should stay under `300ms`.

## Interaction Rules

### Hover Feedback

Hover feedback should make an affordance clearer without moving the target.

Good hover changes:

- Background color.
- Border color.
- Text color.
- Underline or text decoration.
- Secondary icon opacity.

Bad hover changes:

- `transform: translateY(...)`.
- `scale(...)`.
- Animated `box-shadow`.
- Blur-heavy effects on frequently hovered elements.

Gate hover-only styles behind pointer capability when they do not make sense on touch devices.

```css
@media (hover: hover) and (pointer: fine) {
  .item:hover {
    background: var(--hover-bg);
  }
}
```

### Press Feedback

Avoid press scaling for buttons, inputs, selects, steppers, and other high-frequency controls. Fractional scale often makes text and icons blurry in Chrome.

Use non-geometric feedback instead.

```css
.button {
  transition:
    background-color 160ms ease-out,
    border-color 160ms ease-out,
    color 160ms ease-out;
}

.button:active {
  background: var(--button-bg-active);
}
```

Only use scale for rare decorative or spatial transitions, not core controls.

### Tooltips

Tooltips should delay before first appearance to prevent accidental activation. Once one tooltip is open, adjacent tooltips can open instantly with no animation.

### Hit Areas

Interactive elements should have at least a `40x40px` hit area, ideally `44x44px`. If the visible control is smaller, extend the hit area with a pseudo-element. Do not let hit areas overlap.

## Surface Polish

### Concentric Border Radius

When nesting rounded surfaces, calculate:

```text
outerRadius = innerRadius + padding
```

```css
.card {
  border-radius: 20px;
  padding: 8px;
}

.cardInner {
  border-radius: 12px;
}
```

If padding is larger than `24px`, treat the layers as separate surfaces and choose each radius independently.

### Optical Alignment

When geometric centering looks off, align optically.

- Buttons with text plus icon usually need slightly less padding on the icon side.
- Play icons often need a small right shift.
- Asymmetric icons are best fixed in the SVG itself; margins are an acceptable fallback.

### Shadows And Borders

Use borders for separation and form affordances. Use subtle shadows for depth when needed.

Do not turn hover into a fake elevation system. Static shadows are fine; animated hover depth is not.

### Image Outlines

Images often benefit from an inset one-pixel outline for consistent edges.

```css
img {
  outline: 1px solid rgba(0, 0, 0, 0.1);
  outline-offset: -1px;
}
```

Use pure black in light mode and pure white in dark mode. Avoid tinted palette neutrals for image outlines because they can read as dirt.

## Typography

### Text Wrapping

Use `text-wrap: balance` for headings and short titles.

Use `text-wrap: pretty` for short-to-medium paragraphs, descriptions, captions, card text, and list items.

Do not use balancing on long paragraphs.

### Font Smoothing

Apply macOS font smoothing once at the root if the app wants crisper text.

```css
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

Do not apply smoothing inconsistently per component.

### Tabular Numbers

Use `font-variant-numeric: tabular-nums` for dynamic numbers, timers, counters, ratings, prices that update, and numeric table columns.

## Enter And Exit Motion

### Never Animate From Scale Zero

Elements should not appear from nothing. If scale is appropriate for an entrance, start around `scale(0.95)` and pair it with opacity.

```css
.entering {
  opacity: 0;
  transform: scale(0.95);
}
```

### Popovers Should Be Origin-Aware

Anchored popovers should scale from their trigger, not from the center. Modals are the exception and should stay centered.

```css
.popover {
  transform-origin: var(--radix-popover-content-transform-origin);
}
```

### Split And Stagger Entrances

Do not animate one large container when a page enters. Split into semantic chunks and stagger short delays.

```css
.staggerItem {
  opacity: 0;
  transform: translateY(12px);
  filter: blur(4px);
  animation: fadeInUp 320ms ease-out forwards;
}

.staggerItem:nth-child(2) {
  animation-delay: 80ms;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}
```

Stagger is decorative. Never block interaction while stagger animations play.

### Exit Motion

Exits should usually be subtler and faster than entrances. Use small fixed movement, such as `translateY(-12px)`, unless full spatial movement is necessary.

## Icon Animation

When contextual icons appear or swap, animate `opacity`, `scale`, and `blur` rather than toggling visibility abruptly.

Use these values for icon swaps:

- `scale`: `0.25` to `1`.
- `opacity`: `0` to `1`.
- `filter`: `blur(4px)` to `blur(0px)`.
- If using Motion: `{ type: "spring", duration: 0.3, bounce: 0 }`.

If the project does not already use Motion or Framer Motion, do not add it just for icon transitions. Use CSS cross-fades with both icons in the DOM.

## Performance

### Transition Only What Changes

Never use `transition: all`. Specify exact properties.

```css
.control {
  transition:
    background-color 150ms ease-out,
    border-color 150ms ease-out,
    color 150ms ease-out;
}
```

Avoid `transform` and `box-shadow` transitions for hover on interactive elements in this repo.

### Prefer Transitions For Interactive UI

CSS transitions retarget mid-animation. Keyframes restart from zero. For rapidly toggled interactive state, transitions are usually smoother.

### Use `will-change` Sparingly

Only add `will-change` when you observe first-frame stutter. Never use `will-change: all`. Useful candidates are `transform`, `opacity`, `filter`, and sometimes `clip-path`.

## Accessibility

### Reduced Motion

Reduced motion means fewer and gentler animations, not necessarily zero animation. Keep opacity and color transitions that aid comprehension. Remove movement and position animations.

```css
@media (prefers-reduced-motion: reduce) {
  .element {
    animation: fade 0.2s ease;
  }
}
```

### Focus States

Keyboard focus should be visible and stable. Prefer an outline or ring that does not move layout.

## Review Checklist

| Issue | Fix |
| --- | --- |
| `transition: all` | Specify exact changed properties |
| Hover lift on card/button | Remove hover transform; use stable color, border, background, or text feedback |
| Animated hover shadow | Remove `box-shadow` transition or avoid changing shadow on hover |
| Button press scale | Remove scale; use color, border, background, or opacity feedback |
| `scale(0)` entrance | Start around `scale(0.95)` with opacity |
| `ease-in` on entering UI | Use `ease-out` or a stronger custom curve |
| Duration over `300ms` on common UI | Reduce to `150-250ms` unless the component warrants more |
| Hover styles on touch | Gate with `@media (hover: hover) and (pointer: fine)` when appropriate |
| Popover scales from center | Use trigger-aware `transform-origin`; modals stay centered |
| Dynamic numbers shift layout | Add `font-variant-numeric: tabular-nums` |
| Nested radii look off | Use concentric radius math |
| Image edges look muddy | Use pure black/white low-opacity inset outline |
| Tiny controls | Ensure at least `40x40px` hit area |
