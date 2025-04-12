const pattern = /(\p{Lu}+(?!\p{Ll})|\p{Lu}?\p{Ll}+|[0-9]+)/gu;

export function startCase(value: string): string {
  const args: string[] = [];
  for (const [match] of value.matchAll(pattern)) {
    args.push(match[0].toUpperCase() + match.slice(1));
  }

  return args.join(" ");
}
