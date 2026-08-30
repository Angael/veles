export class TypedFormData {
  private readonly data: FormData;

  constructor(source: HTMLFormElement | FormData) {
    this.data = source instanceof FormData ? source : new FormData(source);
  }

  /**
   * Reads a required text field and trims its value.
   *
   * Form submissions should provide strings; missing fields and file values are
   * rejected rather than being mistaken for text.
   */
  string(name: string): string {
    const value = this.data.get(name);
    if (typeof value !== 'string') {
      throw new TypeError(`Expected form field "${name}" to contain text`);
    }
    return value.trim();
  }

  /** Reads and converts a required numeric field, preserving Number semantics. */
  number(name: string): number {
    return Number(this.string(name));
  }

  /** Reads an optional numeric field, treating a blank value as undefined. */
  optionalNumber(name: string): number | undefined {
    const value = this.string(name);
    return value ? Number(value) : undefined;
  }
}
