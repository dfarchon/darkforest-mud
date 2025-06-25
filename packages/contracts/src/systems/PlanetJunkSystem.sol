// SPDX-License-Identifier: GPL-3.0Add commentMore actions
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Planet } from "libraries/Planet.sol";
import { PlanetType } from "codegen/common.sol";
import { JunkConfig } from "codegen/tables/JunkConfig.sol";
import { PlayerJunk } from "codegen/tables/PlayerJunk.sol";

import { DFUtils } from "libraries/DFUtils.sol";

contract PlanetJunkSystem is BaseSystem {
  /**
   * @notice add junk to player
   * @param planetHash Planet hash
   */
  function addJunk(uint256 planetHash) public entryFee {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    address executor = _msgSender();

    uint256[] memory PLANET_LEVEL_JUNK = JunkConfig.getPLANET_LEVEL_JUNK();

    bool SPACE_JUNK_ENABLED = JunkConfig.getSPACE_JUNK_ENABLED();
    uint256 SPACE_JUNK_LIMIT = JunkConfig.getSPACE_JUNK_LIMIT();
    uint256 planetJunk = PLANET_LEVEL_JUNK[planet.level];

    address oldPlanetJunkOwner = planet.junkOwner;
    uint256 oldOwnerJunk = PlayerJunk.get(oldPlanetJunkOwner);
    uint256 playerJunk = PlayerJunk.get(executor);

    if (planet.owner != executor) revert NotPlanetOwner();
    if (!SPACE_JUNK_ENABLED) revert SpaceJunkDisabled();
    if (playerJunk + planetJunk > SPACE_JUNK_LIMIT) revert JunkLimitExceeded();

    if (oldPlanetJunkOwner != address(0)) {
      PlayerJunk.set(oldPlanetJunkOwner, (oldOwnerJunk - planetJunk));
    }

    planet.junkOwner = executor;
    planet.addJunkTick = DFUtils.getCurrentTick();
    PlayerJunk.set(executor, playerJunk + planetJunk);

    planet.writeToStore();
  }

  /**
   * @notice clear junk
   * @param planetHash Planet hash
   */
  function clearJunk(uint256 planetHash) public entryFee {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    address executor = _msgSender();

    uint256[] memory PLANET_LEVEL_JUNK = JunkConfig.getPLANET_LEVEL_JUNK();

    bool SPACE_JUNK_ENABLED = JunkConfig.getSPACE_JUNK_ENABLED();

    if (!SPACE_JUNK_ENABLED) revert SpaceJunkDisabled();
    if (planet.junkOwner != executor) revert NotJunkOwner();

    uint256 planetJunk = PLANET_LEVEL_JUNK[planet.level];
    uint256 playerJunk = PlayerJunk.get(executor);

    PlayerJunk.set(planet.junkOwner, (playerJunk - planetJunk));
    planet.junkOwner = address(0);

    if (planet.owner == executor) {
      planet.changeOwner(address(0));
    }

    planet.writeToStore();
  }
}
