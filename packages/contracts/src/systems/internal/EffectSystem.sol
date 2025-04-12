// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Planet } from "libraries/Planet.sol";
import { EffectLib } from "libraries/Effect.sol";

contract EffectSystem is BaseSystem {
  /**
   * @notice Trigger before move effects.
   * @param planet Planet
   */
  function beforeMove(Planet memory planet) public view returns (Planet memory) {
    EffectLib.beforeMove(planet);
    return planet;
  }

  /**
   * @notice Trigger after move effects.
   * @param planet Planet
   */
  function afterMove(Planet memory planet) public view returns (Planet memory) {
    EffectLib.afterMove(planet);
    return planet;
  }
}
