# Mobile navigation: Section Navigator (#253, alternative C)

![Polish mobile navigation at 320px and 390px](navigation-253-preview.png)

Preview: real application chrome rendered with fixture content, not live account data.
Independent Chromium review covered EN/PL at 320, 360, 390, 720, 900, and 1280px,
route switching, current states, selection takeover, focus layouts, and reduced motion.
The parent also ran the full check and build commands. Backend workflows were not exercised.

## TL;DR

On phones, the six-icon bottom bar becomes a two-level dock:

- Bottom row: three labeled **section controls**: Journal, Food, Activity.
- Top row: the selected section's two labeled **destination links**. This row is always visible.

| Section (EN / PL)    | Destinations (EN / PL)                 |
| -------------------- | -------------------------------------- |
| Journal / Zapiski    | Diary / Dziennik, Notes / Notatki      |
| Food / Jedzenie      | Calories / Kalorie, Recipes / Przepisy |
| Activity / Aktywność | Workouts / Treningi, Weight / Waga     |

A section control only changes which links the top row shows. Only a destination link navigates.
Desktop navigation, task/immersive chrome, and the selection-bar takeover do not change.

## Why this design

The issue: Diary, Notes, and Recipes look alike as 20px icons with no text. This design fixes that
with three things together:

1. **Visible text on every control.** Nobody has to learn a symbol before the first tap.
2. **Distinct silhouettes.** Notes becomes `StickyNoteIcon`, Recipes becomes `CookingPotIcon`.
   Diary keeps `NotebookPenIcon`. The three no longer share a "document" shape. Desktop pills and
   the home dashboard tiles use the same icon set, so one feature has one icon everywhere.
3. **Grouping by intent.** Writing (Journal), eating (Food), and training (Activity) each get one
   wide control. Each destination link gets half the dock width, so labels never truncate, also in
   Polish on a 320px screen.

## Icon and label hierarchy

- Section controls use a broad "category" icon: `FeatherIcon` (writing), `UtensilsIcon` (eating),
  `ActivityIcon` (training). These icons differ from all six destination icons, so a section is not
  confused with one of its pages.
- Section controls stack the icon over a short label (tab-bar style, 12px). Destination links put the
  icon beside a 14px label in a wide pill. The links are the larger text, because they are where you
  go; the sections are the switch that picks them.
- "Journal" in Polish is **Zapiski**, so it does not collide with Diary (**Dziennik**) or Notes
  (**Notatki**).

## States

Two different facts are shown, and they never share a visual:

| Fact                                 | Visual                                                         | Semantics                                                       |
| ------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------- |
| Which section's links are shown      | Control is joined to the link tray (same surface, strong text) | `aria-pressed="true"` (Base UI `ToggleGroup`), `aria-controls`  |
| Which section holds the current page | Accent bar under the label + semibold label                    | Visually hidden text "current page here" in the accessible name |
| Which link is the current page       | Filled primary pill, border, semibold, trailing dot            | `aria-current="page"` on the real `<a>`                         |

None of the current-page cues depend on color alone: the bar and the dot are shapes, the filled pill
changes contrast and weight.

### Route sync and pending state

- The **current section** is derived from the pathname on every render (no effect, no stored copy).
- A user choice is stored together with the pathname it was made on. On the first render that sees a
  different pathname, the component replaces it with "no choice" while rendering (React's "adjust
  state when a prop changes" pattern, not an effect). React re-renders before it commits, so the old
  row never paints, and the choice is deleted, not only hidden. Returning to the earlier pathname
  with Back/Forward, a link, or `replace` shows that page's own section; an old choice never comes
  back.
- Limit: the reset needs one render that sees the new pathname. Every router navigation renders the
  dock, so this holds for links and history moves. Two pathname changes merged into one React render
  (A to B to A with no render at B) would keep the choice; normal use cannot trigger this.
- If the dock unmounts (task or immersive page), the choice is lost too; it always starts empty.
- Search-only changes (for example the calories day picker) keep the choice, because the page did not
  change.
- Pressing the already-selected section does nothing (single selection cannot be cleared).

### Home, account, and other pages without a section

The dock shows the Journal links, with the Journal control joined to the tray (it is shown, so it is
`aria-pressed`). There is **no** accent bar on any section and **no** current link, so the dock does
not claim that the user is in Journal. Home and Account stay reachable through the existing header
(logo and account pill).

## Accessibility

- `<nav aria-label="Primary mobile navigation">` wraps both rows.
- Section controls are a Base UI `ToggleGroup` of native buttons: one tab stop, arrow keys move between
  sections, `aria-pressed` reports the shown section. No `tablist`/`tab` roles, because the link row
  is not a tab panel and the pattern would be incomplete.
- The link row is a `<ul>` labeled with the section name (`aria-label="Food"`), with `id` targeted by
  `aria-controls`.
- DOM order is sections first, then links; CSS shows the links above. Keyboard and screen-reader
  order is therefore "pick a section, then pick a page". After a section press, the next Tab reaches
  the new links.
- Every control and link is at least 44px tall and at least 44px wide.
- `:focus-visible` outlines use `--c-primary-focus`. Color and background transitions are short and
  drop to near-instant with `prefers-reduced-motion`; nothing moves position.

## Layout and spacing

- The dock keeps the shared `MobileDock` surface, position, width, and safe-area offset. Only the
  navbar's own children are taller; `--dock-item-height` and the `SelectionBar` are not touched.
- The dock is about 6.7rem tall instead of about 3.2rem. While the navbar is mounted, `body` gets two
  custom properties from `MobileNavbar.module.css`:
  - `--mobile-nav-reserve`: bottom padding of the section shell so the last page control can scroll
    above the dock. It stays set during a selection-bar takeover, so the page height does not jump.
  - `--mobile-nav-fab-offset`: bottom offset of `FloatingButton`. It is set only while the navbar is
    visible. When the selection bar or rest timer owns the dock, the button returns to its old offset.
- Pages without the navbar (task, immersive, logged out) keep the old values: both properties default to `4rem` in `theme.css`.

## Tradeoffs (honest)

- **Extra tap to cross sections.** Going from Diary to Recipes is two taps (Food, then Recipes) unless
  the Food row is already shown. Within a section it stays one tap. Six direct icons were one tap but
  unreadable.
- **Taller dock.** About 3.5rem more of the screen bottom is navigation on section pages. Page padding
  and the floating button move up to match, so nothing is covered, but less content fits.
- **Fixed grouping.** The pairs reflect a guess about use (Calories with Recipes, Workouts with
  Weight). Someone who switches between Diary and Calories pays the extra tap every time. #251
  (customization) is not part of this change; this structure would make it about sections, not six
  free items.
- **Home shows Journal links.** The Journal row on home is a neutral default, not "last used". Storing
  the last section would add persistence and a stale-state risk for little gain.
- **Section press does not navigate.** Some users expect a tab to open a page. Here it only switches
  the link row, which keeps paths stable but can feel like one step too many. No landing pages were
  added on purpose.
- **Visual order differs from DOM order.** Links render above sections but come after them for
  keyboard and screen readers. This is deliberate (choose a group, then a page) and documented here.
