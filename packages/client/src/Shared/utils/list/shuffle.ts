// Fisher-Yates (also known as Knuth) shuffle implementation

export function shuffle<T>(items: T[]): T[] {
  // Clone the list to avoid mutating the original
  const result = [...items];

  // Start from the last element and swap with random earlier element
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
