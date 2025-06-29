// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Planet } from "libraries/Planet.sol";
import { PlanetEmoji } from "codegen/index.sol";
import { DFUtils } from "libraries/DFUtils.sol";
import { GlobalStats } from "codegen/tables/GlobalStats.sol";
import { PlayerStats } from "codegen/tables/PlayerStats.sol";

contract PlanetEmojiSystem is BaseSystem {
  /**
   * @notice set emoji on your owned planet
   * @param planetHash Planet hash
   * @param emoji Emoji you like
   */

  function setPlanetEmoji(uint256 planetHash, string memory emoji) public requireSameOwnerAndJunkOwner(planetHash) {
    GlobalStats.setSetPlanetEmojiCount(GlobalStats.getSetPlanetEmojiCount() + 1);
    PlayerStats.setSetPlanetEmojiCount(_msgSender(), PlayerStats.getSetPlanetEmojiCount(_msgSender()) + 1);

    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    address executor = _msgSender();

    if (planet.owner != executor) revert NotPlanetOwner();
    PlanetEmoji.set(bytes32(planetHash), emoji);
  }
}
