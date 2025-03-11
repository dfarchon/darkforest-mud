// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Ticker } from "codegen/tables/Ticker.sol";
import { MoveData } from "codegen/tables/Move.sol";
import { Planet } from "libraries/Planet.sol";
import { MoveLib } from "libraries/Move.sol";

contract PlanetReadSystem is BaseSystem {
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

  /**
   * @notice Read a planet from storage and sync it to the given tick. Designed for front-end.
   * @param planetHash Planet hash
   * @param tickNumber Tick number
   */
  function readPlanetAt(uint256 planetHash, uint256 tickNumber) public view returns (Planet memory planet) {
    planet.planetHash = planetHash;
    planet.readFromStore();
    _syncTo(planet, tickNumber);
  }

  function _sync(Planet memory planet) internal view {
    uint256 untilTick = Ticker.getTickNumber();
    _syncTo(planet, untilTick);
  }

  function _syncTo(Planet memory planet, uint256 untilTick) internal view {
    MoveData memory move = planet.popArrivedMove(untilTick);
    while (uint256(move.from) != 0) {
      planet.naturalGrowth(move.arrivalTick);
      move.arrivedAt(planet);
      move = planet.popArrivedMove(untilTick);
    }
    planet.naturalGrowth(untilTick);
  }
}
