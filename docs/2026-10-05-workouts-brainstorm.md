# Workouts brainstorm (#177)

Real feature: `/workouts` (list) and `/workouts/$id` (live session). Playground: `/demo/workouts`
(mock data, nothing saves). Schema: `packages/db/src/schema/workouts.schema.ts`.

## Read first: status and decisions

**Status.** Draft PR #225 (branch `feat/workouts-playground`). The branch now has the real live session: server functions, queries and routes. The playground stays until the real feature covers it, then it is deleted. The MCP plan is posted as a comment on PR #213.

**Before merging.**

1. The human runs `pnpm db:generate` and the migration on dev and prod before merging to `main`. Agents never run Drizzle commands. The schema is now exported from `packages/db/src/schema/index.ts`.
2. Delete `pages/workouts-demo` and `routes/demo.workouts.tsx` when the PoC is no longer needed.

**Real feature.**

- `/workouts` is a dashboard. Main column: "Current workouts" ("Continue" card for an unfinished workout, then routine cards: tap = start; long press = edit name and description, or delete), then the last 10 workouts with "All workouts →" (`/workouts/history`). Side column: a 26-week calendar and a "Stats" card (this week, this month, week streak, average length). A floating "Start workout" menu holds "Empty workout" and every routine; while a workout is open it becomes "Continue workout". The per-exercise progress list was removed in favour of recent workouts.
- Calendar: one hue, brightness by training time per day, full at 2 h. An unfinished workout counts until its last ticked set. Tap a square to open that day's workout.
- `/workouts/$id` (`layout: 'task'`): the live session. Every edit is saved at once. Ticks, set types and structure changes are sent right away; dragged values are sent 600 ms after the drag pauses, and on tab hide or leave. The cache is patched first, and the session refetches when the last request settles.
- Session "⋯" menu: "Save as new routine" (name + optional description, links the session) and "Update routine 'X'" (overwrites the linked routine).
- Routines store exercises in order, set count and set types only. No target weights or reps: last time's values are the goal. The description lives in `workout.notes`.
- Set cells show a grey unit (`kg`, `reps`, `km`). With no last time, empty cells show 40 kg / 12 reps / 1:00 / 5 km. Ticking a set with an empty cell and no last time opens the sheet; Save logs the shown values and finishes the set.
- Exercise picker: ↑/↓ through results and the Create row, ←/→ change the tracking type on the Create row, Enter picks. Clicking a tracking type creates the exercise. The tracking guess knows common Polish names (pompki, podciąganie, deska, bieg, spacer farmera…); loaded variants stay weight × reps.
- Finish sets `ended_at` and goes back to `/workouts` (`replace`). A finished workout shows "Reopen".
- One open workout at a time. The server refuses to start or reopen another; the dashboard shows only "Continue" and routine cards cannot start while a workout is open.
- Auto-finish: every session edit bumps `workout.updated_at`. On read (list, session, calendar) and before starting or reopening, a workout with no edit for 2 h gets `ended_at = updated_at`, so its length stops at the last edit. No worker job; the result is the same whenever the user next opens the app.
- The rest timer stores the workout that started it. Finishing stops it, and a finished workout never shows it.
- Workout rows (recent and history): long press → "Save as routine" or "Delete".
- Rename, tracking mode and rest length are saved on the exercise. Notes are per workout (`workout_exercise.notes`).
- "Previous" values and the note placeholder come from the latest earlier session of the same exercise, ordered by `(date, id)` (UUIDv7). A new exercise in a session starts with as many empty sets as last time.
- Code: `pages/workouts/` → `workouts.*` (list, start, rename, finish, delete, session loader), `WorkoutList.tsx`, `dashboard/`, `history/`, `routines/`, `session/`, `exercises/`, `scrub/`, `rest/`, `hints/`, `metrics.ts`.
- Not built yet: editing a routine's exercises outside a session, quick log without sets, MCP tools.

