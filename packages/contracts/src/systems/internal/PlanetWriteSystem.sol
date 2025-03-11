// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Planet } from "libraries/Planet.sol";

contract PlanetWriteSystem is BaseSystem {
  /**
   * @notice Write a planet to storage.
   * @dev Used by systems that modify planets in order to solve system size issues.
   * @param planet Planet
   */
  function writePlanet(Planet memory planet) public {
    planet.writeToStore();
  }
}
