---
name: arktype
description: Use when writing or reviewing validation, arktype, input parsing.
---

# ArkType

Use ArkType as the primary boundary validation layer. Prefer keywords, ranges, lengths, formats, unions, and pipes over separate scalar `if` checks after validation.

## Repo Rules

- Server functions: `.validator(arkTypeValidator(inputType))`.
- API routes: call the type, then check `result instanceof type.errors`.
- Server functions always still use `logMiddleware(...)` per repo rules.
- Empty optional numeric form fields become `null` unless told otherwise.
- File upload routes may manually extract/filter `FormData`; let ArkType handle scalar parsing and constraints.
- Separate `if` checks are fine for auth, permissions, DB/storage state, async checks, and business logic.
- Avoid `as any`, `as unknown`, `as never`; ask if a cast seems unavoidable.

## Boundary Patterns

```ts
const recipeByIdInputType = type({ id: 'string.uuid' });

export const getRecipeById = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getRecipeById')])
  .validator(arkTypeValidator(recipeByIdInputType))
  .handler(async ({ data }) => data.id);
```

```ts
const validation = uploadRecipeInputType(input);

if (validation instanceof type.errors) {
  return Response.json({ error: validation.summary ?? 'Invalid input' }, { status: 400 });
}
```

```ts
const optionalRatingFormValueType = type('string.trim').pipe(
  (value): number | null | ArkErrors =>
    value === '' ? null : type('string.numeric.parse |> 1 <= number <= 5')(value),
);
```

## Use First

- Keywords: `string.email`, `string.uuid`, `string.date.iso`, `string.numeric.parse`.
- Constraints: `1 <= number <= 5`, `string >= 1`, `string[] <= 8`.
- Pipes: `string.trim |> string >= 1`, `string.numeric.parse |> number.integer >= 0`.
- Unions: `string | null`, `'draft' | 'published'`, `number | undefined`.
- Arrays/tuples/objects: `string[]`, `['string', 'number']`, `{ id: 'string.uuid' }`.
- Custom `.narrow(...)` / `.filter(...)` only after keywords and expressions cannot express it cleanly.

## Quick Reference

```ts
// strings
type('string');
type('string >= 1');
type('0 < string <= 120');
type('string.trim');
type('string.trim |> string >= 1');
type('string.lower');
type('string.lower.preformatted');
type('string.upper');
type('string.normalize.NFC');
type('string.alpha');
type('string.alphanumeric');
type('string.digits');
type('/^[a-z0-9-]+$/');

// common string formats
type('string.email');
type('string.url');
type('string.url.parse');
type('string.uuid');
type('string.uuid.v4');
type('string.uuid.v7');
type('string.semver');
type('string.ip');
type('string.ip.v4');
type('string.base64');
type('string.hex');

// dates
type('string.date');
type('string.date.parse');
type('string.date.iso');
type('string.date.iso.parse');
type('Date');
type("Date > d'2000-01-01'");
type(`Date < ${Date.now()}`);

// numbers
type('number');
type('number.safe');
type('number.integer');
type('number.integer >= 0');
type('1 <= number <= 5');
type('0 < number < 100');
type('number % 2');
type('-50 < (number % 2) < 50');

// numeric strings and form fields
type('string.numeric');
type('string.numeric.parse');
type('string.numeric.parse |> number.integer');
type('string.numeric.parse |> number.integer >= 1');
type('string.trim |> string.numeric.parse');
type('string.trim |> string.numeric.parse |> 1 <= number <= 5');

// arrays
type('string[]');
type('string.email[]');
type('string[] > 0');
type('string[] <= 8');
type('0 < string[] <= 8');
type('(string | number)[]');
type('File[]');
type('File[] <= 8');

// objects
type({ id: 'string.uuid' });
type({ name: 'string.trim |> string >= 1' });
type({ email: 'string.email', age: 'number.integer >= 0' });
type({ '+': 'reject', id: 'string.uuid' });
type({ '[string]': 'number' });
type({ 'nickname?': 'string.trim |> string >= 1' });
type({ role: "'admin' | 'user' = 'user'" });

// unions and literals
type('string | number');
type('number | null');
type('string | undefined');
type("'draft' | 'published' | 'archived'");
type('true | false');
type('null');

// JSON and FormData
type('string.json');
type('string.json.parse');
type('string.json.parse').to({ name: 'string', version: 'string.semver' });
type('FormData');
type('FormData.parse');
type('FormData.value');

// files and web platform types
type('File');
type('Blob');
type('URL');
type('Request');
type('Response');
type('Headers');

// composition
type({ id: 'string.uuid' }).array();
type({ id: 'string.uuid' }).array().atLeastLength(1);
type({ email: 'string.email' }).merge({ name: 'string.trim |> string >= 1' });
type.or({ id: 'string.uuid' }, { slug: 'string >= 1' });
type.and({ id: 'string.uuid' }, { name: 'string' });

// custom logic when expression syntax is not enough
type('number').narrow((n, ctx) => (n % 2 === 0 ? true : ctx.mustBe('even')));
type('string.numeric.parse').filter((s, ctx) => (s.length <= 10 ? true : ctx.reject('at most 10 chars')));
type('string').pipe((s) => s.trim(), type('string >= 1'));
type('string').pipe.try((s): object => JSON.parse(s), type({ name: 'string' }));
```

## Anti-Patterns

```ts
// avoid
if (validation.rating !== null && (validation.rating < 1 || validation.rating > 5)) {}

// prefer
type('string.numeric.parse |> 1 <= number <= 5');
```
