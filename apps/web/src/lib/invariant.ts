export function invariant<T>(
  value: T,
  messageOrOnViolation: string | (() => never),
): asserts value is NonNullable<T> {
  if (value == null) {
    if (typeof messageOrOnViolation === 'string') {
      throw new Error(messageOrOnViolation);
    }

    messageOrOnViolation();
  }
}
