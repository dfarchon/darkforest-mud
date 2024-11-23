// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "../codegen/world/IWorld.sol";
import { Errors } from "../interfaces/errors.sol";
import { Planet } from "../lib/Planet.sol";
import { PlanetEmoji } from "../codegen/index.sol";
import { DFUtils } from "../lib/DFUtils.sol";

contract PlanetEmojiSystem is System, Errors {
  /**
   * @notice set emoji on your owned planet
   * @param planetHash Planet hash
   * @param emoji Emoji you like
   */

  function setPlanetEmoji(uint256 planetHash, string memory emoji) public {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    address executor = _msgSender();

    if (planet.owner != executor) revert Errors.NotPlanetOwner();
    PlanetEmoji.set(bytes32(planetHash), emoji);
  }
}
