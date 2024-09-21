// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "../codegen/world/IWorld.sol";
import { Errors } from "../interfaces/errors.sol";
import { Proof } from "../lib/SnarkProof.sol";
import { BiomebaseInput } from "../lib/VerificationInput.sol";
import { Planet } from "../lib/Planet.sol";
import { Artifact } from "../lib/Artifact.sol";
import { Counter } from "../codegen/index.sol";

contract ArtifactSystem is System, Errors {
  function prospectPlanet(uint256 planetHash) public {
    IWorld world = IWorld(_world());
    world.df__tick();

    Planet memory planet = world.df__readPlanet(planetHash);
    planet.prospect(_msgSender());
    planet.writeToStore();
  }

  function findingArtifact(Proof memory proof, BiomebaseInput memory input) public {
    IWorld world = IWorld(_world());
    world.df__tick();

    if (!world.df__verifyBiomebaseProof(proof, input)) {
      revert Errors.InvalidBiomebaseProof();
    }
    Planet memory planet = world.df__readPlanet(input.planetHash);
    Artifact memory artifact = planet.findArtifact(_msgSender());

    Counter.setArtifact(uint32(artifact.id));
    artifact.writeToStore();
    planet.writeToStore();
  }
}
