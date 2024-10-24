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

import { ArtifactStatus } from "../../codegen/common.sol";

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
    // ArtifactMetadataData memory metadata = _getMetadata(artifact);
    // _updateArtifactStatus(planet, artifact, metadata);
    // _validateShutdownArtifact(planet, artifact, metadata);

    // internal shutdown logic
    _shutdown(planet, artifact);

    return (planet, artifact);
  }

  function charge(
    Planet memory planet,
    Artifact memory artifact
  ) public virtual onlyArtifactSystem returns (Planet memory, Artifact memory) {
    // ArtifactMetadataData memory metadata = _getMetadata(artifact);
    // _updateArtifactStatus(planet, artifact, metadata);
    // _validateChargeArtifact(planet, artifact, metadata);

    // internal charge logic
    _charge(planet, artifact);

    return (planet, artifact);
  }

  function activate(
    Planet memory planet,
    Artifact memory artifact,
    bytes memory inputData
  ) public virtual onlyArtifactSystem returns (Planet memory, Artifact memory) {
    // ArtifactMetadataData memory metadata = _getMetadata(artifact);
    // _updateArtifactStatus(planet, artifact, metadata);
    // _validateActivateArtifact(planet, artifact, metadata);

    // internal activate logic
    _activate(planet, artifact, inputData);

    return (planet, artifact);
  }

  // function deactivate(
  //   Planet memory planet,
  //   Artifact memory artifact
  // ) public virtual onlyArtifactSystem returns (Planet memory, Artifact memory) {
  //   // ArtifactMetadataData memory metadata = _getMetadata(artifact);
  //   // _updateArtifactStatus(planet, artifact, metadata);
  //   // _validateDeactivateArtifact(planet, artifact, metadata);

  //   // internal deactivate logic
  //   _deactivate(planet, artifact);

  //   return (planet, artifact);
  // }

  // function _updateArtifactStatus(
  //   Planet memory planet,
  //   Artifact memory artifact,
  //   ArtifactMetadataData memory metadata
  // ) internal pure {
  //   uint256 curTick = planet.lastUpdateTick;
  //   if (artifact.status == ArtifactStatus.CHARGING && curTick >= artifact.chargeTick + metadata.charge) {
  //     artifact.status = ArtifactStatus.READY;
  //   } else if (artifact.status == ArtifactStatus.COOLDOWN && curTick >= artifact.cooldownTick + metadata.cooldown) {
  //     artifact.status = ArtifactStatus.READY;
  //   }
  // }

  function _shutdown(Planet memory planet, Artifact memory artifact) internal virtual {
    if (artifact.status == ArtifactStatus.ACTIVE) {
      if (artifact.reusable) {
        artifact.status = ArtifactStatus.COOLDOWN;
        artifact.cooldownTick = planet.lastUpdateTick;
      } else {
        artifact.status = ArtifactStatus.BROKEN;
        planet.removeArtifact(artifact.id);
      }
    } else {
      artifact.status = ArtifactStatus.DEFAULT;
    }
  }

  function _charge(Planet memory planet, Artifact memory artifact) internal virtual {
    artifact.chargeTick = planet.lastUpdateTick;
    artifact.status = ArtifactStatus.CHARGING;
  }

  function _activate(Planet memory planet, Artifact memory artifact, bytes memory) internal virtual {
    artifact.activateTick = planet.lastUpdateTick;
    planet.population -= artifact.reqPopulation;
    planet.silver -= artifact.reqSilver;
    if (artifact.durable) {
      artifact.status = ArtifactStatus.ACTIVE;
    } else if (artifact.reusable) {
      artifact.status = ArtifactStatus.COOLDOWN;
    } else {
      artifact.status = ArtifactStatus.BROKEN;
      planet.removeArtifact(artifact.id);
    }
  }

  // function _deactivate(Planet memory planet, Artifact memory artifact) internal virtual {
  //   if (artifact.reusable) {
  //     artifact.status = ArtifactStatus.COOLDOWN;
  //     artifact.cooldownTick = planet.lastUpdateTick;
  //   } else {
  //     artifact.status = ArtifactStatus.BROKEN;
  //     planet.removeArtifact(artifact.id);
  //   }
  // }

  // function _validateShutdownArtifact(
  //   Planet memory,
  //   Artifact memory artifact,
  //   ArtifactMetadataData memory
  // ) internal pure virtual {
  //   if (artifact.status < ArtifactStatus.CHARGING || artifact.status > ArtifactStatus.ACTIVE) {
  //     revert Errors.ArtifactNotAvailable();
  //   }
  // }

  // function _validateChargeArtifact(
  //   Planet memory planet,
  //   Artifact memory artifact,
  //   ArtifactMetadataData memory metadata
  // ) internal pure virtual {
  //   if (planet.level < metadata.reqLevel) {
  //     revert Errors.ArtifactLevelTooLow();
  //   }
  //   if (artifact.status != ArtifactStatus.DEFAULT) {
  //     revert Errors.ArtifactNotAvailable();
  //   }
  //   if (metadata.charge == 0) {
  //     revert Errors.ArtifactNotChargeable();
  //   }
  // }

  // function _validateActivateArtifact(
  //   Planet memory planet,
  //   Artifact memory artifact,
  //   ArtifactMetadataData memory metadata
  // ) internal pure virtual {
  //   if (planet.level < metadata.reqLevel) {
  //     revert Errors.ArtifactLevelTooLow();
  //   }
  //   if (planet.population <= metadata.reqPopulation || planet.silver < metadata.reqSilver) {
  //     revert Errors.NotEnoughResourceToActivate();
  //   }
  //   if (artifact.status != ArtifactStatus.READY) {
  //     revert Errors.ArtifactNotAvailable();
  //   }
  // }

  // function _validateDeactivateArtifact(
  //   Planet memory,
  //   Artifact memory artifact,
  //   ArtifactMetadataData memory
  // ) internal pure virtual {
  //   if (artifact.status != ArtifactStatus.ACTIVE) {
  //     revert Errors.ArtifactNotAvailable();
  //   }
  // }

  function _getMetadata(Artifact memory artifact) internal view returns (ArtifactMetadataData memory) {
    return ArtifactMetadata.get(_artifactMetadataTableId(_namespace()), artifact.rarity);
  }

  function _namespace() internal pure returns (bytes14 namespace) {
    return _artifactIndexToNamespace(getArtifactIndex());
  }
}
