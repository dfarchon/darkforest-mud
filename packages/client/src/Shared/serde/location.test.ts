import type { LocationId } from "@df/types";
import bigInt from "big-integer";
import { describe, expect, test } from "vitest";

import {
  locationIdFromBigInt,
  locationIdFromDecStr,
  locationIdFromHexStr,
  locationIdToDecStr,
  locationIdToHexStr,
  validLocationHash,
} from "./location";

describe(validLocationHash.name, () => {
  test("should return false for invalid location", () => {
    const invalidLocation =
      "5c9be7c10463cb93c719af0e524bab50171f342b5ce3909143e1f593f0000001" as LocationId;
    expect(validLocationHash(invalidLocation)).to.equal(false);
  });
  test("should return true for valid location", () => {
    const invalidLocation =
      "000009e53e2be01abc14a2788969a179014b37c63c8f2fcd6507634677005ecc" as LocationId;
    expect(validLocationHash(invalidLocation)).to.equal(true);
  });
});

describe(locationIdFromBigInt.name, () => {
  test("should throw when an invalid location id is used", () => {
    const invalidLocation = bigInt(
      "41888242871839275222246405745257275088548364400416034343698204186575808495617",
    );

    expect(() => locationIdFromBigInt(invalidLocation)).to.throw(
      "not a valid location",
    );
  });

  for (const [value, expected] of [
    [
      "000009e53e2be01abc14a2788969a179014b37c63c8f2fcd6507634677005ecc",
      "000009e53e2be01abc14a2788969a179014b37c63c8f2fcd6507634677005ecc",
    ],
    [
      "000009E53E2BE01ABC14A2788969A179014B37C63C8F2FCD6507634677005ECC",
      "000009e53e2be01abc14a2788969a179014b37c63c8f2fcd6507634677005ecc",
    ],
  ]) {
    test("should return location id for valid location", () => {
      const validLocation = bigInt(value, 16);
      expect(locationIdFromBigInt(validLocation)).to.equal(expected);
    });
  }
});

describe(locationIdFromHexStr.name, () => {
  for (const [location, expected] of [
    [
      "0x000009e53e2be01abc14a2788969a179014b37c63c8f2fcd6507634677005ecc",
      "000009e53e2be01abc14a2788969a179014b37c63c8f2fcd6507634677005ecc",
    ],
    [
      "0x9e53e2be01abc14a2788969a179014b37c63c8f2fcd6507634677005ecc",
      "000009e53e2be01abc14a2788969a179014b37c63c8f2fcd6507634677005ecc",
    ],
    [
      "9e53e2be01abc14a2788969a179014b37c63c8f2fcd6507634677005ecc",
      "000009e53e2be01abc14a2788969a179014b37c63c8f2fcd6507634677005ecc",
    ],
    [
      "9E53E2BE01ABC14A2788969A179014B37C63C8F2FCD6507634677005ECC",
      "000009e53e2be01abc14a2788969a179014b37c63c8f2fcd6507634677005ecc",
    ],
  ]) {
    test(`should convert location: ${location} to: ${expected}`, () => {
      expect(locationIdFromHexStr(location)).to.equal(expected);
    });
  }
});

describe(locationIdFromDecStr.name, () => {
  for (const [location, expected] of [
    [
      "1085781874156476538467406260997188261797863032629765706616440015263292395",
      "00009d51e357da0bb348b62e111034382c5de433780e57fc50585444c202dbeb",
    ],
    [
      "576661502260778782198458423391208521079026457754837839615962668085749668",
      "0000538d905c7051807ffe1eee2004421e3cba146e00c7f3ccb8a391ce0327a4",
    ],
    [
      "1153857406057772970361097940279507467377196663864225665401978080079123279",
      "0000a72ef32b0d1327e6268eea9cc36e7c5fe077a89093fe0e4edf04d400134f",
    ],
  ]) {
    test(`should convert location: ${location} to: ${expected}`, () => {
      expect(locationIdFromDecStr(location)).to.equal(expected);
    });
  }
});

describe(locationIdToDecStr.name, () => {
  for (const [location, expected] of [
    [
      "00009d51e357da0bb348b62e111034382c5de433780e57fc50585444c202dbeb",
      "1085781874156476538467406260997188261797863032629765706616440015263292395",
    ],
    [
      "0000538d905c7051807ffe1eee2004421e3cba146e00c7f3ccb8a391ce0327a4",
      "576661502260778782198458423391208521079026457754837839615962668085749668",
    ],
    [
      "0000a72ef32b0d1327e6268eea9cc36e7c5fe077a89093fe0e4edf04d400134f",
      "1153857406057772970361097940279507467377196663864225665401978080079123279",
    ],
  ]) {
    test(`should convert location: ${location} to: ${expected}`, () => {
      expect(locationIdToDecStr(location as LocationId)).to.equal(expected);
    });
  }
});

describe(locationIdToHexStr.name, () => {
  for (const [location, expected] of [
    [
      "00009d51e357da0bb348b62e111034382c5de433780e57fc50585444c202dbeb",
      "0x00009d51e357da0bb348b62e111034382c5de433780e57fc50585444c202dbeb",
    ],
    [
      "0000538d905c7051807ffe1eee2004421e3cba146e00c7f3ccb8a391ce0327a4",
      "0x0000538d905c7051807ffe1eee2004421e3cba146e00c7f3ccb8a391ce0327a4",
    ],
    [
      "0000a72ef32b0d1327e6268eea9cc36e7c5fe077a89093fe0e4edf04d400134f",
      "0x0000a72ef32b0d1327e6268eea9cc36e7c5fe077a89093fe0e4edf04d400134f",
    ],
  ]) {
    test(`should convert location: ${location} to: ${expected}`, () => {
      expect(locationIdToHexStr(location as LocationId)).to.equal(expected);
    });
  }
});
