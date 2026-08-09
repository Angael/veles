# Calorie tracker

- Users set an effective daily kcal goal and record food for a local calendar day.
- Foods are a global, Veles-owned catalog. Barcode lookup checks Veles first; Open Food Facts only supplies an editable starting record when kcal data is valid.
- A food requires kcal per 100 g. Protein, carbohydrates, and fat are optional. Logs snapshot nutrition so later catalog edits do not change history.
- Entry paths: typed barcode, camera barcode scan, catalog staple, or quick custom kcal.
- Camera scanning uses the native `BarcodeDetector` when available and lazily loads a polyfill otherwise; manual barcode entry always remains available.
- Initial unscannable staples: common fruit and breads.
- Later: ingredients reuse catalog foods in recipes; multilingual PL/EN typo-tolerant search moves to a dedicated search service.
