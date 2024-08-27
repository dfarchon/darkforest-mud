// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Planet } from "./Planet.sol";
import { PlanetType } from "../codegen/common.sol";

library UniverseLib {
  // todo wormhole would affect the distance
  function distance(Planet memory from, Planet memory to, uint256 input) internal pure returns (uint256 res) {
    res = input;
    if (to.planetType == PlanetType.QUASAR) {
      res /= 2;
    }
  }
}