**Decided (current behaviour wins over older rounds below).**

- Rest timer: **A, dock pill** (takes the phone dock slot like `SelectionBar`). The timer stores `endsAt`.
- Set input: **drag cells** in compact rows. A whole workout fits on the screen. Tap a cell → **top sheet**.
- Drag: on touch, finger right = smaller value (ruler). With a mouse, drag right = bigger value. Speed picks the step (weight 0.5 → 1 → 2.5 → 5, reps 1 → 2 → 5, time 5 → 15 → 30 → 60 s). Values stop at 0. The ruler has a taller mark every 5th tick. No visible step, speed or ± indicators.
- Sheet: exercise name + "Set N", "Last time … use", 1–2 drag fields (tap a number to type), **Save**. Edits a draft. No set navigation, no ± buttons, no step setting. Save does not start the rest timer.
- Rows: set badge (tap cycles Normal/W/D/F) │ 1–2 cells │ tick. No "previous" column: last time's values are the grey ghost text. Ticking an empty set copies the ghost values and starts the rest timer. Ticking a set above an already done set does not start or restart the timer (the user forgot to tick it).
- Taps act on `click`, not `pointerup`. Long press opens only the context menu, never the sheet.
- Context menus (long press / right click) hold the rare actions: set type, duplicate, delete, rename, track mode, rest length, reorder. The rest length is only in the menu (no chip on the card).
- "Add set" copies the last set. It is the only add button on the card.
- Exercises: only the user's own names, no global catalog. Fuzzy search (typos, swapped letters, accents, missing spaces). Create from the search text with a guessed tracking mode (grid picker, no empty cells).
- Notes: one per exercise per workout (`workout_exercise.notes`). Always visible as a `SeamlessTextarea` under the title, no toggle. Last time's note is the placeholder. The history dialog shows numeric dates (`Thu 02.10`) and a "#2 of 5" position badge.
- First-use tips: only "drag" and "hold for more". Smooth demos that show the press. "Tick to finish" and "tap for details" are not needed.
- Card header: the exercise order number (1, 2, 3…), then the title, which wraps. The history button stays at the top right.
- Tips: a compact strip inside the first exercise card, right above the set rows: small demo, title, close. No description text; the demo shows the gesture.

**Rejected (do not bring back).** Rest timer B (corner ring) and C (inline). "Type in cells". "Type it" input. One tap input. Tip description text. Supersets. Any typed set shorthand ("Add several…", "Type it"): too much typing on a phone keyboard. Rest chip on the card. Note toggle button. Per-exercise or visible weight-step selection. ± stepper buttons. Speed bar and `±x` badge. Set navigation in the sheet. "Done, start rest" in the sheet. Negative weights (assisted machines log the assist as a positive number). Set-type letters in history. Tips for obvious actions.

**User preferences for this feature.** Mobile first, desktop also important. Few buttons; context menus for extras. The first experience must be clear to a non-technical user. Short demos beat text. Keep exploring in the playground before building the real feature.

**Code map** (`apps/web/src/pages/workouts-demo/`). `scrub/` (drag hook and cells), `session/` (cards, rows, sheet, notes, history, `metrics.ts`), `rest/` (timer), `library/` (picker, fuzzy search, measure grid), `hints/` (tips and demos), `mockData.ts`. Route: `routes/demo.workouts.tsx`. Shared change: `ContextMenuSubmenuRoot/Trigger` in `components/ui/context-menu`.

**Not verified.** No browser or phone testing by agents. Gesture feel (speed tiers, long press vs drag) needs a real-device check.

