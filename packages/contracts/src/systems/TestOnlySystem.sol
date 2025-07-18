// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { PlanetType, SpaceType, PlanetStatus } from "codegen/common.sol";
import { Planet as PlanetTable } from "codegen/tables/Planet.sol";
import { PlanetOwner } from "codegen/tables/PlanetOwner.sol";
import { PlanetJunkOwner } from "codegen/tables/PlanetJunkOwner.sol";
import { PlanetConstants } from "codegen/tables/PlanetConstants.sol";
import { Ticker } from "codegen/tables/Ticker.sol";
import { RevealedPlanet } from "codegen/tables/RevealedPlanet.sol";
import { Planet } from "libraries/Planet.sol";
import { Proof } from "libraries/SnarkProof.sol";
import { SpawnInput } from "libraries/VerificationInput.sol";
import { DFUtils } from "libraries/DFUtils.sol";
import { GPTTokens } from "codegen/index.sol";
import { JunkConfig } from "codegen/tables/JunkConfig.sol";
import { PlayerJunk } from "codegen/tables/PlayerJunk.sol";

contract TestOnlySystem is BaseSystem {
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

    setPlanetJunkOwner(planetHash, owner, level);

    PlanetTable.set(bytes32(planetHash), Ticker.getTickNumber(), population, silver, upgrades, false);
  }

  function setPlanetJunkOwner(uint256 planetHash, address junkOwner, uint256 level) public {
    DFUtils.tick(_world());
    PlanetJunkOwner.set(bytes32(planetHash), junkOwner);
    uint256 SPACE_JUNK_LIMIT = JunkConfig.getSPACE_JUNK_LIMIT();
    uint256[] memory PLANET_LEVEL_JUNK = JunkConfig.getPLANET_LEVEL_JUNK();
    uint256 planetJunk = PLANET_LEVEL_JUNK[level];
    uint256 playerJunk = PlayerJunk.get(junkOwner);
    PlayerJunk.set(junkOwner, playerJunk + planetJunk);
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

  /**
   * @notice Admin adds GPT tokens to a player.
   * @param player Address of the player
   * @param amount Number of GPT tokens to add
   */
  function addGPTTokens(address player, uint256 amount) public {
    GPTTokens.set(player, GPTTokens.get(player) + amount);
  }
}
