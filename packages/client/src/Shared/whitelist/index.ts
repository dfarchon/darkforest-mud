/**
 * This package contains utilities for working with DarkForest whitelist keys.
 *
 * ## Installation
 *
 * You can install this package using [`npm`](https://www.npmjs.com) or
 * [`yarn`](https://classic.yarnpkg.com/lang/en/) by running:
 *
 * ```bash
 * npm install --save @dfares/whitelist
 * ```
 * ```bash
 * yarn add @dfares/whitelist
 * ```
 *
 * When using this in a plugin, you might want to load it with [skypack](https://www.skypack.dev)
 *
 * ```js
 * import * as whitelist from 'http://cdn.skypack.dev/@dfares/whitelist'
 * ```
 *
 * @packageDocumentation
 */

import { mimcSponge } from "../hashing";
import bigInt from "big-integer";
import { ethers } from "ethers";
// import { chunk, padStart, replace } from "lodash";

function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

function padStart(
  str: string,
  targetLength: number,
  padString: string = " ",
): string {
  if (str.length >= targetLength) {
    return str;
  }
  padString = padString.repeat(
    Math.ceil((targetLength - str.length) / padString.length),
  );
  return padString.slice(0, targetLength - str.length) + str;
}

function replace(
  str: string,
  searchValue: string | RegExp,
  replaceValue: string,
): string {
  return str.replace(searchValue, replaceValue);
}

export const keysPerTx = 400;

export const generateKey = () => {
  const hexArray = padStart(
    bigInt(
      ethers.BigNumber.from(ethers.utils.randomBytes(12)).toString(),
    ).toString(16),
    24,
    "0",
  ).split("");

  return chunk(hexArray, 6)
    .map((s) => s.join(""))
    .join("-")
    .toUpperCase();
};

export const generateKeys = (count: number) => {
  const keys = [] as string[];
  for (let i = 0; i < count; i++) {
    keys.push(generateKey());
  }

  return keys;
};

export const bigIntFromKey = (key: string) =>
  bigInt(replace(key, /\-/g, ""), 16);

export const keyHash = (key: string) =>
  mimcSponge([bigIntFromKey(key)], 1, 220, 0)[0].toString();
