/** Returns a local callback path without allowing protocol-relative or backslash-based redirects. */
export function getSafeRedirectPath(value: string | undefined) {
  if (!value?.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return '/';
  }

  return value;
}
