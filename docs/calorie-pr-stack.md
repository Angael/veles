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
