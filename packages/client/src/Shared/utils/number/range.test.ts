import { describe, expect, test } from "vitest";

import { range } from "./range";

describe(range.name, () => {
  const testCases = [
    {
      args: {
        start: -2,
        stop: 3,
        step: 1,
      },
      result: [-2, -1, 0, 1, 2],
    },
    {
      args: {
        start: 1,
        stop: 6,
        step: 1,
      },
      result: [1, 2, 3, 4, 5],
    },
    {
      args: {
        start: 0,
        stop: 6,
        step: 2,
      },
      result: [0, 2, 4],
    },
    {
      args: {
        start: 0,
        stop: 10,
        step: 3,
      },
      result: [0, 3, 6, 9],
    },
  ];

  for (const { args, result } of testCases) {
    test(`range(${args.start}, ${args.stop}, ${args.step}) =>  ${result}`, () => {
      expect(range(args.start, args.stop, args.step)).to.eql(result);
    });
  }
});
