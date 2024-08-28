// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Errors } from "../interfaces/errors.sol";
import { UniverseConfig } from "../codegen/index.sol";
import { Planet } from "../lib/Planet.sol";

contract PlanetSystem is System, Errors {
  function newPlanet(uint256 planetHash, uint256 perlin, uint256 distanceSquare)
    public
    view
    returns (Planet memory planet)
  {
    planet.planetHash = planetHash;
    planet.perlin = perlin;
    planet.distSquare = distanceSquare;
    _loading(planet);
  }

  function newPlanet(uint256 planetHash) public view returns (Planet memory planet) {
    planet.planetHash = planetHash;
    _loading(planet);
  }

  function _loading(Planet memory planet) internal view {
    planet.readFromStore();
    planet.sync();
  }
}
