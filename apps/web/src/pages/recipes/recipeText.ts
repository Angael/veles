/** Splits user-entered recipe text into its stored lines without changing the text. */
export function splitRecipeText(value: string, separator: string) {
  return value.split(separator);
}
