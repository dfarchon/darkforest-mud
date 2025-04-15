// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IBaseWorld } from "@latticexyz/world/src/codegen/interfaces/IBaseWorld.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { BaseInstallLibrary } from "../BaseInstallLibrary.sol";
import { BloomFilterSystem } from "./BloomFilterSystem.sol";
import { ArtifactInstallModule } from "../ArtifactInstallModule.sol";
import { ArtifactMetadata, ArtifactMetadataData } from "../tables/ArtifactMetadata.sol";
import { _artifactMetadataTableId, _artifactIndexToNamespace } from "../utils.sol";
import { ArtifactRarity, ArtifactGenre } from "../../../codegen/common.sol";
import { AtfInstallModule } from "../../../codegen/tables/AtfInstallModule.sol";
import { ARTIFACT_INDEX } from "./constant.sol";

/**
 * @notice Installs the Bloom Filter artifact into the game
 */
function installBloomFilter(address world) returns (uint256 index) {
  // Get the artifact install module
  address moduleAddr = AtfInstallModule.get();
  require(moduleAddr != address(0), "ArtifactInstallModule not found");

  // Install the ERC20 module with the provided args
  IBaseWorld(world).installModule(
    ArtifactInstallModule(moduleAddr),
    abi.encode(new BloomFilterInstallLibrary(), new BloomFilterSystem())
  );

  return ARTIFACT_INDEX;
}

contract BloomFilterInstallLibrary is BaseInstallLibrary {
  function _artifactIndex() internal pure override returns (uint8) {
    return ARTIFACT_INDEX;
  }

  function _install(IBaseWorld, bytes14 namespace) internal override {
    // setup artifact metadata
    _setMetadata(namespace);
  }

  function _setMetadata(bytes14 namespace) internal {
    ResourceId metadataTableId = _artifactMetadataTableId(namespace);
    // bloom filter's rarity does not affect its metadata but has different requirements on the level of the planet
    ArtifactMetadataData memory metadata = ArtifactMetadataData({
      genre: ArtifactGenre.GENERAL,
      charge: 0,
      cooldown: 0,
      durable: false,
      reusable: false,
      reqLevel: 0x0300, // 0 <= level < 3
      reqPopulation: 0,
      reqSilver: 0
    });
    ArtifactMetadata.set(metadataTableId, ArtifactRarity.COMMON, metadata);
    metadata.reqLevel = 0x0503; // 3 <= level < 5
    ArtifactMetadata.set(metadataTableId, ArtifactRarity.RARE, metadata);
    metadata.reqLevel = 0x0705; // 5 <= level < 7
    ArtifactMetadata.set(metadataTableId, ArtifactRarity.EPIC, metadata);
    metadata.reqLevel = 0x0907; // 7 <= level < 9
    ArtifactMetadata.set(metadataTableId, ArtifactRarity.LEGENDARY, metadata);
    metadata.reqLevel = 0x0a09; // 9 <= level < 10
    ArtifactMetadata.set(metadataTableId, ArtifactRarity.MYTHIC, metadata);
  }
}
