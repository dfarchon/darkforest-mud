// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Proof } from "libraries/SnarkProof.sol";
import { BiomebaseInput } from "libraries/VerificationInput.sol";
import { Planet } from "libraries/Planet.sol";
import { Artifact } from "libraries/Artifact.sol";
import { Counter } from "codegen/tables/Counter.sol";
import { DFUtils } from "libraries/DFUtils.sol";
import { GlobalStats } from "codegen/tables/GlobalStats.sol";
import { PlayerStats } from "codegen/tables/PlayerStats.sol";

contract ArtifactCreateSystem is BaseSystem {
  function prospectPlanet(uint256 planetHash) public entryFee requireSameOwnerAndJunkOwner(planetHash) {
    GlobalStats.setProspectPlanetCount(GlobalStats.getProspectPlanetCount() + 1);
    PlayerStats.setProspectPlanetCount(_msgSender(), PlayerStats.getProspectPlanetCount(_msgSender()) + 1);

    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    planet.prospect(_msgSender());
    planet.writeToStore();
  }

  function findingArtifact(
    Proof memory proof,
    BiomebaseInput memory input
  ) public entryFee requireSameOwnerAndJunkOwner(input.planetHash) {
    GlobalStats.setFindArtifactCount(GlobalStats.getFindArtifactCount() + 1);
    PlayerStats.setFindArtifactCount(_msgSender(), PlayerStats.getFindArtifactCount(_msgSender()) + 1);

    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    DFUtils.verify(worldAddress, proof, input);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, input.planetHash);
    Artifact memory artifact = planet.findArtifact(_msgSender(), input.biomebase);

    Counter.setArtifact(uint24(artifact.id));
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
