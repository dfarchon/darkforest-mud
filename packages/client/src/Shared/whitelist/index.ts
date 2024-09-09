/**
 * This package contains utilities for working with DarkForest whitelist keys.
 *
 * ## Installation
 *
 * You can install this package using [`npm`](https://www.npmjs.com) or
 * [`yarn`](https://classic.yarnpkg.com/lang/en/) by running:
 *
 * ```bash
 * npm install --save @df/whitelist
 * ```
 * ```bash
 * yarn add @df/whitelist
 * ```
 *
 * When using this in a plugin, you might want to load it with [skypack](https://www.skypack.dev)
 *
 * ```js
 * import * as whitelist from 'http://cdn.skypack.dev/@df/whitelist'
 * ```
 *
 * @packageDocumentation
 */

import { mimcSponge } from "@df/hashing";
import bigInt from "big-integer";
import { ethers } from "ethers";

export const keysPerTx = 400;

export function generateKey() {
  // generate 24 characters hex value
  const hexValue = bigInt(
    ethers.BigNumber.from(ethers.utils.randomBytes(12)).toString(),
  )
    .toString(16)
    .padStart(24, "0");

  // split 24 character hex value into 4 words of 6 chars length
  const words = Array.from(hexValue.matchAll(/(.{6})/g)).map(
    ([match]) => match,
  );

  // return uppercased key on the form e.g. 862C58-D02664-2BC1F8-FD3CDF
  return words.join("-").toUpperCase();
}

export const generateKeys = (count: number) => {
  const keys = [] as string[];
  for (let i = 0; i < count; i++) {
    keys.push(generateKey());
  }

  return keys;
};

export const bigIntFromKey = (key: string) =>
  bigInt(key.replaceAll("-", ""), 16);

export const keyHash = (key: string) =>
  mimcSponge([bigIntFromKey(key)], 1, 220, 0)[0].toString();
