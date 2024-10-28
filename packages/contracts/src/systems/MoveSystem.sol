// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "../codegen/world/IWorld.sol";
import { Errors } from "../interfaces/errors.sol";
import { Proof } from "../lib/SnarkProof.sol";
import { MoveInput } from "../lib/VerificationInput.sol";
import { Planet } from "../lib/Planet.sol";
import { MoveData, Counter } from "../codegen/index.sol";
import { MoveLib } from "../lib/Move.sol";
import { UniverseLib } from "../lib/Universe.sol";

contract MoveSystem is System, Errors {
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
  ) public {
    IWorld world = IWorld(_world());
    world.df__tick();

    if (!world.df__verifyMoveProof(_proof, _input)) {
      revert Errors.InvalidMoveProof();
    }

    // new planet instances in memory
    Planet memory fromPlanet = world.df__readPlanet(_input.fromPlanetHash);
    if (_input.toPlanetHash == _input.fromPlanetHash) {
      revert Errors.MoveToSamePlanet();
    }
    Planet memory toPlanet = world.df__readPlanet(_input.toPlanetHash, _input.toPerlin, _input.toRadiusSquare);
    // create a new move and load all resources
    MoveData memory shipping = MoveLib.NewMove(fromPlanet, _msgSender());
    uint256 distance = UniverseLib.distance(fromPlanet, toPlanet, _input.distance);
    shipping.loadPopulation(fromPlanet, _population, distance);
    shipping.loadSilver(fromPlanet, _silver);
    shipping.loadArtifact(fromPlanet, _artifact);
    shipping.headTo(toPlanet, distance, fromPlanet.speed);

    // write back to storage
    Counter.setMove(shipping.id);
    fromPlanet.writeToStore();
    toPlanet.writeToStore();
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
