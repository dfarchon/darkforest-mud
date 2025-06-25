// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Planet } from "libraries/Planet.sol";
import { Artifact } from "libraries/Artifact.sol";
import { Counter, AtfInstallModule, ArtifactRegistry } from "codegen/index.sol";
import { DFUtils } from "libraries/DFUtils.sol";

contract ArtifactSystem is BaseSystem {
  function registerArtifact(uint256 artifactId) public {
    if (_msgSender() != AtfInstallModule.get()) {
      revert OnlyCallableByArtifactInstallModule();
    }
    if (ArtifactRegistry.get(bytes32(artifactId))) {
      revert ExistingArtifact();
    }
    ArtifactRegistry.set(bytes32(artifactId), true);
  }

  function chargeArtifact(uint256 planetHash, uint256 artifactId, bytes memory data) public entryFee {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    if (planet.owner != planet.junkOwner) {
      revert PlanetOwnershipMismatch();
    }
    Artifact memory artifact = planet.mustGetArtifact(artifactId);
    if (planet.owner != _msgSender()) {
      revert NotPlanetOwner();
    }
    (planet, artifact) = planet.chargeArtifact(artifact, data, worldAddress);

    artifact.writeToStore();
    planet.writeToStore();
  }

  function shutdownArtifact(uint256 planetHash, uint256 artifactId) public entryFee {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    if (planet.owner != planet.junkOwner) {
      revert PlanetOwnershipMismatch();
    }
    Artifact memory artifact = planet.mustGetArtifact(artifactId);
    if (planet.owner != _msgSender()) {
      revert NotPlanetOwner();
    }
    (planet, artifact) = planet.shutdownArtifact(artifact, worldAddress);

    artifact.writeToStore();
    planet.writeToStore();
  }

  function activateArtifact(uint256 planetHash, uint256 artifactId, bytes memory data) public entryFee {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    if (planet.owner != planet.junkOwner) {
      revert PlanetOwnershipMismatch();
    }
    Artifact memory artifact = planet.mustGetArtifact(artifactId);
    if (planet.owner != _msgSender()) {
      revert NotPlanetOwner();
    }
    (planet, artifact) = planet.activateArtifact(artifact, data, worldAddress);

    artifact.writeToStore();
    planet.writeToStore();
  }
}
