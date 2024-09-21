// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "../codegen/world/IWorld.sol";
import { Errors } from "../interfaces/errors.sol";
import { Ticker, MoveData } from "../codegen/index.sol";
import { Planet } from "../lib/Planet.sol";
import { MoveLib } from "../lib/Move.sol";

contract PlanetReadSystem is System, Errors {
  using MoveLib for MoveData;

  /**
   * @notice Read a planet from storage and sync it to the current tick given by ticker.
   * If the ticker is not up-to-date, the returned planet info is neither.
   * @dev Used for non-inited planets.
   * @param planetHash Planet hash
   * @param perlin Perlin noise
   * @param distanceSquare Square of distance to universe center
   */
  function readPlanet(
    uint256 planetHash,
    uint256 perlin,
    uint256 distanceSquare
  ) public view returns (Planet memory planet) {
    planet.planetHash = planetHash;
    planet.perlin = perlin;
    planet.distSquare = distanceSquare;
    planet.readFromStore();
    _sync(planet);
  }

  /**
   * @notice Read a planet from storage and sync it to the current tick given by ticker.
   * If the ticker is not up-to-date, the returned planet info is neither.
   * @dev Used for inited planets.
   * @param planetHash Planet hash
   */
  function readPlanet(uint256 planetHash) public view returns (Planet memory planet) {
    planet.planetHash = planetHash;
    planet.readFromStore();
    _sync(planet);
  }

  function _sync(Planet memory planet) internal view {
    uint256 untilTick = Ticker.getTickNumber();
    MoveData memory move = planet.popArrivedMove(untilTick);
    while (uint256(move.from) != 0) {
      planet.naturalGrowth(move.arrivalTime);
      move.arrivedAt(planet);
      move = planet.popArrivedMove(untilTick);
    }
    planet.naturalGrowth(untilTick);
  }
}
