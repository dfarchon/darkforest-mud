// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Errors } from "../interfaces/errors.sol";
import { UniverseConfig } from "../codegen/index.sol";

contract PlanetSystem is System, Errors {
  function initPlanet() public returns (uint32) { }

  function _validatePlanetHash(uint256 planetHash) internal view {
    if (
      planetHash
        >= (21888242871839275222246405745257275088548364400416034343698204186575808495617 / UniverseConfig.getSparsity())
    ) {
      revert Errors.InvalidPlanetHash();
    }
  }
}