| App                                                                                                                                                               | What to steal                                                                                                                                | What to skip                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [Strong](https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577) ([screens](https://screensdesign.com/showcase/strong-workout-tracker-gym-log)) | Spreadsheet set rows: `set │ previous │ kg │ reps │ ✓`. Checking a set starts the rest timer. Empty cells adopt "previous". Set types W/D/F. | Paywall on routines; built-in exercise catalog. |
| [Hevy](https://www.hevyapp.com/features/track-workouts/) ([Play Store screens](https://play.google.com/store/apps/details?id=com.hevy))                           | Tap the set number to change its type. Per-exercise rest timer. Supersets via the exercise `⋯` menu. Swipe-to-delete sets.                   | Social feed, big catalog with animations.       |
| [FitNotes](https://play.google.com/store/apps/details?id=com.github.jamesgay.fitnotes) ([site](http://www.fitnotesapp.com/))                                      | Calendar-first, very plain. Your own exercise names. Weight increment setting.                                                               | Old Android UI, many screens per set.           |
| [Liftosaur](https://www.liftosaur.com/doc/liftoscript)                                                                                                            | Text syntax `Bench Press / 3x8 / 100lb`, `@8` for RPE. Proves typed sets work for power users.                                               | Full scripting language is too much.            |
| [Setgraph](https://apps.apple.com/us/app/setgraph-workout-tracker/id1209781676)                                                                                   | One exercise at a time, huge numbers, very few taps.                                                                                         | —                                               |

Common pattern: **the set row is a tiny spreadsheet**, and **the rest timer starts itself when you tick a set**. Everything else (type, notes, supersets, reorder) hides behind a tap on the set number or a `⋯`/long press. That maps well onto our existing `ContextMenu`.

## Round 4 feedback and fixes

- **Shorthand matches the exercise**: `42s` is invalid for weight × reps and stays valid for time. Unsupported metrics show a red error with examples; Add stays disabled until every group is valid. Changing the tracking mode rechecks the text. Placeholders and the typing animation use that mode's syntax. ArkType checks the parsed metrics; empty groups with only metadata cannot create blank sets.
- **Ruler marks**: every fifth tick is taller and wider, so fast movement is easier to see. Both layers move together with the pointer.
- **Touch taps and holds**: taps open the sheet on click, after the touch's pointer-up. Opening the context menu cancels the pending cell gesture, so releasing a long press does not also open the sheet. Dragging, vertical scrolling and canceled pointers do not count as taps. Keyboard activation still works.
- **Long exercise names**: the title has its own full-width row and wraps, including names without spaces. Note, history and rest controls sit below it. Cards can shrink inside the page grid. The sheet title wraps too.

Validation: `pnpm check:fix`; no new tests, browser checks or dev server.

## Round 3 feedback and changes

Round 3 made things simpler. Some round 2 items below were changed or removed here.

- **Drag direction**: on touch, the value follows the finger like a ruler, so moving the finger right makes the value smaller. With a mouse, dragging right makes it bigger.
- **No step setting**: speed alone picks the step. Weight goes 0.5 → 1 → 2.5 → 5, reps go 1 → 2 → 5, and time goes 5 → 15 → 30 → 60 s. `exercise.weight_step_grams` is removed.
- **Never below zero**: dragging stops at 0. Weight, reps, time and distance cannot be negative (DB check, parser, mock data). Assisted machines log the assist weight as a positive number.
- **Less noise while dragging**: no speed bar, no `±` badge, no − / + buttons. The value and the ruler are enough.
- **Simple sheet**: exercise name, "Set N", "Last time … use", the 1–2 drag fields, and **Save**. Changes go into a draft and are applied only on Save. No set navigation, no step grid, and no rest timer start.
- **No "previous" column**: the "—" text looked like a set name. Last time's values are already the grey ghost text in each cell and in the sheet.
- **History dialog**: short numeric dates (`Thu 02.10`), no set-type letters, no subtitle.
- **Tips**: removed "tick to finish" and "tap for details" because users already expect both. Demos now move smoothly (requestAnimationFrame) and show the press. Touch screens show a finger dot; desktop shows a cursor that shrinks when clicking, with a ring. The layout no longer overflows on phones.
- **Page width fix**: the page grid now uses `minmax(0, 1fr)`, so the wide tab strip scrolls inside the page and does not stretch it.

## Round 2 feedback and changes

Superseded in part by round 3: step grid, ± buttons, speed bar, set navigation and the tick/sheet tips are removed.

Picked so far (★ in the playground):

- **Rest timer A** (dock pill).
- **Drag sideways** as the main set input, with the **top sheet** as its detail view. Rows stay small, so the whole workout fits on screen.

Changes in round 2:

- **Accelerated drag** (`scrub/useScrub.ts`): pointer speed is measured and smoothed. Slow drag gives less than one step per 14 px, so it is extra precise. A fast flick covers big ranges and snaps to the coarse step (2.5 kg, 5 reps, 15 s). The field shows a live speed bar and `±0.5` / `±2.5`, so the user can see the effect.
- **Drag hints**: small ‹ › chevrons on touch screens (hover only on desktop). A tick ruler slides under the value while you drag. Android gives a 3 ms haptic tick per step.
- **Drag cells in the session**: drag a cell to change it, tap it to open the sheet. "Type in cells" stays as the other option.
- **Top sheet** (`session/SetSheet.tsx`): drops from the top. It has ‹ Set 2 of 4 › navigation, "Last time … use", drag fields with − / +, and a fixed 4-cell **weight step** grid (0.5 / 1 / 1.25 / 2.5). The number box has a fixed width, so 90 → 92.5 does not move anything. The step is saved per exercise (`exercise.weight_step_grams`), so dumbbells can go 6, 7, 8, 9.
- **Fuzzy exercise search** (`library/fuzzySearch.ts`): typos, swapped letters (`bnech`), missing spaces (`benchpress`), accents (`łąka`), any word order. Close matches come first; "Create" is the last option.
- **Tracking grid** (`library/MeasurePicker.tsx`): big cells with icons. On phones there are 3 cells on top and 2 wide cells below, so there is no empty space. Wider screens show one row of 5.
- **Notes per workout per exercise**: note icon in every card header. A dot means last time has a note. Last time's note is the placeholder.
- **Exercise history**: history icon → earlier sessions, each with a **#2 of 5** badge (position in that workout), sets and note.
- **Clearer add buttons**: "Add set" (copies the last set) and "Add several…". The second one shows a looping typewriter demo (`80x5x3` → 3 chips) before you type.
- **First-use tips** (`hints/`): looping mini demos (drag, tick → rest, tap → sheet, hold → menu, type sets). The session shows one tip at a time until it is dismissed. "?" in the header shows them again. The "Hints" tab shows all of them.

## Ideas in the playground (round 1)

The original exploration. See "Read first" for what was kept.

### Live session (tab "Live session")

- Exercise card. Header: user's own name + rest chip (tap cycles off → 0:45 → … → 3:00).
- Header context menu: rename, note, **Track** submenu (weight×reps / reps / time / weight+time / distance+time), **Rest timer** submenu, superset with next, move up/down, remove.
- Set row: `badge │ previous │ 1–2 cells │ ✓`. Badge tap cycles Normal → W → D → F. Row context menu: type submenu, duplicate, "same as last time", delete.
- Ticking an empty set copies last time's values (Strong behaviour). Enter jumps to the next cell.
- `+ Set` copies the last set. `Type sets` opens the shorthand field inside the card.
- Supersets get a colored left rail; no extra buttons.
- Desktop: cards flow into two columns; right click works everywhere.

### Rest timer (switch above the session)

- **A · Dock pill**: takes over the phone dock like `SelectionBar`; the pill drains as progress. `−15 / +15 / ×`.
- **B · Corner ring**: small ring, tap to grow, long press for +15 / +1 min / skip.
- **C · Inline**: thin draining bar right under the set you just finished.
- All three: timer stores `endsAt`, not a counter, so it survives reload / sleep / tab switch. Shows `+0:12` overtime in green. Vibrates on Android (iOS Safari has no Vibration API).
- Later: Wake Lock API to keep the screen on; a Web Notification when the tab is hidden.

### Set input (tab "Set input")

- **A · Type it**: `60x8, 70x6, 80x4x2`, `w40x10`, `80x5!`, `x12x3`, `45s`, `24kg 45s`, `5.2km 28:10`, `@8`. Live chips preview. Same parser can back an MCP write tool.
- **B · One tap**: the next set is a big button. Tap logs it; long press nudges ±2.5 kg / ±1 rep.
- **C · Stepper sheet**: tap a row → bottom sheet with huge numbers, ± buttons, plate chips, "last".
- **D · Scrub**: drag a number sideways to change it (Figma style); tap to type.

### Exercises (tab "Exercises")

- No global catalog. The picker searches only the user's exercises, sorted by use.
- No match → "Create “Morning plank”" with a **guessed** tracking chip (plank → time, run → distance, dips → reps, else weight×reps).
- Row context menu: progress chart, rename, track, **Merge into…** (fixes "Bench" vs "bench press"), archive.

### Workouts home (tab "Workouts")

- User-named routines as cards; tap = start, long press = edit/duplicate/delete.
- History list; long press = edit, **Repeat today**, **Save as routine**, delete.
- **Log activity**: the original #177 scope. Name + duration chips + note, no sets ("Football, 90 min").

## Schema proposal

Four tables. All metric columns are nullable, so changing what an exercise tracks never loses data.

```
exercise          id, user_id, name (unique per user, case-insensitive), measure, rest_seconds,
                  notes, archived_at
workout           id, user_id, kind ('routine' | 'session'), name, notes, routine_id → workout,
                  date (sessions only), started_at, ended_at, duration_seconds (manual log)
workout_exercise  id, workout_id, exercise_id (restrict), position, rest_seconds (override), notes
workout_set       id, workout_exercise_id, position, type ('normal'|'warmup'|'drop'|'failure'),
                  weight_grams, reps, duration_seconds, distance_meters,
                  rpe_tenths, completed_at
```

- **One `workout` table for routines and sessions.** Starting a routine copies its rows into a new session. Editing a routine never rewrites history. A routine's sets are targets; a session's sets are actuals.
- "Previous" column: last session's set at the same position for the same `exercise_id`.
- `weight_grams` follows `weight_entry.weight_grams`. `rpe_tenths` follows the `*_hundredths` integer style.
- Ownership: `exercise` and `workout` have `user_id`; child rows inherit via joins (same as `list_item` in the MCP PR).
- Alternative: store sets as `jsonb` on `workout_exercise`. Fewer rows and simpler writes, but harder SQL for progress charts and the MCP list/get tools. I prefer real rows.

## MCP (#188 / #213)

- Read: add `exercises`, `workouts`, `workout_exercises`, `workout_sets` to the `resources` map in `mcp.api.ts`. Child tables scope through `inArray(… select id from workout where user_id = …)` like `list_items`.
- Units live in column names (`weight_grams`, `duration_seconds`, `distance_meters`, `rpe_tenths`), so the resource descriptions stay one line.
- Write (later): one `log_workout` tool that takes `{ date, name, exercises: [{ name, sets: [{ weight_grams, reps }] }] }`. It finds or creates exercises by case-insensitive name. The shorthand parser was removed with "Type it".

## Open questions

1. ~~Which rest timer variant?~~ A (dock pill).
2. ~~Which set input is the default?~~ Drag cells + top sheet. No typed shorthand.
3. Should a tip auto-hide after the user does the action once, for example hide the drag tip after the first drag?
4. Navbar slot: `Workouts` as a 6th item, or group under an existing item?
5. kg only, or a per-user lb setting?
6. Keep the live session in `localStorage` until "Finish", or save every set to the server as it's ticked? Saving each set is safer if the phone dies mid-workout.
