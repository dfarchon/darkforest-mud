import { describe, expect, test } from "vitest";

import { isEmpty } from "./is-empty";

describe(isEmpty.name, () => {
  const testCases = [
    // empty set
    new Set(),
    // empty map
    new Map(),
    // empty array
    [],
    // object with length property
    { length: 0 },
    // object with size property
    { size: 0 },
    // empty object
    {},
  ];

  for (const value of testCases) {
    test(`should return true for empty ${value.constructor.name}`, () => {
      expect(isEmpty(value)).to.equal(true);
    });
  }
});
