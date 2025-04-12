// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { PlanetFlagType as FlagType } from "codegen/common.sol";

type Flags is uint256;

using FlagsLib for Flags global;

library FlagsLib {
  function check(Flags flags, FlagType flagType) internal pure returns (bool) {
    uint256 bitPosition = uint256(flagType);
    return (Flags.unwrap(flags) & (1 << bitPosition)) != 0;
  }

  function set(Flags flags, FlagType flagType) internal pure returns (Flags) {
    uint256 bitPosition = uint256(flagType);
    return Flags.wrap(Flags.unwrap(flags) | (1 << bitPosition));
  }

  function unset(Flags flags, FlagType flagType) internal pure returns (Flags) {
    uint256 bitPosition = uint256(flagType);
    return Flags.wrap(Flags.unwrap(flags) & ~(1 << bitPosition));
  }
}
