export function getFormString(data: FormData, name: string): string {
  return (data.get(name) as string).trim();
}

export function getFormNumber(data: FormData, name: string): number {
  return Number(getFormString(data, name));
}

export function getOptionalFormNumber(data: FormData, name: string): number | undefined {
  const value = getFormString(data, name);
  return value ? Number(value) : undefined;
}
