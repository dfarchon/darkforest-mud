import { describe, expect, test } from "vitest";

import { startCase } from "./start-case";

describe(startCase.name, () => {
  const testCases = [
    "--foo-bar--",
    "fooBar",
    "__Foo_Bar__",
    "foo/bar",
    "Foo*Bar",
    " Foo Bar ",
  ];

  for (const value of testCases) {
    test(`startCase("${value}") => "Foo Bar"`, () => {
      expect(startCase(value)).to.equal("Foo Bar");
    });
  }
});
