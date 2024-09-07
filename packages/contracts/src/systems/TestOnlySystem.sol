// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "../codegen/world/IWorld.sol";
import { PlanetType, SpaceType } from "../codegen/common.sol";
import { Planet, PlanetOwner, Ticker } from "../codegen/index.sol";

contract TestOnlySystem is System {
  function createPlanet(
    uint256 planetHash,
    address owner,
    uint8 perlin,
    uint8 level,
    PlanetType planetType,
    SpaceType spaceType,
    uint64 population,
    uint64 silver
  ) public {
    IWorld world = IWorld(_world());
    world.df__tick();

    Planet.set(bytes32(planetHash), Ticker.getTickNumber(), perlin, level, planetType, spaceType, population, silver);
    PlanetOwner.set(bytes32(planetHash), owner);
  }
}
