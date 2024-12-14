// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Planet } from "../../../lib/Planet.sol";
import { Artifact } from "../../../lib/Artifact.sol";
import { ArtifactMetadata, ArtifactMetadataData } from "../tables/ArtifactMetadata.sol";
import { _artifactMetadataTableId, _artifactSystemId } from "../utils.sol";
import { Errors } from "../../../interfaces/errors.sol";
import { ArtifactStatus, ArtifactRarity } from "../../../codegen/common.sol";
import { ArtifactProxySystem } from "../ArtifactProxySystem.sol";
import { EffectLib } from "../../../lib/Effect.sol";
import { ARTIFACT_INDEX, COMMON_CHARGE, RARE_CHARGE, EPIC_CHARGE, LEGENDARY_CHARGE, MYTHIC_CHARGE } from "./constant.sol";
import { COMMON_ACTIVATE_BEFORE_MOVE, RARE_ACTIVATE_BEFORE_MOVE, EPIC_ACTIVATE_BEFORE_MOVE, LEGENDARY_ACTIVATE_BEFORE_MOVE, MYTHIC_ACTIVATE_BEFORE_MOVE } from "./constant.sol";

contract CannonSystem is ArtifactProxySystem {
  using EffectLib for Planet;
  function getArtifactIndex() public pure override returns (uint8) {
    return ARTIFACT_INDEX;
  }

  function _shutdown(Planet memory planet, Artifact memory artifact) internal virtual override {
    super._shutdown(planet, artifact);

    if (artifact.rarity == ArtifactRarity.COMMON) {
      planet.removeEffect(COMMON_CHARGE);
      planet.removeEffect(COMMON_ACTIVATE_BEFORE_MOVE);
    } else if (artifact.rarity == ArtifactRarity.RARE) {
      planet.removeEffect(RARE_CHARGE);
      planet.removeEffect(RARE_ACTIVATE_BEFORE_MOVE);
    } else if (artifact.rarity == ArtifactRarity.EPIC) {
      planet.removeEffect(EPIC_CHARGE);
      planet.removeEffect(EPIC_ACTIVATE_BEFORE_MOVE);
    } else if (artifact.rarity == ArtifactRarity.LEGENDARY) {
      planet.removeEffect(LEGENDARY_CHARGE);
      planet.removeEffect(LEGENDARY_ACTIVATE_BEFORE_MOVE);
    } else if (artifact.rarity == ArtifactRarity.MYTHIC) {
      planet.removeEffect(MYTHIC_CHARGE);
      planet.removeEffect(MYTHIC_ACTIVATE_BEFORE_MOVE);
    }
  }

  function _charge(Planet memory planet, Artifact memory artifact, bytes memory inputData) internal virtual override {
    super._charge(planet, artifact, inputData);

    if (artifact.rarity == ArtifactRarity.COMMON) {
      planet.applyEffect(COMMON_CHARGE);
    } else if (artifact.rarity == ArtifactRarity.RARE) {
      planet.applyEffect(RARE_CHARGE);
    } else if (artifact.rarity == ArtifactRarity.EPIC) {
      planet.applyEffect(EPIC_CHARGE);
    } else if (artifact.rarity == ArtifactRarity.LEGENDARY) {
      planet.applyEffect(LEGENDARY_CHARGE);
    } else if (artifact.rarity == ArtifactRarity.MYTHIC) {
      planet.applyEffect(MYTHIC_CHARGE);
    }
  }

  function _activate(Planet memory planet, Artifact memory artifact, bytes memory inputData) internal virtual override {
    super._activate(planet, artifact, inputData);

    if (artifact.rarity == ArtifactRarity.COMMON) {
      planet.applyEffect(COMMON_ACTIVATE_BEFORE_MOVE);
    } else if (artifact.rarity == ArtifactRarity.RARE) {
      planet.applyEffect(RARE_ACTIVATE_BEFORE_MOVE);
    } else if (artifact.rarity == ArtifactRarity.EPIC) {
      planet.applyEffect(EPIC_ACTIVATE_BEFORE_MOVE);
    } else if (artifact.rarity == ArtifactRarity.LEGENDARY) {
      planet.applyEffect(LEGENDARY_ACTIVATE_BEFORE_MOVE);
    } else if (artifact.rarity == ArtifactRarity.MYTHIC) {
      planet.applyEffect(MYTHIC_ACTIVATE_BEFORE_MOVE);
    }
  }
}
