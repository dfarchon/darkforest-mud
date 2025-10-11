// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Planet } from "libraries/Planet.sol";
import { MaterialType, ArtifactStatus } from "codegen/common.sol";
import { WORMHOLE_MAINTENANCE_MYCELIUM_RATE } from "modules/atfs/Wormhole/constant.sol";
import { DFUtils } from "libraries/DFUtils.sol";
import { WormholeDest } from "modules/atfs/Wormhole/tables/WormholeDest.sol";
import { WormholeRecord } from "modules/atfs/Wormhole/tables/WormholeRecord.sol";
import { DistanceMultiplier } from "codegen/index.sol";
import { _wormholeDestTableId, _wormholeRecordTableId } from "modules/atfs/Wormhole/utils.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { WorldResourceIdInstance } from "@latticexyz/world/src/WorldResourceId.sol";
import { ARTIFACT_INDEX as WORMHOLE_INDEX } from "modules/atfs/Wormhole/constant.sol";
import { Artifact } from "libraries/Artifact.sol";
import { WormholeSystem } from "modules/atfs/Wormhole/WormholeSystem.sol";

contract WormholeMaintenanceSystem is BaseSystem {
  using WorldResourceIdInstance for ResourceId;

  /**
   * @notice Get the namespace for the wormhole system
   * @return namespace The namespace for wormhole artifacts
   */
  function _namespace() internal pure returns (bytes14 namespace) {
    // WORMHOLE_INDEX is 5, so namespace is "atf.5"
    return bytes14("atf.5");
  }

  /**
   * @notice Process wormhole maintenance for all active wormholes
   * This function should be called periodically to consume mycelium for active wormholes
   */
  function processWormholeMaintenance() public {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    // This is a simplified implementation - in a real scenario, you'd need to
    // iterate through all active wormholes and process them
    // For now, we'll implement the logic that can be called for specific planets
  }

  /**
   * @notice Process wormhole maintenance for a specific planet
   * @param planetHash The hash of the planet to process
   */
  function processPlanetWormholeMaintenance(uint256 planetHash) public {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);

    // Check if this planet has an active wormhole
    if (_hasActiveWormhole(planet)) {
      _processWormholeMaintenance(planet);

      // Write the updated planet back to storage
      DFUtils.writePlanet(worldAddress, planet);
    }
  }

  /**
   * @notice Process wormhole maintenance for a specific planet with tick update
   * @param planetHash The hash of the planet to process
   * @param untilTick The tick to update to
   */
  function processPlanetWormholeMaintenanceWithTick(uint256 planetHash, uint256 untilTick) public {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);

    // Update planet to the specified tick
    planet.naturalGrowth(untilTick);

    // Check if this planet has an active wormhole
    if (_hasActiveWormhole(planet)) {
      _processWormholeMaintenance(planet);
    }

    // Write the updated planet back to storage
    DFUtils.writePlanet(worldAddress, planet);
  }

  /**
   * @notice Check if a planet has an active wormhole
   * @param planet The planet to check
   * @return hasWormhole True if planet has an active wormhole
   */
  function _hasActiveWormhole(Planet memory planet) internal view returns (bool) {
    // Check if planet has any artifacts
    if (planet.artifactStorage.GetNumber() == 0) {
      return false;
    }

    // Get the wormhole destination table ID
    ResourceId wormholeDestTableId = _wormholeDestTableId(_namespace());

    // Check each artifact on the planet to see if it's an active wormhole
    for (uint256 i = 0; i < planet.artifactStorage.GetNumber(); i++) {
      uint256 artifactId = planet.artifactStorage.Get(i);

      // Check if this artifact has a destination in the WormholeDest table
      bytes32 destination = WormholeDest.get(wormholeDestTableId, uint32(artifactId));

      // If destination is not zero, this artifact is an active wormhole
      if (destination != 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * @notice Process wormhole maintenance for a planet
   * @param planet The planet with the active wormhole
   */
  function _processWormholeMaintenance(Planet memory planet) internal {
    uint256 myceliumAmount = planet.getMaterial(MaterialType.MYCELIUM);

    if (myceliumAmount >= WORMHOLE_MAINTENANCE_MYCELIUM_RATE) {
      // Consume mycelium for maintenance
      planet.setMaterial(MaterialType.MYCELIUM, myceliumAmount - WORMHOLE_MAINTENANCE_MYCELIUM_RATE);
    } else {
      // Not enough mycelium - deactivate all wormholes on this planet
      planet.setMaterial(MaterialType.MYCELIUM, 0);
      _deactivateWormholesOnPlanet(planet);
    }
  }

  /**
   * @notice Deactivate all wormholes on a planet when mycelium is depleted
   * @param planet The planet with wormholes to deactivate
   */
  function _deactivateWormholesOnPlanet(Planet memory planet) internal {
    // Get the wormhole destination and record table IDs
    ResourceId wormholeDestTableId = _wormholeDestTableId(_namespace());
    ResourceId wormholeRecordTableId = _wormholeRecordTableId(_namespace());

    // Check each artifact on the planet
    for (uint256 i = 0; i < planet.artifactStorage.GetNumber(); i++) {
      uint256 artifactId = planet.artifactStorage.Get(i);

      // Check if this artifact has a destination in the WormholeDest table
      bytes32 destination = WormholeDest.get(wormholeDestTableId, uint32(artifactId));

      // If destination is not zero, this artifact is an active wormhole
      if (destination != 0) {
        // Deactivate the wormhole by clearing its destination and record
        bytes32 from = bytes32(planet.planetHash);
        bytes32 to = destination;

        // Determine the canonical pair order (left < right)
        (bytes32 left, bytes32 right) = from < to ? (from, to) : (to, from);

        // Clear the wormhole destination
        WormholeDest.deleteRecord(wormholeDestTableId, uint32(artifactId));

        // Mark the wormhole record as inactive
        WormholeRecord.set(wormholeRecordTableId, left, right, false);

        // Note: The artifact status will be updated by the artifact system
        // when the planet is processed by the natural growth system
      }
    }
  }

  /**
   * @notice Check if a wormhole should be deactivated due to insufficient mycelium
   * @param planet The planet with the active wormhole
   * @return shouldDeactivate True if wormhole should be deactivated
   */
  function shouldDeactivateWormhole(Planet memory planet) public view returns (bool) {
    uint256 myceliumAmount = planet.getMaterial(MaterialType.MYCELIUM);
    return myceliumAmount < WORMHOLE_MAINTENANCE_MYCELIUM_RATE;
  }
}
