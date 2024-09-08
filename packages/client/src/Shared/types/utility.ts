/**
 * An abstract type used to differentiate between common types, like `number` or `string`.
 * The `Token` type parameter is the key to vary upon and should be unique unless being used to subtype.
 */
export type Abstract<T, K> = T & { readonly __brand: K };
