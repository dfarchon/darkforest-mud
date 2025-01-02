import type { LocationId, Planet, WorldLocation } from "@df/types";
import { describe, expect, test } from "vitest";

import memo from "./memo";

describe("memo", () => {
  const locationId =
    "0000293fbd7482f9a6854fded998199b5bcae70c18f7520fb3d50c8f47e2aa7b" as LocationId;

  // test data
  const planet = {
    locationId,
  } as Planet;

  const location = {
    hash: locationId,
    coords: {
      y: 0,
      x: 0,
    },
    biomebase: 1,
    perlin: 0,
  } as WorldLocation;

  test("should return undefined when element does not exist", () => {
    expect(memo.get(locationId)).to.eql(undefined);
  });

  test("should return planet and undefined for rest when only planet is set", () => {
    memo.set(locationId, { planet });
    expect(memo.get(locationId)).to.eql([planet, undefined, undefined]);
  });

  test("should return both planet and location after location is set", () => {
    memo.set(locationId, { location });
    expect(memo.get(locationId)).to.eql([planet, location, undefined]);
  });

  test("should return both planet, location and touched after touched is set", () => {
    memo.set(locationId, { touched: false });
    expect(memo.get(locationId)).to.eql([planet, location, false]);

    memo.set(locationId, { touched: true });
    expect(memo.get(locationId)).to.eql([planet, location, true]);
  });
});
