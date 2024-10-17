// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { IBaseWorld } from "@latticexyz/world/src/codegen/interfaces/IBaseWorld.sol";
import { ResourceIds } from "@latticexyz/store/src/codegen/tables/ResourceIds.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { ArtifactMetadata } from "./tables/ArtifactMetadata.sol";
import { IInstallLibrary } from "./IInstallLibrary.sol";
import { _artifactIndexToNamespace, _artifactMetadataTableId, _artifactProxySystemId } from "./utils.sol";

abstract contract BaseInstallLibrary is IInstallLibrary {
  using Strings for uint256;

  /**
   * Install artifact, register needed systems and tables in specific namespace
   */
  function installArtifact(IBaseWorld world, System artifactProxySystem) public virtual returns (uint256 index) {
    bytes14 namespace = _artifactIndexToNamespace(_artifactIndex());

    // Register the namespace if it doesn't exist yet
    ResourceId atfNamespace = WorldResourceIdLib.encodeNamespace(namespace);
    if (!ResourceIds.getExists(atfNamespace)) {
      world.registerNamespace(atfNamespace);
    }

    // Register artifact metadata table
    ResourceId tableId = _artifactMetadataTableId(namespace);
    if (!ResourceIds.getExists(tableId)) {
      ArtifactMetadata.register(tableId);
    }

    // Register needed systems except artifact proxy system and other tables
    _install(world, namespace);

    // Register artifact proxy system
    world.registerSystem(_artifactProxySystemId(namespace), artifactProxySystem, false);
    return _artifactIndex();
  }

  function _artifactIndex() internal pure virtual returns (uint8);

  function _install(IBaseWorld world, bytes14 namespace) internal virtual;
}
