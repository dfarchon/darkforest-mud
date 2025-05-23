// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IBaseWorld } from "@latticexyz/world/src/codegen/interfaces/IBaseWorld.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { BaseInstallLibrary } from "../BaseInstallLibrary.sol";
import { CannonSystem } from "./CannonSystem.sol";
import { ArtifactInstallModule } from "../ArtifactInstallModule.sol";
import { ArtifactMetadata, ArtifactMetadataData } from "../tables/ArtifactMetadata.sol";
import { Effect, EffectData } from "../tables/Effect.sol";
import { _artifactMetadataTableId, _effectTableId, _artifactIndexToNamespace } from "../utils.sol";
import { ArtifactRarity, ArtifactGenre, ModifierType, EffectType } from "../../../codegen/common.sol";
import { AtfInstallModule } from "../../../codegen/tables/AtfInstallModule.sol";
import { EffectLib, Modifier } from "../../../lib/Effect.sol";
import { ARTIFACT_INDEX, COMMON_CHARGE, RARE_CHARGE, EPIC_CHARGE, LEGENDARY_CHARGE, MYTHIC_CHARGE } from "./constant.sol";
import { COMMON_ACTIVATE_AFTER_MOVE, RARE_ACTIVATE_AFTER_MOVE, EPIC_ACTIVATE_AFTER_MOVE, LEGENDARY_ACTIVATE_AFTER_MOVE, MYTHIC_ACTIVATE_AFTER_MOVE } from "./constant.sol";
import { COMMON_ACTIVATE_BEFORE_MOVE, RARE_ACTIVATE_BEFORE_MOVE, EPIC_ACTIVATE_BEFORE_MOVE, LEGENDARY_ACTIVATE_BEFORE_MOVE, MYTHIC_ACTIVATE_BEFORE_MOVE } from "./constant.sol";
import { COMMON_ACTIVATE_STAT_BUFF, RARE_ACTIVATE_STAT_BUFF, EPIC_ACTIVATE_STAT_BUFF, LEGENDARY_ACTIVATE_STAT_BUFF, MYTHIC_ACTIVATE_STAT_BUFF } from "./constant.sol";

/**
 * @notice Installs the Photoid Cannon artifact into the game
 */
function installCannon(address world) returns (uint256 index) {
  // Get the artifact install module
  address moduleAddr = AtfInstallModule.get();
  require(moduleAddr != address(0), "ArtifactInstallModule not found");

  // Install the ERC20 module with the provided args
  IBaseWorld(world).installModule(
    ArtifactInstallModule(moduleAddr),
    abi.encode(new CannonInstallLibrary(), new CannonSystem())
  );

  return ARTIFACT_INDEX;
}

