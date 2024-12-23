// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "../codegen/world/IWorld.sol";
import { PlanetType, SpaceType, PlanetStatus } from "../codegen/common.sol";
import { Planet as PlanetTable, PlanetOwner, PlanetConstants, Ticker, RevealedPlanet } from "../codegen/index.sol";
import { Planet } from "../lib/Planet.sol";
import { Proof } from "../lib/SnarkProof.sol";
import { SpawnInput } from "../lib/VerificationInput.sol";
import { Errors } from "../interfaces/errors.sol";
import { DFUtils } from "../lib/DFUtils.sol";

contract TestOnlySystem is System, Errors {
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
    DFUtils.tick(_world());

    PlanetConstants.set(bytes32(planetHash), perlin, level, planetType, spaceType);

    PlanetOwner.set(bytes32(planetHash), owner);

    PlanetTable.set(bytes32(planetHash), Ticker.getTickNumber(), population, silver, upgrades, false);
  }

  function revealPlanetByAdmin(uint256 planetHash, int256 x, int256 y) public {
    RevealedPlanet.set(bytes32(planetHash), int32(x), int32(y), _msgSender());
  }

  function safeSetOwner(
    address newOwner,
    uint256[2] memory _a,
    uint256[2][2] memory _b,
    uint256[2] memory _c,
    uint256[9] memory _input
  ) public {
    Proof memory proof;
    proof.genFrom(_a, _b, _c);
    SpawnInput memory input;
    input.genFrom(_input);

    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    DFUtils.verify(worldAddress, proof, input);

    // new planet instances in memory
    Planet memory planet = DFUtils.readAnyPlanet(worldAddress, input.planetHash, input.perlin, input.radiusSquare);
    planet.changeOwner(newOwner);
    planet.population = planet.populationCap;
    planet.silver = planet.silverCap;

    planet.writeToStore();
  }
}
