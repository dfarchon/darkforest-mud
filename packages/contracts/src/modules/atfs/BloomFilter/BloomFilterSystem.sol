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
import { ARTIFACT_INDEX } from "./constant.sol";

contract BloomFilterSystem is ArtifactProxySystem {
  function getArtifactIndex() public pure override returns (uint8) {
    return ARTIFACT_INDEX;
  }

  function _activate(Planet memory planet, Artifact memory artifact, bytes memory inputData) internal virtual override {
    super._activate(planet, artifact, inputData);

    planet.population = planet.populationCap;
  }
}
