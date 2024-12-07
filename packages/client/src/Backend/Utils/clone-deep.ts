// @see https://www.builder.io/blog/structured-clone
export function cloneDeep<T>(value: T): T {
  return structuredClone(value);
}
