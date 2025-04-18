// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Systems } from "@latticexyz/world/src/codegen/tables/Systems.sol";
import { SystemRegistry } from "@latticexyz/world/src/codegen/tables/SystemRegistry.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { WorldResourceIdInstance } from "@latticexyz/world/src/WorldResourceId.sol";
import { IArtifactProxySystem } from "./IArtifactProxySystem.sol";
import { Planet } from "../../lib/Planet.sol";
import { Artifact } from "../../lib/Artifact.sol";
import { ArtifactMetadata, ArtifactMetadataData } from "./tables/ArtifactMetadata.sol";
import { _artifactMetadataTableId, _artifactSystemId, _artifactIndexToNamespace } from "./utils.sol";
import { Errors } from "../../interfaces/errors.sol";
import { ArtifactStatus, ArtifactGenre, PlanetFlagType } from "../../codegen/common.sol";

abstract contract ArtifactProxySystem is IArtifactProxySystem, System, Errors {
  using WorldResourceIdInstance for ResourceId;

  error Artifact_OnlyCallFromArtifactSystem();

  modifier onlyArtifactSystem() {
    if (Systems.getSystem(_artifactSystemId()) != _msgSender()) {
      revert Artifact_OnlyCallFromArtifactSystem();
    }
    _;
  }

  function getArtifactIndex() public pure virtual returns (uint8);

  function shutdown(
    Planet memory planet,
    Artifact memory artifact
  ) public virtual onlyArtifactSystem returns (Planet memory, Artifact memory) {
    // internal shutdown logic
    _shutdown(planet, artifact);

    return (planet, artifact);
  }

  function charge(
    Planet memory planet,
    Artifact memory artifact,
    bytes memory inputData
  ) public virtual onlyArtifactSystem returns (Planet memory, Artifact memory) {
    // internal charge logic
    _charge(planet, artifact, inputData);

    return (planet, artifact);
  }

  function activate(
    Planet memory planet,
    Artifact memory artifact,
    bytes memory inputData
  ) public virtual onlyArtifactSystem returns (Planet memory, Artifact memory) {
    // internal activate logic
    _activate(planet, artifact, inputData);

    return (planet, artifact);
  }

  /*
   * TODO:
   * Thinking about moving those general logic into a specific system within df namespace
   */

  function _shutdown(Planet memory planet, Artifact memory artifact) internal virtual {
    _unsetFlag(planet, artifact.genre);
    if (artifact.status == ArtifactStatus.ACTIVE && !artifact.reusable) {
      artifact.status = ArtifactStatus.BROKEN;
      planet.removeArtifact(artifact.id);
    } else {
      artifact.status = ArtifactStatus.COOLDOWN;
      artifact.cooldownTick = planet.lastUpdateTick;
    }
  }

  function _charge(Planet memory planet, Artifact memory artifact, bytes memory) internal virtual {
    artifact.chargeTick = planet.lastUpdateTick;
    artifact.status = ArtifactStatus.CHARGING;
    _setFlag(planet, artifact.genre);
  }

  function _activate(Planet memory planet, Artifact memory artifact, bytes memory) internal virtual {
    artifact.activateTick = planet.lastUpdateTick;
    planet.population -= artifact.reqPopulation;
    planet.silver -= artifact.reqSilver;
    if (artifact.durable) {
      artifact.status = ArtifactStatus.ACTIVE;
      _setFlag(planet, artifact.genre);
    } else {
      _unsetFlag(planet, artifact.genre);
      if (artifact.reusable) {
        artifact.status = ArtifactStatus.COOLDOWN;
      } else {
        artifact.status = ArtifactStatus.BROKEN;
        planet.removeArtifact(artifact.id);
      }
    }
  }

  function _setFlag(Planet memory planet, ArtifactGenre genre) internal pure {
    if (genre == ArtifactGenre.OFFENSIVE) {
      planet.setFlag(PlanetFlagType.OFFENSIVE_ARTIFACT);
    } else if (genre == ArtifactGenre.DEFENSIVE) {
      planet.setFlag(PlanetFlagType.DEFENSIVE_ARTIFACT);
    } else if (genre == ArtifactGenre.PRODUCTIVE) {
      planet.setFlag(PlanetFlagType.PRODUCTIVE_ARTIFACT);
    }
  }

  function _unsetFlag(Planet memory planet, ArtifactGenre genre) internal pure {
    if (genre == ArtifactGenre.OFFENSIVE) {
      planet.unsetFlag(PlanetFlagType.OFFENSIVE_ARTIFACT);
    } else if (genre == ArtifactGenre.DEFENSIVE) {
      planet.unsetFlag(PlanetFlagType.DEFENSIVE_ARTIFACT);
    } else if (genre == ArtifactGenre.PRODUCTIVE) {
      planet.unsetFlag(PlanetFlagType.PRODUCTIVE_ARTIFACT);
    }
  }

  function _getMetadata(Artifact memory artifact) internal view returns (ArtifactMetadataData memory) {
    return ArtifactMetadata.get(_artifactMetadataTableId(_namespace()), artifact.rarity);
  }

  function _namespace() internal pure returns (bytes14 namespace) {
    return _artifactIndexToNamespace(getArtifactIndex());
  }
}
