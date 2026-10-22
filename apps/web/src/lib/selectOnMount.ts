/**
 * Ref callback that focuses a prefilled field and selects its text when it mounts, so typing
 * replaces the old value. It runs before a dialog moves focus, so the dialog keeps this focus.
 */
export function selectOnMount(input: HTMLInputElement | null) {
  input?.focus();
  input?.select();
}
