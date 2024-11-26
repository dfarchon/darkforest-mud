// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IBaseWorld } from "@latticexyz/world/src/codegen/interfaces/IBaseWorld.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { ArtifactMetadata } from "./tables/ArtifactMetadata.sol";
import { IInstallLibrary } from "./IInstallLibrary.sol";
import { _artifactIndexToNamespace, _artifactMetadataTableId, _artifactProxySystemId } from "./utils.sol";

abstract contract BaseInstallLibrary is IInstallLibrary {
  /**
   * Install artifact, register needed systems and tables in specific namespace
   */
  function installArtifact(IBaseWorld world, bytes14 namespace) public virtual {
    // Register the namespace
    ResourceId atfNamespace = WorldResourceIdLib.encodeNamespace(namespace);
    world.registerNamespace(atfNamespace);

    // Register artifact metadata table
    ResourceId tableId = _artifactMetadataTableId(namespace);
    ArtifactMetadata.register(tableId);

    // Register needed systems except artifact proxy system and other tables
    _install(world, namespace);
  }

  function _artifactIndex() internal pure virtual returns (uint8);

  function _install(IBaseWorld world, bytes14 namespace) internal virtual;
}
