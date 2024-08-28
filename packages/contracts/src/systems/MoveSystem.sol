// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "../codegen/world/IWorld.sol";
import { Errors } from "../interfaces/errors.sol";
import { Proof } from "../lib/SnarkProof.sol";
import { MoveInput } from "../lib/VerificationInput.sol";
import { Planet } from "../lib/Planet.sol";
import { MoveData } from "../codegen/index.sol";
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
    Proof calldata _proof,
    MoveInput calldata _input,
    uint256 _population,
    uint256 _silver,
    uint256 _artifact
  ) public returns (uint256) {
    IWorld world = IWorld(_world());
    world.df__tick();

    
    if (!world.df__verifyMoveProof(_proof, _input)) {
      revert Errors.InvalidMoveProof();
    }

    // new planet instances in memory
    Planet memory fromPlanet = world.df__readPlanet(_input.fromPlanetHash);
    Planet memory toPlanet = world.df__readPlanet(_input.toPlanetHash, _input.toPerlin, _input.toRadiusSquare);

    // create a new move and load all resources
    MoveData memory shipping = MoveLib.NewMove(fromPlanet, _msgSender());
    shipping.loadPopulation(fromPlanet, _population);
    shipping.loadSilver(fromPlanet, _silver);
    shipping.loadArtifact(fromPlanet, _artifact);
    shipping.headTo(toPlanet, UniverseLib.distance(fromPlanet, toPlanet, _input.distance), fromPlanet.speed);

    // write back to storage
    fromPlanet.writeToStore();
    toPlanet.writeToStore();
  }

  /**
   * @notice A move arrives at the destination planet. Update the planet's population, silver, and artifact in memory
   * @param shipping MoveData.
   * @param planet Planet.
   */
  function arrive(MoveData memory shipping, Planet memory planet) public pure {
    assert(shipping.arrivalTime == planet.lastUpdateTick);
    shipping.unloadPopulation(planet);
    shipping.unloadSilver(planet);
    shipping.unloadArtifact(planet);
  }
}
