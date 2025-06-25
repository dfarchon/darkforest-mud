// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { IEffectSystem } from "codegen/world/IEffectSystem.sol";
import { Proof } from "libraries/SnarkProof.sol";
import { MoveInput } from "libraries/VerificationInput.sol";
import { Planet } from "libraries/Planet.sol";
import { Counter } from "codegen/tables/Counter.sol";
import { MoveData } from "codegen/tables/Move.sol";
import { MoveLib } from "libraries/Move.sol";
import { UniverseLib } from "libraries/Universe.sol";
import { EffectLib } from "libraries/Effect.sol";
import { Artifact } from "libraries/Artifact.sol";
import { DFUtils } from "libraries/DFUtils.sol";

contract MoveSystem is BaseSystem {
  using MoveLib for MoveData;

  /**
   * @notice Moves population between planets. Silver and at most 1 piece of artifact can be moved along with the population.
   * @dev We divide the scenario of triggering a cannon from general population move.
   * @param _proof Snark proof.
   * @param _input MoveInput.
   * @param _population Amount of population moved.
   * @param _silver Amount of silver moved along with the population.
   * @param _artifact Id of artifact moved along with the population.
   */
  function move(
    Proof memory _proof,
    MoveInput memory _input,
    uint256 _population,
    uint256 _silver,
    uint256 _artifact
  ) public entryFee {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);
    DFUtils.verify(worldAddress, _proof, _input);

    // new planet instances in memory
    Planet memory fromPlanet = DFUtils.readInitedPlanet(worldAddress, _input.fromPlanetHash);
    if (_input.toPlanetHash == _input.fromPlanetHash) {
      revert MoveToSamePlanet();
    }

    if (fromPlanet.owner != fromPlanet.junkOwner) {
      revert PlanetOwnershipMismatch();
    }

    Planet memory toPlanet = DFUtils.readAnyPlanet(
      worldAddress,
      _input.toPlanetHash,
      _input.toPerlin,
      _input.toRadiusSquare
    );

    // trigger before move effects
    // Discussion: Do we need to implement it via system hooks?
    fromPlanet = IEffectSystem(worldAddress).df__beforeMove(fromPlanet);

    // create a new move and load all resources
    MoveData memory shipping = MoveLib.NewMove(fromPlanet, _msgSender());
    uint256 distance = UniverseLib.distance(fromPlanet, toPlanet, _input.distance);
    shipping.loadPopulation(fromPlanet, _population, distance);
    shipping.loadSilver(fromPlanet, _silver);
    shipping.loadArtifact(fromPlanet, _artifact);
    shipping.headTo(toPlanet, distance, fromPlanet.speed);

    // trigger after move effects
    fromPlanet = IEffectSystem(worldAddress).df__afterMove(fromPlanet);

    // write back to storage
    Counter.setMove(shipping.id);
    DFUtils.writePlanet(worldAddress, fromPlanet);
    DFUtils.writePlanet(worldAddress, toPlanet);
  }

  /**
   * @notice For backward compatibility, we keep the old move function signature.
   */
  function legacyMove(
    uint256[2] memory _a,
    uint256[2][2] memory _b,
    uint256[2] memory _c,
    uint256[11] memory _input,
    uint256 popMoved,
    uint256 silverMoved,
    uint256 movedArtifactId,
    uint256 //isAbandoning
  ) public {
    Proof memory proof;
    proof.genFrom(_a, _b, _c);
    MoveInput memory input;
    input.genFrom(_input);
    return move(proof, input, popMoved, silverMoved, movedArtifactId);
  }
}