contract CannonInstallLibrary is BaseInstallLibrary {
  function _artifactIndex() internal pure override returns (uint8) {
    return ARTIFACT_INDEX;
  }

  function _install(IBaseWorld, bytes14 namespace) internal override {
    // setup effect ourside of the install library
    _setUpEffects(namespace);

    // setup artifact metadata
    _setMetadata(namespace);
  }

  function _setMetadata(bytes14 namespace) internal {
    ResourceId metadataTableId = _artifactMetadataTableId(namespace);
    // cannon's rarity does not affect its metadata
    ArtifactMetadataData memory metadata = ArtifactMetadataData({
      genre: ArtifactGenre.OFFENSIVE,
      charge: 14400,
      cooldown: 0,
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
    Modifier[] memory modifiers = new Modifier[](1);
    modifiers[0] = Modifier(ModifierType.MULTIPLY_DEFENSE, 50);
    Effect.set(effectTableId, COMMON_CHARGE, EffectLib.genEffectData(EffectType.STAT, modifiers));
    modifiers[0] = Modifier(ModifierType.MULTIPLY_DEFENSE, 40);
    Effect.set(effectTableId, RARE_CHARGE, EffectLib.genEffectData(EffectType.STAT, modifiers));
    modifiers[0] = Modifier(ModifierType.MULTIPLY_DEFENSE, 30);
    Effect.set(effectTableId, EPIC_CHARGE, EffectLib.genEffectData(EffectType.STAT, modifiers));
    modifiers[0] = Modifier(ModifierType.MULTIPLY_DEFENSE, 20);
    Effect.set(effectTableId, LEGENDARY_CHARGE, EffectLib.genEffectData(EffectType.STAT, modifiers));
    modifiers[0] = Modifier(ModifierType.MULTIPLY_DEFENSE, 10);
    Effect.set(effectTableId, MYTHIC_CHARGE, EffectLib.genEffectData(EffectType.STAT, modifiers));

    modifiers = new Modifier[](2);
    modifiers[0] = Modifier(ModifierType.MULTIPLY_RANGE, 200);
    modifiers[1] = Modifier(ModifierType.MULTIPLY_SPEED, 500);
    Effect.set(effectTableId, COMMON_ACTIVATE_STAT_BUFF, EffectLib.genEffectData(EffectType.STAT, modifiers));
    modifiers[1] = Modifier(ModifierType.MULTIPLY_SPEED, 1000);
    Effect.set(effectTableId, RARE_ACTIVATE_STAT_BUFF, EffectLib.genEffectData(EffectType.STAT, modifiers));
    modifiers[1] = Modifier(ModifierType.MULTIPLY_SPEED, 1500);
    Effect.set(effectTableId, EPIC_ACTIVATE_STAT_BUFF, EffectLib.genEffectData(EffectType.STAT, modifiers));
    modifiers[1] = Modifier(ModifierType.MULTIPLY_SPEED, 2000);
    Effect.set(effectTableId, LEGENDARY_ACTIVATE_STAT_BUFF, EffectLib.genEffectData(EffectType.STAT, modifiers));
    modifiers[1] = Modifier(ModifierType.MULTIPLY_SPEED, 2500);
    Effect.set(effectTableId, MYTHIC_ACTIVATE_STAT_BUFF, EffectLib.genEffectData(EffectType.STAT, modifiers));

    modifiers[0] = Modifier(ModifierType.REMOVE_EFFECT, COMMON_CHARGE);
    modifiers[1] = Modifier(ModifierType.REMOVE_EFFECT, COMMON_ACTIVATE_STAT_BUFF);
    Effect.set(effectTableId, COMMON_ACTIVATE_AFTER_MOVE, EffectLib.genEffectData(EffectType.AFTER_MOVE, modifiers));
    modifiers[0] = Modifier(ModifierType.REMOVE_EFFECT, RARE_CHARGE);
    modifiers[1] = Modifier(ModifierType.REMOVE_EFFECT, RARE_ACTIVATE_STAT_BUFF);
    Effect.set(effectTableId, RARE_ACTIVATE_AFTER_MOVE, EffectLib.genEffectData(EffectType.AFTER_MOVE, modifiers));
    modifiers[0] = Modifier(ModifierType.REMOVE_EFFECT, EPIC_CHARGE);
    modifiers[1] = Modifier(ModifierType.REMOVE_EFFECT, EPIC_ACTIVATE_STAT_BUFF);
    Effect.set(effectTableId, EPIC_ACTIVATE_AFTER_MOVE, EffectLib.genEffectData(EffectType.AFTER_MOVE, modifiers));
    modifiers[0] = Modifier(ModifierType.REMOVE_EFFECT, LEGENDARY_CHARGE);
    modifiers[1] = Modifier(ModifierType.REMOVE_EFFECT, LEGENDARY_ACTIVATE_STAT_BUFF);
    Effect.set(effectTableId, LEGENDARY_ACTIVATE_AFTER_MOVE, EffectLib.genEffectData(EffectType.AFTER_MOVE, modifiers));
    modifiers[0] = Modifier(ModifierType.REMOVE_EFFECT, MYTHIC_CHARGE);
    modifiers[1] = Modifier(ModifierType.REMOVE_EFFECT, MYTHIC_ACTIVATE_STAT_BUFF);
    Effect.set(effectTableId, MYTHIC_ACTIVATE_AFTER_MOVE, EffectLib.genEffectData(EffectType.AFTER_MOVE, modifiers));

    modifiers[0] = Modifier(ModifierType.APPLY_EFFECT, COMMON_ACTIVATE_STAT_BUFF);
    modifiers[1] = Modifier(ModifierType.APPLY_EFFECT, COMMON_ACTIVATE_AFTER_MOVE);
    Effect.set(effectTableId, COMMON_ACTIVATE_BEFORE_MOVE, EffectLib.genEffectData(EffectType.BEFORE_MOVE, modifiers));
    modifiers[0] = Modifier(ModifierType.APPLY_EFFECT, RARE_ACTIVATE_STAT_BUFF);
    modifiers[1] = Modifier(ModifierType.APPLY_EFFECT, RARE_ACTIVATE_AFTER_MOVE);
    Effect.set(effectTableId, RARE_ACTIVATE_BEFORE_MOVE, EffectLib.genEffectData(EffectType.BEFORE_MOVE, modifiers));
    modifiers[0] = Modifier(ModifierType.APPLY_EFFECT, EPIC_ACTIVATE_STAT_BUFF);
    modifiers[1] = Modifier(ModifierType.APPLY_EFFECT, EPIC_ACTIVATE_AFTER_MOVE);
    Effect.set(effectTableId, EPIC_ACTIVATE_BEFORE_MOVE, EffectLib.genEffectData(EffectType.BEFORE_MOVE, modifiers));
    modifiers[0] = Modifier(ModifierType.APPLY_EFFECT, LEGENDARY_ACTIVATE_STAT_BUFF);
    modifiers[1] = Modifier(ModifierType.APPLY_EFFECT, LEGENDARY_ACTIVATE_AFTER_MOVE);
    Effect.set(
      effectTableId,
      LEGENDARY_ACTIVATE_BEFORE_MOVE,
      EffectLib.genEffectData(EffectType.BEFORE_MOVE, modifiers)
    );
    modifiers[0] = Modifier(ModifierType.APPLY_EFFECT, MYTHIC_ACTIVATE_STAT_BUFF);
    modifiers[1] = Modifier(ModifierType.APPLY_EFFECT, MYTHIC_ACTIVATE_AFTER_MOVE);
    Effect.set(effectTableId, MYTHIC_ACTIVATE_BEFORE_MOVE, EffectLib.genEffectData(EffectType.BEFORE_MOVE, modifiers));
  }
}
