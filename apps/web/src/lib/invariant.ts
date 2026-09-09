/**
 * Throws when value is null, undefined, or false, then narrows it accordingly.
 *
 * Do not call this from a React component body or render path; throwing during
 * render is a code smell.
 */
export function invariant<T>(
  value: T,
  messageOrOnViolation: string | (() => never),
): asserts value is Exclude<NonNullable<T>, false> {
  if (value === null || value === undefined || value === false) {
    if (typeof messageOrOnViolation === 'string') {
      throw new Error(messageOrOnViolation);
    }

    messageOrOnViolation();
  }
}
