// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "../codegen/world/IWorld.sol";
import { PlanetType, SpaceType, PlanetStatus } from "../codegen/common.sol";
import { Planet as PlanetTable, PlanetOwner, PlanetConstants, Ticker } from "../codegen/index.sol";
import { Planet } from "../lib/Planet.sol";

contract TestOnlySystem is System {
  function createPlanet(
    uint256 planetHash,
    address owner,
    uint8 perlin,
    uint8 level,
    PlanetType planetType,
    SpaceType spaceType,
    uint64 population,
    uint64 silver,
    uint24 upgrades
  ) public {
    IWorld world = IWorld(_world());
    world.df__tick();

    PlanetConstants.set(bytes32(planetHash), perlin, level, planetType, spaceType);

    PlanetTable.set(
      bytes32(planetHash),
      PlanetStatus.DEFAULT,
      Ticker.getTickNumber(),
      population,
      silver,
      upgrades,
      false
    );

    PlanetOwner.set(bytes32(planetHash), owner);
  }
}
