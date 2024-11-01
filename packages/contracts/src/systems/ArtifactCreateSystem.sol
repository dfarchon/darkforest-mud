// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Errors } from "../interfaces/errors.sol";
import { Proof } from "../lib/SnarkProof.sol";
import { BiomebaseInput } from "../lib/VerificationInput.sol";
import { Planet } from "../lib/Planet.sol";
import { Artifact } from "../lib/Artifact.sol";
import { Counter } from "../codegen/index.sol";
import { DFUtils } from "../lib/DFUtils.sol";

contract ArtifactCreateSystem is System, Errors {
  function prospectPlanet(uint256 planetHash) public {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    planet.prospect(_msgSender());
    planet.writeToStore();
  }

  function findingArtifact(Proof memory proof, BiomebaseInput memory input) public {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    DFUtils.verify(worldAddress, proof, input);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, input.planetHash);
    Artifact memory artifact = planet.findArtifact(_msgSender());

    Counter.setArtifact(uint32(artifact.id));
    artifact.writeToStore();
    planet.writeToStore();
  }

  /**
   * @notice For backward compatibility, we keep the old findArtifact function signature.
   */
  function findArtifact(
    uint256[2] memory _a,
    uint256[2][2] memory _b,
    uint256[2] memory _c,
    uint256[7] memory _input
  ) public {
    Proof memory proof;
    proof.genFrom(_a, _b, _c);
    BiomebaseInput memory input;
    input.genFrom(_input);
    return findingArtifact(proof, input);
  }
}
