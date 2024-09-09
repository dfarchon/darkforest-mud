// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "../codegen/world/IWorld.sol";
import { Errors } from "../interfaces/errors.sol";
import { UniverseConfig, Ticker, MoveData } from "../codegen/index.sol";
import { Planet } from "../lib/Planet.sol";
import { MoveLib } from "../lib/Move.sol";

contract PlanetSystem is System, Errors {
  using MoveLib for MoveData;

  /**
   * @notice Read a planet from storage and sync it to the current tick given by ticker.
   * If the ticker is not up-to-date, the returned planet info is neither.
   * @dev Used for non-inited planets.
   * @param planetHash Planet hash
   * @param perlin Perlin noise
   * @param distanceSquare Square of distance to universe center
   */
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
   * @notice Upgrade a planet. Supports fast upgrading.
   * @param planetHash Planet hash
   * @param rangeUpgrades Times of range upgrades
   * @param speedUpgrades Times of speed upgrades
   * @param defenseUpgrades Times of defense upgrades
   */

  function upgradePlanet(uint256 planetHash, uint256 rangeUpgrades, uint256 speedUpgrades, uint256 defenseUpgrades) public {
    IWorld(_world()).df__tick();
    
    Planet memory planet = readPlanet(planetHash);
    address executor = _msgSender();
    planet.upgrade(executor, rangeUpgrades, speedUpgrades, defenseUpgrades);
    planet.writeToStore();
  }

  /**
   * @notice For backward compatibility.
   * @param _location Planet location
   * @param _branch Branch to upgrade. 0 for defense, 1 for range, 2 for speed
   */
  function upgradePlanet(uint256 _location, uint256 _branch) public {
    assert(_branch < 3);
    if (_branch == 0) {
      upgradePlanet(_location, 0, 0, 1);
    } else if (_branch == 1) {
      upgradePlanet(_location, 1, 0, 0);
    } else {
      upgradePlanet(_location, 0, 1, 0);
    }
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
