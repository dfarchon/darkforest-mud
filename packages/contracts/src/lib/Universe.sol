// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { Planet } from "./Planet.sol";
import { PlanetType } from "../codegen/common.sol";
import { DistanceMultiplier } from "../codegen/index.sol";

library UniverseLib {
  // todo wormhole would affect the distance
  function distance(Planet memory from, Planet memory to, uint256 input) internal view returns (uint256 res) {
    res = input;
    if (to.planetType == PlanetType.QUASAR) {
      res /= 2;
    }
    (uint256 left, uint256 right) = from.planetHash < to.planetHash
      ? (from.planetHash, to.planetHash)
      : (to.planetHash, from.planetHash);
    uint256 multiplier = DistanceMultiplier.get(bytes32(left), bytes32(right));
    if (multiplier != 0) {
      res = (res * multiplier) / 1000;
    }
  }
}
