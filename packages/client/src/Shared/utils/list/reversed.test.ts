import { describe, expect, test } from "vitest";

import { reversed } from "./reversed";

describe(reversed.name, () => {
  test("should reverse correctly", () => {
    expect(reversed([1, 2, 3, 4, 5])).to.eql([5, 4, 3, 2, 1]);
  });
});
