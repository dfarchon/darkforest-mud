// SPDX-License-Identifier: GPL-3.0Add commentMore actions
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Planet, PlanetLib } from "libraries/Planet.sol";
import { PlanetType, Biome, MaterialType } from "codegen/common.sol";
import { JunkConfig } from "codegen/tables/JunkConfig.sol";
import { PlayerJunk } from "codegen/tables/PlayerJunk.sol";
import { GlobalStats } from "codegen/tables/GlobalStats.sol";
import { PlayerStats } from "codegen/tables/PlayerStats.sol";
import { DFUtils } from "libraries/DFUtils.sol";

contract PlanetJunkSystem is BaseSystem {
  modifier requireSpaceJunkEnabled() {
    bool SPACE_JUNK_ENABLED = JunkConfig.getSPACE_JUNK_ENABLED();
    if (!SPACE_JUNK_ENABLED) revert SpaceJunkDisabled();
    _;
  }

  /**
   * @notice add junk to player
   * @param planetHash Planet hash
   */
  function addJunk(uint256 planetHash) public entryFee requireSpaceJunkEnabled {
    GlobalStats.setAddJunkCount(GlobalStats.getAddJunkCount() + 1);
    PlayerStats.setAddJunkCount(_msgSender(), PlayerStats.getAddJunkCount(_msgSender()) + 1);

    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    address executor = _msgSender();

    uint256[] memory PLANET_LEVEL_JUNK = JunkConfig.getPLANET_LEVEL_JUNK();

    uint256 SPACE_JUNK_LIMIT = JunkConfig.getSPACE_JUNK_LIMIT();
    uint256 planetJunk = PLANET_LEVEL_JUNK[planet.level];

    address oldPlanetJunkOwner = planet.junkOwner;
    uint256 oldOwnerJunk = PlayerJunk.get(oldPlanetJunkOwner);
    uint256 playerJunk = PlayerJunk.get(executor);

    if (planet.owner != executor) revert NotPlanetOwner();
    if (playerJunk + planetJunk > SPACE_JUNK_LIMIT) revert JunkLimitExceeded();

    if (oldPlanetJunkOwner != address(0)) {
      PlayerJunk.set(oldPlanetJunkOwner, (oldOwnerJunk - planetJunk));
    }

    planet.junkOwner = executor;
    planet.addJunkTick = DFUtils.getCurrentTick();
    PlayerJunk.set(executor, playerJunk + planetJunk);

    // add material - determinate if planet.planetType == ASTEROID_FIELD then allowedMaterialsForBiome use setMaterial
    if (planet.planetType == PlanetType.ASTEROID_FIELD) {
      // For ASTEROID_FIELD planets, initialize allowed materials
      Biome biome = Biome(uint8(PlanetLib.getPlanetBiomebase(planet)));
      MaterialType[] memory allowed = PlanetLib.allowedMaterialsForBiome(biome);
      for (uint256 i; i < allowed.length; i++) {
        // Initialize with a starting amount based on planet level
        planet.setMaterial(allowed[i], 0);
      }
    }

    planet.writeToStore();
  }

  /**
   * @notice clear junk
   * @param planetHash Planet hash
   */
  function clearJunk(uint256 planetHash) public entryFee requireSpaceJunkEnabled {
    GlobalStats.setClearJunkCount(GlobalStats.getClearJunkCount() + 1);
    PlayerStats.setClearJunkCount(_msgSender(), PlayerStats.getClearJunkCount(_msgSender()) + 1);

    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    address executor = _msgSender();

    uint256[] memory PLANET_LEVEL_JUNK = JunkConfig.getPLANET_LEVEL_JUNK();

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
