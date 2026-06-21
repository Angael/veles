---
name: arktype
description: Use when writing or reviewing validation, arktype, input parsing.
---

# ArkType

Use ArkType as the primary boundary validation layer. Prefer expressing validation, coercion, and simple constraints in the ArkType definition instead of validating once and then adding separate scalar `if` checks.

## Repo Patterns

- Server functions that accept input should use `arkTypeValidator(...)` from `@tanstack/arktype-adapter` with `createServerFn(...).validator(...)`.
- API routes validate manually by invoking a `type(...)` and checking `result instanceof type.errors` before using the parsed result.
- Current examples use `string.uuid`, `string.trim`, `string.numeric.parse`, `File[]`, and object schemas.
- Some current code manually checks constraints after ArkType validation. Prefer moving separable constraints like number ranges, string lengths, array lengths, UUID/email/date formats, and integer checks into ArkType.

## Validation Workflow

1. Define the input boundary shape with `type(...)` near the server function or route that consumes it.
2. Use built-in keywords first: `string.trim`, `string.email`, `string.uuid`, `string.date`, `string.date.iso`, `string.numeric.parse`, `string.integer.parse`, `string.json.parse`, `File`, `FormData`, `number.integer`, and `number.safe`.
3. Put scalar constraints in ArkType expressions: `1 <= number <= 5`, `number.integer >= 0`, `string >= 1`, `0 < string <= 120`, `string.email`, `string.uuid.v7`, `string[] <= 8`.
4. Use `|>` or `.pipe(...)` when boundary data needs coercion before final validation, for example `string.numeric.parse |> 1 <= number <= 5`.
5. Return or throw based on `type.errors` at the boundary. After validation succeeds, treat the output as already safe for those declared constraints.

## Preferred Examples

Range validation belongs in the type:

```ts
const ratingType = type('string.numeric.parse |> 1 <= number <= 5');
```

Non-empty trimmed strings should trim and validate in one expression:

```ts
const recipeNameType = type('string.trim |> string >= 1');
```

Server function inputs should validate through the TanStack adapter:

```ts
const recipeByIdInputType = type({ id: 'string.uuid' });

export const getRecipeById = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getRecipeById')])
  .validator(arkTypeValidator(recipeByIdInputType))
  .handler(async ({ data }) => {
    // data.id is already a UUID-shaped string.
  });
```

Manual API routes should validate once before consuming parsed data:

```ts
const validation = uploadRecipeInputType(input);

if (validation instanceof type.errors) {
  return Response.json({ error: validation.summary ?? 'Invalid input' }, { status: 400 });
}
```

## FormData

- Prefer ArkType transform pipelines or `FormData.parse` when they keep the code readable.
- For file uploads, some manual `FormData` handling is acceptable because file filtering, empty file omission, and multi-file fields often need route-specific logic.
- Keep manual code focused on extracting boundary values. Let ArkType handle scalar parsing, trimming, requiredness, ranges, lengths, and formats.
- Empty optional numeric form fields should parse to `null` in this repo unless the user asks for different behavior.

Example optional numeric field that preserves empty as `null` but validates non-empty values through ArkType:

```ts
const optionalRatingFormValueType = type('string.trim').pipe(
  (value): number | null | ArkErrors =>
    value === '' ? null : type('string.numeric.parse |> 1 <= number <= 5')(value),
);
```

## Pipes, Narrows, And Manual Logic

- Pipes are fine. Use them for coercion, normalization, and composing built-in parsing with output validation.
- Prefer built-in keywords, ranges, length constraints, unions, array constraints, and `|>` before writing `.narrow(...)`, `.filter(...)`, or separate `if` validation.
- Use `.narrow(...)` for custom output validation that ArkType syntax cannot express, especially cross-field checks.
- Use `.filter(...)` when the check must happen on the input before a morph runs.
- Keep separate `if` checks for auth/session state, permissions, database existence, storage configuration, async checks, and business logic that is not just input shape or scalar validity.

## Anti-Patterns

- Do not validate a field with ArkType and then add a separate scalar range check like `if (rating < 1 || rating > 5)`. Use `1 <= number <= 5` in the ArkType pipeline.
- Do not manually trim and then validate non-empty strings in unrelated code when `string.trim |> string >= 1` would keep the rule at the boundary.
- Do not use `as any`, `as unknown`, or `as never` to get around ArkType inference. Ask the user if a cast seems unavoidable.
- Do not default to custom regex or manual parsing before checking ArkType keywords and autocomplete for available subtypes.

## Quick Reference

- Numeric range: `1 <= number <= 5`
- Integer minimum: `number.integer >= 0`
- String length: `0 < string <= 120`
- Trimmed non-empty string: `string.trim |> string >= 1`
- Numeric string to bounded number: `string.numeric.parse |> 1 <= number <= 5`
- Email: `string.email`
- UUID: `string.uuid` or a versioned variant like `string.uuid.v7`
- ISO date string: `string.date.iso`
- ISO date string to Date: `string.date.iso.parse`
- JSON string to typed object: `string.json.parse |> { name: string }`
- Array length: `string[] <= 8`
