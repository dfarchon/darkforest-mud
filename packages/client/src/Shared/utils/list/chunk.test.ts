import { describe, expect, test } from "vitest";

import { chunk } from "./chunk";

describe(chunk.name, () => {
  const testCases = [
    {
      args: {
        items: ["a", "b", "c", "d"],
        size: 2,
      },
      result: [
        ["a", "b"],
        ["c", "d"],
      ],
    },
    {
      args: {
        items: ["a", "b", "c", "d"],
        size: 3,
      },
      result: [["a", "b", "c"], ["d"]],
    },
  ];
  for (const { args, result } of testCases) {
    test(`chunk(${args.items}, ${args.size}) => ${result}`, () => {
      expect(chunk(args.items, args.size)).to.eql(result);
    });
  }
});
