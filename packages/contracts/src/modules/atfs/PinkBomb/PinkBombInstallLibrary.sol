// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IBaseWorld } from "@latticexyz/world/src/codegen/interfaces/IBaseWorld.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { BaseInstallLibrary } from "../BaseInstallLibrary.sol";
import { PinkBombSystem } from "./PinkBombSystem.sol";
import { ArtifactInstallModule } from "../ArtifactInstallModule.sol";
import { ArtifactMetadata, ArtifactMetadataData } from "../tables/ArtifactMetadata.sol";
import { Effect, EffectData } from "../tables/Effect.sol";
import { PinkBomb } from "./tables/PinkBomb.sol";
import { _pinkBombTableId } from "./utils.sol";
import { _artifactMetadataTableId, _effectTableId, _artifactIndexToNamespace } from "../utils.sol";
import { ArtifactRarity, ArtifactGenre, ModifierType, EffectType } from "../../../codegen/common.sol";
import { AtfInstallModule } from "../../../codegen/tables/AtfInstallModule.sol";
import { EffectLib, Modifier } from "../../../lib/Effect.sol";
import { ARTIFACT_INDEX, GENERAL_ACTIVATE } from "./constant.sol";
import { RevealedPlanet, Planet } from "../../../codegen/index.sol";

/**
 * @notice Installs the Pink Bomb artifact into the game
 */
function installPinkBomb(address world) returns (uint256 index) {
  // Get the artifact install module
  address moduleAddr = AtfInstallModule.get();
  require(moduleAddr != address(0), "ArtifactInstallModule not found");

  PinkBombSystem artifactProxySystem = new PinkBombSystem();
  // Install the ERC20 module with the provided args
  IBaseWorld(world).installModule(
    ArtifactInstallModule(moduleAddr),
    abi.encode(new PinkBombInstallLibrary(), artifactProxySystem)
  );

  // grant RevealedPlanet and Planet access to the artifact proxy system
  IBaseWorld(world).grantAccess(RevealedPlanet._tableId, address(artifactProxySystem));
  IBaseWorld(world).grantAccess(Planet._tableId, address(artifactProxySystem));

  return ARTIFACT_INDEX;
}

contract PinkBombInstallLibrary is BaseInstallLibrary {
  function _artifactIndex() internal pure override returns (uint8) {
    return ARTIFACT_INDEX;
  }

  function _install(IBaseWorld world, bytes14 namespace) internal override {
    // setup effect ourside of the install library
    _setUpEffects(namespace);

    // register pinkbomb table
    ResourceId pinkbombTableId = _pinkBombTableId(namespace);
    PinkBomb.register(pinkbombTableId);

    // setup artifact metadata
    _setMetadata(namespace);

    // register fallback delegation of this namespace
    world.registerNamespaceDelegation(
      WorldResourceIdLib.encodeNamespace(namespace),
      WorldResourceIdLib.encode("sy", "df", "DfDelegationCtrl"),
      new bytes(0)
    );
  }

  function _setMetadata(bytes14 namespace) internal {
    ResourceId metadataTableId = _artifactMetadataTableId(namespace);
    ArtifactMetadataData memory metadata = ArtifactMetadataData({
      genre: ArtifactGenre.OFFENSIVE,
      charge: 14400,
      cooldown: 14400,
      durable: false,
      reusable: false,
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

  function _setUpEffects(bytes14 namespace) internal {
    // register effect table
    ResourceId effectTableId = _effectTableId(namespace);
    Effect.register(effectTableId);

    // set effects
    Modifier[] memory modifiers = new Modifier[](2);
    modifiers[0] = Modifier(ModifierType.MULTIPLY_RANGE, 50);
    modifiers[1] = Modifier(ModifierType.MULTIPLY_SPEED, 50);
    Effect.set(effectTableId, GENERAL_ACTIVATE, EffectLib.genEffectData(EffectType.STAT, modifiers));
  }
}
