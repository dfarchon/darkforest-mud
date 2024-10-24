// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "../codegen/world/IWorld.sol";
import { Errors } from "../interfaces/errors.sol";
import { Planet } from "../lib/Planet.sol";
import { EffectLib } from "../lib/Effect.sol";

contract EffectSystem is System, Errors {
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
