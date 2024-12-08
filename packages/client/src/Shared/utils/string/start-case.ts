const pattern = /[a-zA-z]+/g;

export function startCase(value: string): string {
  return Array.from(value.matchAll(pattern))
    .map(([[fst, ...rest]]) => `${fst.toUpperCase()}${rest}`)
    .join(" ");
}
