# Calorie tracker

## Decisions

- `/calories` shows one Monday–Sunday week, the selected day's kcal/macro summary, full-width log, and three plain entry buttons.
- Entry flows preserve an explicit local `YYYY-MM-DD` diary date.
- Foods are global and editable by every authenticated user. A barcode is unique; barcode-less foods may be duplicated.
- Foods require kcal per 100 g. Protein, carbohydrates, fat, barcode, image, brand, and product size in grams are optional. Product size pre-fills the amount when logging.
- Logs snapshot nutrition so catalog edits do not change history. Missing macros contribute zero to daily totals.
- Scanning is a two-step flow: full-viewport camera/manual barcode, then found-product quantity/date entry. A missing barcode offers product creation.
- Camera capture requests continuous autofocus when supported. Native `BarcodeDetector` is preferred; the polyfill remains lazy.
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
- [x] Allow first-party camera access through the response Permissions Policy
- [x] Improve camera focus and full-viewport scanning
- [x] Replace day links with a Monday-first Base UI ToggleGroup
- [x] Consolidate daily summary and simplify entry buttons
- [x] Add full nutrition log rows with edit/delete actions
- [x] Add logged-entry editing with a link to edit its food
- [ ] Verify the complete authenticated flow after the dev schema is pushed

## Verification

- `pnpm check:fix` passes: typecheck plus 33 tests across 10 files.
- Camera autofocus is feature-detected; unsupported browsers retain their native camera behavior.
- Authenticated camera and diary verification requires the human-run `pnpm db:push` and an authenticated phone/browser session.

Development uses `pnpm db:push` run by the human. Generate a migration only when the feature and schema are settled.
