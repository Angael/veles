# Calorie tracking PR stack

The calorie tracker is split into eight draft pull requests so each capability can be reviewed and revised without reopening the entire feature. The branches are stacked: each branch is based on the branch immediately before it, and the documentation grows with the implementation.

## Stack order

1. `stack/calories-01-data` — defines calorie storage, validated server operations, and development fixtures.
2. `stack/calories-02-dashboard` — exposes the daily calorie dashboard and application navigation.
3. `stack/calories-03-goals` — adds daily calorie-goal editing.
4. `stack/calories-04-custom-logs` — adds quick custom entries and log editing or deletion.
5. `stack/calories-05-food-catalog` — adds shared food-product creation and editing.
6. `stack/calories-06-catalog-logging` — adds food search, serving quantities, and diary logging.
7. `stack/calories-07-barcode-lookup` — adds manual barcode lookup and missing-product handling.
8. `stack/calories-08-camera-scanner` — adds camera scanning and the completed end-to-end flow.

Review and iterate from the bottom of the stack upward. Changes to an earlier branch flow into every later branch after the stack is updated.

## Data foundation

The first PR adds three database concepts:

- A global food-product catalog with nutrition stored in hundredths.
- User-owned food-log snapshots that remain unchanged when a catalog product is edited later.
- Date-effective calorie goals, allowing a new goal without rewriting earlier diary days.

Server functions validate their inputs, require an authenticated session, and cover dashboard reads, goals, food products, food logs, and Open Food Facts imports. Development reset data includes common foods for local iteration.

Before this PR can merge, generate and review the Drizzle migration, then reset the development database and exercise the migrated schema. Drizzle commands remain human-run.

## Daily dashboard

The second PR makes calorie tracking visible at `/calories`. It adds local-date navigation, daily energy and macronutrient totals, calorie-goal progress, logged-food rows, and an empty state for days without entries. The authenticated application navigation links to the dashboard on both desktop and mobile layouts.

## Daily goals

The third PR adds a focused goal form. A goal has an effective date and a daily calorie target; the dashboard uses the newest goal effective on or before the selected diary date. Saving a later goal therefore preserves the target shown for historical days.

## Custom calorie logs

The fourth PR adds quick entries for calories that do not need a catalog product. A custom entry records a name, calories, and diary date. Every diary row can then be opened to change its name, date, quantity, or snapshotted nutrition values, or to delete it.

## Food catalog

The fifth PR adds forms for creating and editing global food products. Products can store a name, brand, barcode, image, package size, calories, and optional protein, carbohydrate, and fat values per 100 grams. Catalog edits affect future selections only; existing diary snapshots keep their recorded values.

## Logging catalog foods

The sixth PR adds a searchable food picker. Selecting a product opens a serving form with quantity in grams and the diary date. Saving calculates calories and macronutrients from the product's per-100-gram values and stores the result as a new immutable diary snapshot.
