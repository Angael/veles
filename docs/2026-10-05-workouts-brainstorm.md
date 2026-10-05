# Workouts brainstorm (#177)

Playground: `/demo/workouts` (mock data, nothing saves). Draft schema:
`packages/db/src/schema/workouts.schema.ts` (not exported, so drizzle-kit ignores it).

## How other apps do it

| App                                                                                                                                                               | What to steal                                                                                                                                | What to skip                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [Strong](https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577) ([screens](https://screensdesign.com/showcase/strong-workout-tracker-gym-log)) | Spreadsheet set rows: `set │ previous │ kg │ reps │ ✓`. Checking a set starts the rest timer. Empty cells adopt "previous". Set types W/D/F. | Paywall on routines; built-in exercise catalog. |
| [Hevy](https://www.hevyapp.com/features/track-workouts/) ([Play Store screens](https://play.google.com/store/apps/details?id=com.hevy))                           | Tap the set number to change its type. Per-exercise rest timer. Supersets via the exercise `⋯` menu. Swipe-to-delete sets.                   | Social feed, big catalog with animations.       |
| [FitNotes](https://play.google.com/store/apps/details?id=com.github.jamesgay.fitnotes) ([site](http://www.fitnotesapp.com/))                                      | Calendar-first, very plain. Your own exercise names. Weight increment setting.                                                               | Old Android UI, many screens per set.           |
| [Liftosaur](https://www.liftosaur.com/doc/liftoscript)                                                                                                            | Text syntax `Bench Press / 3x8 / 100lb`, `@8` for RPE. Proves typed sets work for power users.                                               | Full scripting language is too much.            |
| [Setgraph](https://apps.apple.com/us/app/setgraph-workout-tracker/id1209781676)                                                                                   | One exercise at a time, huge numbers, very few taps.                                                                                         | —                                               |

Common pattern: **the set row is a tiny spreadsheet**, and **the rest timer starts itself when you tick a set**. Everything else (type, notes, supersets, reorder) hides behind a tap on the set number or a `⋯`/long press. That maps well onto our existing `ContextMenu`.

## Ideas in the playground

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
workout_exercise  id, workout_id, exercise_id (restrict), position, superset_group,
                  rest_seconds (override), notes
workout_set       id, workout_exercise_id, position, type ('normal'|'warmup'|'drop'|'failure'),
                  weight_grams (negative = assisted), reps, duration_seconds, distance_meters,
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
- Write (later): one `log_workout` tool that takes `{ date, name, exercises: [{ name, sets: "80x5x3, 85x3" }] }`. It reuses the shorthand parser and finds or creates exercises by case-insensitive name. An agent can then log "bench 3x5 at 80" with no extra API.

## Open questions

1. Which rest timer variant (or a mix: dock on phone, inline on desktop)?
2. Which set input is the default? Proposal: table rows by default, shorthand as the power-user path, stepper sheet maybe later.
3. Navbar slot: `Workouts` as a 6th item, or group under an existing item?
4. kg only, or a per-user lb setting?
5. Keep the live session in `localStorage` until "Finish", or save every set to the server as it's ticked? Saving each set is safer if the phone dies mid-workout.
