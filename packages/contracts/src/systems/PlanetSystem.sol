// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "../codegen/world/IWorld.sol";
import { Errors } from "../interfaces/errors.sol";
import { UniverseConfig, Ticker, MoveData } from "../codegen/index.sol";
import { Planet } from "../lib/Planet.sol";
import { MoveLib } from "../lib/Move.sol";

contract PlanetSystem is System, Errors {
  using MoveLib for MoveData;

  function readPlanet(uint256 planetHash, uint256 perlin, uint256 distanceSquare)
    public
    view
    returns (Planet memory planet)
  {
    planet.planetHash = planetHash;
    planet.perlin = perlin;
    planet.distSquare = distanceSquare;
    planet.readFromStore();
    _sync(planet);
  }

  function readPlanet(uint256 planetHash) public view returns (Planet memory planet) {
    planet.planetHash = planetHash;
    planet.readFromStore();
    _sync(planet);
  }

  function _sync(Planet memory planet) internal view {
    MoveData memory move = planet.moveQueue.PopArrivedMove();
    while (uint256(move.from) != 0) {
      planet.naturalGrowth(move.arrivalTime);
      IWorld(_world()).df__arrive(move, planet);
      move = planet.moveQueue.PopArrivedMove();
    }
    planet.naturalGrowth(Ticker.getTickNumber());
  }
}
