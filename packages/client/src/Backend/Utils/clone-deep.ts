import { cloneDeep as lodashCloneDeep } from "lodash-es";

/**
 *  TODO:
 *    Fix use of usage of cloneDeep in the code to only clone structures
 *    that don't contain function pointers.
 */
// @see https://www.builder.io/blog/structured-clone
export function cloneDeep<T>(value: T): T {
  // return structuredClone(value);
  return lodashCloneDeep(value);
}
