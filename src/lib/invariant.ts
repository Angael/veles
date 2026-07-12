export function invariant<T>(value: T, onViolation: () => never): asserts value is NonNullable<T> {
  if (value == null) {
    onViolation();
  }
}
