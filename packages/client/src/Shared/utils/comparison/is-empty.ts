export function isEmpty(value: object): boolean {
  if (Object.hasOwn(value, "length")) {
    return (value as { length: number }).length === 0;
  }

  if (Object.hasOwn(value, "size")) {
    return (value as { size: number }).size === 0;
  }

  return Object.keys(value).length > 0;
}
