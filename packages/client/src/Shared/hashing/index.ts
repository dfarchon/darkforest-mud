/**
 * This package contains MiMC hashing utilities for use with Dark Forest.
 * The MiMC algorithm is used for both finding planet hashes and calculating
 * the perlin in-game. Among other things, these values are often needed for
 * generating Snarks.
 *
 * ## Installation
 *
 * You can install this package using [`npm`](https://www.npmjs.com) or
 * [`yarn`](https://classic.yarnpkg.com/lang/en/) by running:
 *
 * ```bash
 * npm install --save @dfares/hashing
 * ```
 * ```bash
 * yarn add @dfares/hashing
 * ```
 *
 * When using this in a plugin, you might want to load it with [skypack](https://www.skypack.dev)
 *
 * ```js
 * import * as hashing from 'http://cdn.skypack.dev/@dfares/hashing'
 * ```
 *
 * @packageDocumentation
 */
import { fakeHash, seededRandom } from "./fakeHash";
import { Fraction } from "./fractions/bigFraction";
import mimcHash, { mimcSponge, modPBigInt, modPBigIntNative } from "./mimc";
import {
  getRandomGradientAt,
  IntegerVector,
  MAX_PERLIN_VALUE,
  perlin,
  rand,
} from "./perlin";

export {
  mimcHash,
  mimcSponge,
  IntegerVector,
  perlin,
  rand,
  getRandomGradientAt,
  modPBigInt,
  modPBigIntNative,
  fakeHash,
  seededRandom,
  Fraction,
  MAX_PERLIN_VALUE,
};
