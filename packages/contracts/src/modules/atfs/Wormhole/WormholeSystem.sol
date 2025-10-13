// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { Planet } from "../../../lib/Planet.sol";
import { Artifact } from "../../../lib/Artifact.sol";
import { ArtifactStatus, ArtifactRarity, MaterialType } from "../../../codegen/common.sol";
import { DistanceMultiplier } from "../../../codegen/index.sol";
import { ArtifactProxySystem } from "../ArtifactProxySystem.sol";
import { ARTIFACT_INDEX, WORMHOLE_MAINTENANCE_MYCELIUM_RATE, WORMHOLE_ACTIVATION_MYCELIUM_COST, WORMHOLE_ACTIVATION_SANDGLASS_COST } from "./constant.sol";
import { WormholeDest } from "./tables/WormholeDest.sol";
import { WormholeRecord } from "./tables/WormholeRecord.sol";
import { _wormholeDestTableId, _wormholeRecordTableId } from "./utils.sol";
import { PlanetOwner } from "../../../codegen/index.sol";

contract WormholeSystem is ArtifactProxySystem {
  error WormholeAlreadySet(); // 0x1fa9cff1
  error WormholeNotSet(); // 0xf337e05a
  error WormholeSetToSelf(); // 0x842ec8de
  error WormholeRequiresSameOwner(); // 0x0da3b747
  error WormholeInsufficientMaterials(); // 0x02547ffb
  error WormholeMyceliumDepleted(); // 0xa8aca90b

  uint32[6] private _distanceMultipliers = [1000, 500, 250, 125, 62, 31];

  function getArtifactIndex() public pure override returns (uint8) {
    return ARTIFACT_INDEX;
  }

  function _shutdown(Planet memory planet, Artifact memory artifact) internal virtual override {
    super._shutdown(planet, artifact);

    ResourceId wormholeDestTableId = _wormholeDestTableId(_namespace());
    ResourceId wormholeRecordTableId = _wormholeRecordTableId(_namespace());
    bytes32 from = bytes32(planet.planetHash);
    bytes32 to = WormholeDest.get(wormholeDestTableId, uint32(artifact.id));
    if (to == 0) {
      revert WormholeNotSet();
    }
    (bytes32 left, bytes32 right) = from < to ? (from, to) : (to, from);
    uint256 multiplier = DistanceMultiplier.get(left, right);
    if (multiplier != 0) {
      multiplier = (multiplier * 1000) / _distanceMultipliers[uint8(artifact.rarity)];
      DistanceMultiplier.set(left, right, uint32(multiplier));
    }
    WormholeDest.deleteRecord(wormholeDestTableId, uint32(artifact.id));
    WormholeRecord.set(wormholeRecordTableId, left, right, false);
  }

  /**
   * @notice Check and deactivate wormhole if mycelium is depleted
   * @param planet The planet with the potential wormhole
   * @param artifact The wormhole artifact
   */
  function checkAndDeactivateWormhole(Planet memory planet, Artifact memory artifact) public {
    if (artifact.status != ArtifactStatus.ACTIVE) {
      return;
    }

    // Check if mycelium is depleted
    if (_shouldDeactivateWormhole(planet)) {
      // Deactivate the wormhole
      _shutdown(planet, artifact);
    }
  }

  function _activate(Planet memory planet, Artifact memory artifact, bytes memory inputData) internal virtual override {
    super._activate(planet, artifact, inputData);

    bytes32 to = abi.decode(inputData, (bytes32));
    bytes32 from = bytes32(planet.planetHash);
    if (from == to) {
      revert WormholeSetToSelf();
    }

    if (PlanetOwner.get(to) != PlanetOwner.get(from)) {
      revert WormholeRequiresSameOwner();
    }

    // Check and consume materials for wormhole activation
    _validateAndConsumeActivationMaterials(planet);

    (bytes32 left, bytes32 right) = from < to ? (from, to) : (to, from);
    ResourceId wormholeDestTableId = _wormholeDestTableId(_namespace());
    ResourceId wormholeRecordTableId = _wormholeRecordTableId(_namespace());
    if (WormholeRecord.get(wormholeRecordTableId, left, right)) {
      revert WormholeAlreadySet();
    }
    uint256 multiplier = DistanceMultiplier.get(left, right);
    if (multiplier == 0) {
      multiplier = _distanceMultipliers[uint8(artifact.rarity)];
    } else {
      multiplier = (multiplier * _distanceMultipliers[uint8(artifact.rarity)]) / 1000;
    }
    DistanceMultiplier.set(left, right, uint32(multiplier));
    WormholeDest.set(wormholeDestTableId, uint32(artifact.id), to);
    WormholeRecord.set(wormholeRecordTableId, left, right, true);
  }

  /**
   * @notice Validate and consume materials required for wormhole activation
   * @param planet The planet activating the wormhole
   */
  function _validateAndConsumeActivationMaterials(Planet memory planet) internal view {
    uint256 myceliumAmount = planet.getMaterial(MaterialType.MYCELIUM);
    uint256 sandglassAmount = planet.getMaterial(MaterialType.SANDGLASS);

    // Check if planet has sufficient materials for activation
    if (myceliumAmount < WORMHOLE_ACTIVATION_MYCELIUM_COST || sandglassAmount < WORMHOLE_ACTIVATION_SANDGLASS_COST) {
      revert WormholeInsufficientMaterials();
    }

    // Consume materials for activation
    planet.setMaterial(MaterialType.MYCELIUM, myceliumAmount - WORMHOLE_ACTIVATION_MYCELIUM_COST);
    planet.setMaterial(MaterialType.SANDGLASS, sandglassAmount - WORMHOLE_ACTIVATION_SANDGLASS_COST);
  }

  /**
   * @notice Check if wormhole should be deactivated due to insufficient mycelium
   * @param planet The planet with the active wormhole
   * @return shouldDeactivate True if wormhole should be deactivated
   */
  function _shouldDeactivateWormhole(Planet memory planet) internal view returns (bool) {
    uint256 myceliumAmount = planet.getMaterial(MaterialType.MYCELIUM);
    return myceliumAmount < WORMHOLE_MAINTENANCE_MYCELIUM_RATE;
  }

  /**
   * @notice Consume mycelium for wormhole maintenance
   * @param planet The planet with the active wormhole
   */
  // function _consumeMaintenanceMaterials(Planet memory planet) internal view {
  //   uint256 myceliumAmount = planet.getMaterial(MaterialType.MYCELIUM);

  //   if (myceliumAmount >= WORMHOLE_MAINTENANCE_MYCELIUM_RATE) {
  //     planet.setMaterial(MaterialType.MYCELIUM, myceliumAmount - WORMHOLE_MAINTENANCE_MYCELIUM_RATE);
  //   } else {
  //     // Not enough mycelium, set to 0 and wormhole will be deactivated
  //     planet.setMaterial(MaterialType.MYCELIUM, 0);
  //     // shutdown all wormholes on this planet.heldsArtifactsId like wormhole artifact type
  //     for (uint256 i = 0; i < planet.heldArtifactsId.length; i++) {
  //       uint256 artifactId = planet.heldArtifactsId[i];
  //       if (Artifact.get(artifactId).artifactType == ArtifactType.WORMHOLE) {
  //         _shutdown(planet, Artifact.get(artifactId));
  //       }
  //     }
  //     planet.writeToStore();
  //   }
  // }
}
