# Mobile navigation: Essentials + More (#253)

![Polish mobile navigation at 320px and 390px](navigation-253-preview.png)

Preview: real application chrome rendered with fixture content, not live account data.
Independent Chromium review covered EN/PL at 320, 360, 390, 720, 900, and 1280px,
route switching, current states, selection takeover, focus layouts, and reduced motion.
The parent also ran the full check and build commands. Backend workflows were not exercised.

## TL;DR

Phones get a roomy four-item dock: **Diary, Notes, Calories, More**. Every item shows an icon and
a visible label. **More** opens a bottom sheet that lists **all six** destinations with an icon,
a label, and a one-line description, and marks the current one. Desktop navigation, task and
immersive chrome, and the selection-bar takeover keep their current behavior.

## Problem

The phone dock shows six icon-only links at 20px. Diary (`NotebookPenIcon`), Notes
(`ListTodoIcon`), and Recipes (`BookOpenIcon`) all read as "a page with lines". People must
learn the icons or tap to find out.

## Selected design

### Dock (phone only, `--phone`)

| Slot | Icon             | EN       | PL       |
| ---- | ---------------- | -------- | -------- |
| 1    | `BookHeartIcon`  | Diary    | Dziennik |
| 2    | `StickyNoteIcon` | Notes    | Notatki  |
| 3    | `FlameIcon`      | Calories | Kalorie  |
| 4    | `LayoutGridIcon` | More     | Więcej   |

- Icon above a short visible label in each slot. The item is 44px high (`--dock-item-height`
  goes from 2.2rem to 2.75rem) and about 80px wide on a 360px screen.
- Destination items are plain router links. TanStack Router puts `aria-current="page"` and
  `data-status="active"` on the link for the current section (segment-aware prefix match).
- The current item gets a filled pill, a stronger text color, and a semibold label. The filled
  shape and the weight change carry the state, so it does not depend on color alone.
- More is a real `<button>` (Base UI `Dialog.Trigger`, so it has `aria-haspopup` and
  `aria-expanded`). When Recipes, Workouts, or Weight is current, More shows the same filled
  state and its accessible name adds the current page ("More, current page: Recipes"). It has
  no `aria-current`, because it is not a link to that page.
- The order is fixed: Diary, Notes, Calories. This is a starting hypothesis for quick logging,
  not a measured usage pattern. Recipes, Workouts, and Weight are in More; #251 can let users
  choose a different direct set.

### More sheet

- Uses the shared `DialogPopup`, which already docks to the bottom on phones. Base UI supplies
  the focus trap, Escape, backdrop dismissal, scroll lock, and focus return to More.
- The header has the title "All sections" / "Wszystkie sekcje" and an explicit 44px close
  button (`XIcon`, "Close" / "Zamknij").
- One column with six rows, in dock order first and then the rest: Diary, Notes, Calories,
  Recipes, Weight, Workouts. Each row has an icon tile, a label, and a short description that
  separates look-alike sections in words ("Private, encrypted journal" against "Lists and quick
  notes"). The rows are at least 56px high.
- The current row has a filled surface, a border, `aria-current="page"`, and a visible
  "You are here" / "Jesteś tutaj" tag.
- Each link closes the sheet on click, also for the page that is already open. When the
  pathname changes while the sheet is open (for example, browser back), the sheet closes too.
- Animation is the shared dialog fade and slight scale. Reduced motion keeps only the fade.
- The sheet adds the bottom safe-area inset so the last row clears the home indicator.

### Cohesive icons

The new icons are used in all places for the same destination: desktop pills, phone dock,
sheet, and dashboard tile headings (Diary `BookHeartIcon`, Notes `StickyNoteIcon`, Recipes
`ChefHatIcon`). Each silhouette is different: a closed book with a heart, a square note with a
folded corner, and a chef hat.

### Preserved behavior

- Desktop and tablet: the same six labeled pills in the same order, only with the new icons.
- `layout: 'task' | 'immersive'`: no dock, as before.
- Selection bar and rest timer: they still take over the dock slot through the `.selectionBar`
  class. They now get the taller 44px slot height, which matches the navbar again.
- Floating action and page clearance: the hard-coded `4rem` offsets become `--dock-clearance`
  (item height + 1.8rem), which keeps the same gap above the taller dock. The safe-area insets
  stay.

## Tradeoffs

- **An extra tap for Recipes, Workouts, and Weight.** This is the main cost. The filled More
  state shows where you are, and the sheet shows the full map in one tap.
- **The sheet repeats the dock items.** This is intentional. The sheet is a complete map, and
  it keeps working when #251 lets users hide dock items.
- **A taller dock (about 7px).** This takes a little more vertical space, but each target is
  44px high with a readable label.
- **Fixed primary set.** Someone who mostly logs workouts must use More until #251 ships.
- **The sheet does not close automatically when the viewport grows past `--phone`.** It then
  shows as a centered dialog, which still works.
- **The PL labels are longer** ("Dziennik", "Notatki"), but they fit at about 80px per slot.
  Labels truncate with an ellipsis instead of wrapping.

## Alternatives not selected

- Six labeled tabs: about 55px per slot on a 340px screen. Polish labels become too small.
- Grouped sections (Journal / Food / Activity): this changes known paths and needs new landing
  pages.
- Menu-only or drawer: every switch costs an extra tap.

## Path to #251 (not implemented here)

- `MOBILE_DOCK_ITEM_KEYS` in `navbarItems.ts` is the only source of the direct tabs.
  #251 can replace it with a persisted user preference (order and visibility) and pass it to
  `MobileNavbar`.
- More stays fixed and cannot be hidden. The sheet always lists all destinations, so all
  destinations stay reachable when every direct tab is hidden. The sheet is also a natural home
  for the accessible "Edit navigation" alternative that #251 needs instead of press-and-hold.
- No persistence or edit UI is added now.
