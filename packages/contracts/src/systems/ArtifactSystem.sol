// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { IWorld } from "../codegen/world/IWorld.sol";
import { Errors } from "../interfaces/errors.sol";
import { Proof } from "../lib/SnarkProof.sol";
import { BiomebaseInput } from "../lib/VerificationInput.sol";
import { Planet } from "../lib/Planet.sol";
import { Artifact } from "../lib/Artifact.sol";
import { Counter, AtfInstallModule, ArtifactRegistry } from "../codegen/index.sol";

contract ArtifactSystem is System, Errors {
  function registerArtifact(uint256 artifactId) public {
    if (_msgSender() != AtfInstallModule.get()) {
      revert Errors.OnlyCallableByArtifactInstallModule();
    }
    if (ArtifactRegistry.get(bytes32(artifactId))) {
      revert Errors.ExistingArtifact();
    }
    ArtifactRegistry.set(bytes32(artifactId), true);
  }

  function chargeArtifact(uint256 planetHash, uint256 artifactId) public {
    IWorld world = IWorld(_world());
    world.df__tick();

    Planet memory planet = world.df__readPlanet(planetHash);
    Artifact memory artifact = planet.mustGetArtifact(artifactId);
    if (planet.owner != _msgSender()) {
      revert Errors.NotPlanetOwner();
    }
    (planet, artifact) = planet.chargeArtifact(artifact, _world());

    artifact.writeToStore();
    planet.writeToStore();
  }

  function shutdownArtifact(uint256 planetHash, uint256 artifactId) public {
    IWorld world = IWorld(_world());
    world.df__tick();

    Planet memory planet = world.df__readPlanet(planetHash);
    Artifact memory artifact = planet.mustGetArtifact(artifactId);
    if (planet.owner != _msgSender()) {
      revert Errors.NotPlanetOwner();
    }
    (planet, artifact) = planet.shutdownArtifact(artifact, _world());

    artifact.writeToStore();
    planet.writeToStore();
  }

  function activateArtifact(uint256 planetHash, uint256 artifactId, bytes memory data) public {
    IWorld world = IWorld(_world());
    world.df__tick();

    Planet memory planet = world.df__readPlanet(planetHash);
    Artifact memory artifact = planet.mustGetArtifact(artifactId);
    if (planet.owner != _msgSender()) {
      revert Errors.NotPlanetOwner();
    }
    (planet, artifact) = planet.activateArtifact(artifact, data, _world());

    artifact.writeToStore();
    planet.writeToStore();
  }

  // function deactivateArtifact(uint256 planetHash, uint256 artifactId) public {
  //   IWorld world = IWorld(_world());
  //   world.df__tick();

  //   Planet memory planet = world.df__readPlanet(planetHash);
  //   Artifact memory artifact = planet.mustGetArtifact(artifactId);
  //   if (planet.owner != _msgSender()) {
  //     revert Errors.NotPlanetOwner();
  //   }
  //   (planet, artifact) = planet.deactivateArtifact(artifact, _world());

  //   artifact.writeToStore();
  //   planet.writeToStore();
  // }
}
