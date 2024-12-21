export function chunk<T>(items: readonly T[] | T[], size: number = 1): T[][] {
  // Handle edge cases
  if (!items.length || size < 1) {
    return [];
  }

  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}
