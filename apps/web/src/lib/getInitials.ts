export function getInitials(value: string | null | undefined) {
  const parts = value?.trim().split(/\s+/) ?? [];

  return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : ''}`.toUpperCase();
}
