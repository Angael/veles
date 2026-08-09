# Calorie tracker

## Decisions

- `/calories` is a seven-day diary overview with logged entries, kcal/macro progress, and three actions: add food, scan barcode, and quick add.
- Entry flows use dedicated routes and preserve the selected local `YYYY-MM-DD` diary date.
- Foods are global and editable by every authenticated user. A barcode is unique; barcode-less foods may be duplicated.
- Foods require kcal per 100 g. Protein, carbohydrates, fat, barcode, image, brand, and product size in grams are optional. Product size pre-fills the amount when logging.
- Logs snapshot nutrition so later catalog edits do not change history. Missing macros remain unknown rather than becoming zero.
- Barcode scanning uses the first detected code, with native `BarcodeDetector` first and a lazy polyfill fallback. Manual barcode entry lives inside scanning as a fallback.
- A missing scanned barcode stays pinned while scanning continues and offers **Create this product**.
- Current goals have required kcal and optional macro targets on a dedicated page. Saving upserts the goal effective today; historical goals are not editable.
- Open Food Facts only bootstraps Veles-owned foods. Later recipe ingredients will reuse foods; PL/EN typo-tolerant search is deferred to a dedicated search service.

## Progress

- [x] Initial global food, log, and effective-goal schema
- [x] Initial Open Food Facts lookup and lazy barcode scanner
- [x] Initial staple seed catalog
- [x] Add macro goal fields and product size in grams
- [x] Add global food search and editing APIs
- [x] Replace combined calorie screen with seven-day diary overview
- [x] Add dedicated food search/create route
- [x] Add dedicated barcode scanner route
- [x] Add dedicated quick-add route
- [x] Add dedicated current-goals route
- [x] Add dedicated global food edit route
- [ ] Verify the complete authenticated flow after the dev schema is pushed

## Verification

- `pnpm check:fix` passes: typecheck plus 33 tests across 10 files.
- The dev server starts and unauthenticated routing correctly redirects `/calories` to Google login.
- Authenticated browser verification is pending the human-run `pnpm db:push` and an authenticated browser session.

Development uses `pnpm db:push` run by the human. Generate a migration only when the feature and schema are settled.
