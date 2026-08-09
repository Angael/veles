import { type } from 'arktype';
import { isMatch } from 'date-fns';

/**
 * Strict ArkType for real `YYYY-MM-DD` calendar dates.
 *
 * ArkType's built-in date strings accept either impossible calendar dates or broader ISO shapes.
 * Compose this type directly with `type(dateOnlyType)`, in object definitions, or via `.allows()`.
 */
export const dateOnlyType = type('string.date.iso').narrow((value, ctx) =>
  isMatch(value, 'yyyy-MM-dd') ? true : ctx.mustBe('a valid date in YYYY-MM-DD format'),
);
