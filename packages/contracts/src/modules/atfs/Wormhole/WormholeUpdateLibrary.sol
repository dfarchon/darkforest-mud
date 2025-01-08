// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IBaseWorld } from "@latticexyz/world/src/codegen/interfaces/IBaseWorld.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { BaseInstallLibrary } from "../BaseInstallLibrary.sol";
import { WormholeSystem } from "./WormholeSystem.sol";
import { WormholeSystemTemp } from "./WormholeSystemTemp.sol";
import { WormholeSystemTemp2 } from "./WormholeSystemTemp2.sol";
import { ArtifactInstallModule } from "../ArtifactInstallModule.sol";
import { ArtifactMetadata, ArtifactMetadataData } from "../tables/ArtifactMetadata.sol";
import { Wormhole } from "./tables/Wormhole.sol";
import { WormholeDest } from "./tables/WormholeDest.sol";
import { WormholeRecord } from "./tables/WormholeRecord.sol";
import { _artifactMetadataTableId } from "../utils.sol";
import { DistanceMultiplier, ArtifactRegistry } from "../../../codegen/index.sol";
import { ArtifactRarity, ArtifactGenre } from "../../../codegen/common.sol";
import { AtfInstallModule } from "../../../codegen/tables/AtfInstallModule.sol";
import { ARTIFACT_INDEX } from "./constant.sol";
import { _wormholeTableId, _wormholeDestTableId, _wormholeRecordTableId } from "./utils.sol";
import { _artifactIndexToNamespace, _artifactProxySystemId } from "../utils.sol";

/**
 * @notice Updates the Wormhole artifact
 */
function updateWormhole2(address world) returns (uint256 index) {
  WormholeSystemTemp2 artifactProxySystem = new WormholeSystemTemp2();

  bytes14 namespace = _artifactIndexToNamespace(ARTIFACT_INDEX);

  // Register artifact proxy system
  IBaseWorld(world).registerSystem(_artifactProxySystemId(namespace), System(artifactProxySystem), true);

  // grant DistanceMultiplier access to the artifact proxy system
  IBaseWorld(world).grantAccess(DistanceMultiplier._tableId, address(artifactProxySystem));

  return ARTIFACT_INDEX;
}

function updateWormhole(address world) returns (uint256 index) {
  WormholeSystemTemp artifactProxySystem = new WormholeSystemTemp();

  bytes14 namespace = _artifactIndexToNamespace(ARTIFACT_INDEX);
  // register wormhole dest table
  ResourceId wormholeDestTableId = _wormholeDestTableId(namespace);
  WormholeDest.register(wormholeDestTableId);

  // register wormhole record table
  ResourceId wormholeRecordTableId = _wormholeRecordTableId(namespace);
  WormholeRecord.register(wormholeRecordTableId);

  // Register artifact proxy system
  IBaseWorld(world).registerSystem(_artifactProxySystemId(namespace), System(artifactProxySystem), true);

  // grant DistanceMultiplier access to the artifact proxy system
  IBaseWorld(world).grantAccess(DistanceMultiplier._tableId, address(artifactProxySystem));

  return ARTIFACT_INDEX;
}

contract WormholeInstallLibrary is BaseInstallLibrary {
  function _artifactIndex() internal pure override returns (uint8) {
    return ARTIFACT_INDEX;
  }

  function _install(IBaseWorld, bytes14 namespace) internal override {
    // register wormhole table
    ResourceId wormholeTableId = _wormholeTableId(namespace);
    Wormhole.register(wormholeTableId);

    // register wormhole dest table
    ResourceId wormholeDestTableId = _wormholeDestTableId(namespace);
    WormholeDest.register(wormholeDestTableId);

    // register wormhole record table
    ResourceId wormholeRecordTableId = _wormholeRecordTableId(namespace);
    WormholeRecord.register(wormholeRecordTableId);

    // setup artifact metadata
    _setMetadata(namespace);
  }

  function _setMetadata(bytes14 namespace) internal {
    ResourceId metadataTableId = _artifactMetadataTableId(namespace);
    // wormhole's rarity does not affect its metadata
    ArtifactMetadataData memory metadata = ArtifactMetadataData({
      genre: ArtifactGenre.GENERAL,
      charge: 0,
      cooldown: 14400,
      durable: true,
      reusable: true,
      reqLevel: 0,
      reqPopulation: 0,
      reqSilver: 0
    });
    ArtifactMetadata.set(metadataTableId, ArtifactRarity.COMMON, metadata);
    ArtifactMetadata.set(metadataTableId, ArtifactRarity.RARE, metadata);
    ArtifactMetadata.set(metadataTableId, ArtifactRarity.EPIC, metadata);
    ArtifactMetadata.set(metadataTableId, ArtifactRarity.LEGENDARY, metadata);
    ArtifactMetadata.set(metadataTableId, ArtifactRarity.MYTHIC, metadata);
  }
}
