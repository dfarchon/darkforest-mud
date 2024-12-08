const supportstoReversed = typeof [].toReversed === "function";

export function reversed<T>(items: T[]): T[] {
  if (supportstoReversed) {
    return items.toReversed();
  }

  const result: T[] = [];
  for (let i = items.length; i--; ) {
    result.push(items[i]);
  }

  return result;
}
