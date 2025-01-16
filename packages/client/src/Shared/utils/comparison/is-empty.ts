export function isEmpty(value: object): boolean {
  if (value instanceof Map || value instanceof Set) {
    return value.size === 0;
  }

  if (value instanceof Array) {
    return value.length === 0;
  }

  if ("length" in value && typeof value.length === "number") {
    return value.length === 0;
  }

  if ("size" in value && typeof value.size === "number") {
    return value.size === 0;
  }

  return Object.keys(value).length === 0;
}
