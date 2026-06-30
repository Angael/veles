# Recipe Editing PRD

## Purpose

Make recipes editable while keeping the first implementation small, low-friction, and safe for the existing recipe/photo model.

This document anchors the PR stack for recipe editing work. Each PR should reference this file and keep scope narrow.

## Goals

- Recipe view edit action opens a working edit page.
- Add and edit flows both support setting recipe portion count.
- Recipe rating stars on the view page persist changes.
- Rating changes feel instant through optimistic UI.
- Rating failures are communicated with styled app toasts.
- Recipe metadata mutations use server functions where possible.
- Keep recipe photo editing out of the initial edit flow.

## Non-Goals

- Editing, replacing, deleting, or reordering recipe photos.
- Refactoring the existing atomic recipe upload route in this stack.
- Implementing recipe deletion unless explicitly pulled into a separate PR.
- Adding GitHub Actions or CI/CD workflow changes.

## Decisions

- Photo editing is skipped for now.
- Recipe `portions` is editable in both add and edit flows.
- New recipes default to `1` portion.
- Recipe base `portions` should be a positive whole number.
- Rating can be changed to values `1` through `5`.
- Clicking the current rating must not unset the rating.
- Same-rating clicks should be treated as no-ops unless implementation simplicity strongly favors resubmitting.
- Rating UI should be extracted from `RecipeViewPage` into its own component.
- Rating mutation logic should live with that rating component, while the server function lives in recipe API code.
- Rating updates should be optimistic and roll back on failure.
- Rating updates should invalidate the router after successful mutation so loader data catches up.
- Toast components, styling, and helpers should live under `src/components/toast`.
- Use Base UI Toast from `@base-ui/react/toast`.
- Prefer server functions for recipe metadata mutations.
- Keep API routes only where they are clearly better, currently the atomic file upload path.

## Current Context

- `src/pages/recipes/RecipeViewPage.tsx` renders the recipe detail page.
- `src/pages/recipes/AddRecipePage.tsx` owns the current add form and posts to `/api/recipes/upload`.
- `src/pages/recipes/EditRecipePage.tsx` exists but is currently a placeholder.
- `src/routes/recipes/view.$id_.edit.tsx` already loads a recipe and renders `EditRecipePage`.
- `src/pages/recipes/recipes.api.ts` already contains recipe read server functions.
- `src/routes/api/recipes/upload.ts` performs atomic recipe creation with file upload.
- The recipe schema already has `portions`, `rating`, and nutrition fields.

## Target UX

- On recipe view, the title has an inline icon-only edit button after it.
- On recipe view, rating stars immediately reflect the clicked value.
- If rating save succeeds, the page data is invalidated in the background.
- If rating save fails, the stars return to the previous value and a toast explains the failure.
- The edit page starts with existing recipe values.
- The edit page saves metadata and returns to the recipe view on success.
- Existing photos remain visible on the recipe view but are not editable from the edit form.
- On mobile, delete action moves to the bottom of the page.

## PR Stack

Current point: PR 3 is implemented locally and ready for review. PR 4 has not started.

### PR 1: PRD And Toast Infrastructure - Implemented Locally

Create this document and add reusable app toast support using Base UI.

Expected files:

- `docs/RECIPE_EDIT.md`
- `src/components/toast/ToastProvider.tsx`
- `src/components/toast/ToastProvider.module.css`
- `src/components/toast/toastManager.ts`
- `src/routes/__root.tsx`

Requirements:

- Toast provider is mounted once near the app root.
- Toast styling uses CSS modules.
- Expose a low-friction toast manager for client components.
- Keep all toast-specific code inside `src/components/toast`.

Implemented notes:

- `ToastProvider` is mounted from the root route.
- Toasts use `@base-ui/react/toast` with a shared `toastManager`.
- Toast styles include theme backdrop blur, a light custom shadow, stacked motion, and an icon-only dismiss button.
- The CSS token test allows `--toast-` local/runtime variables.

### PR 2: Editable Rating - Implemented Locally

Move rating UI into its own component and persist rating changes.

Expected files:

- `src/pages/recipes/RecipeRating.tsx`
- `src/pages/recipes/RecipeRating.module.css` or existing recipe view CSS if smaller
- `src/pages/recipes/RecipeViewPage.tsx`
- `src/pages/recipes/recipes.api.ts`

Requirements:

- Add an `updateRecipeRating` server function.
- Validate input with `arktype` and `arkTypeValidator`.
- Use log middleware on the server function.
- Only allow updating recipes owned by the current user.
- Optimistically update stars on click.
- Roll back local rating on failure.
- Show a toast on failure.
- Invalidate the router on success.
- Never unset rating through the star UI.

Implemented notes:

- `RecipeRating` owns the star UI, optimistic local state, same-rating no-op, rollback, and failure toast.
- `updateRecipeRating` validates `{ id, rating }`, uses log middleware, and scopes updates to the signed-in owner.
- Successful saves invalidate the router so loader data catches up.

### PR 3: Portions In Add Flow - Implemented Locally

Add portion count support to recipe creation.

Expected files:

- `src/pages/recipes/AddRecipePage.tsx`
- `src/routes/api/recipes/upload.ts`

Requirements:

- Add `portions` to the add draft.
- Default `portions` to `1`.
- Render a positive whole-number portions input.
- Validate `portions` in the upload API route before insert.
- Insert `portions` into the recipe row.

Implemented notes:

- Add form draft defaults `portions` to `1` and renders a required positive-number input.
- Upload validation parses `portions` as a positive whole number.
- Recipe creation inserts the validated `portions` value.

### PR 4: Edit Form

Implement metadata editing without photo editing.

Expected files:

- `src/pages/recipes/RecipeForm.tsx`
- `src/pages/recipes/RecipeForm.module.css` or reused add-page CSS if smaller
- `src/pages/recipes/AddRecipePage.tsx`
- `src/pages/recipes/EditRecipePage.tsx`
- `src/pages/recipes/recipes.api.ts`

Requirements:

- Share form UI between add and edit if it keeps code smaller.
- Edit form includes name, description, ingredients, tags, portions, rating, kcal, protein, carbs, and fats.
- Edit form does not include photo editing controls.
- Add an `updateRecipe` server function.
- Validate input with `arktype` and `arkTypeValidator`.
- Use log middleware on the server function.
- Only allow updating recipes owned by the current user.
- Set `updatedAt` during update.
- Navigate back to recipe view after successful save.
- Invalidate router data after successful save.

If extraction makes the PR too large, split this into:

- PR 4a: extract shared form while preserving add behavior.
- PR 4b: wire edit mutation and page behavior.

### PR 5: Recipe View Actions Layout

Move recipe management actions to their final view-page positions.

Expected files:

- `src/pages/recipes/RecipeViewPage.tsx`
- `src/pages/recipes/RecipeViewPage.module.css`

Requirements:

- Move edit from a full button to an icon-only inline button after the recipe title.
- Keep the edit button accessible with an explicit label.
- Move delete button to the bottom of the page on mobile.
- Do not implement real deletion unless a separate PR explicitly scopes storage and DB cleanup.

## Future Work

- Split image upload from recipe creation so metadata can be managed entirely by server functions.
- Add photo deletion/reorder/replace support.
- Implement real recipe deletion with DB cleanup and object storage cleanup.
- Consider edit success toasts if save feedback feels too quiet after navigation.
