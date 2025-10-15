// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Proof } from "libraries/SnarkProof.sol";
import { SpawnInput } from "libraries/VerificationInput.sol";
import { Player } from "codegen/tables/Player.sol";
import { Counter } from "codegen/tables/Counter.sol";
import { TempConfigSet } from "codegen/tables/TempConfigSet.sol";
import { SpawnPlanet } from "codegen/tables/SpawnPlanet.sol";
import { UniverseZoneConfig } from "codegen/tables/UniverseZoneConfig.sol";
import { NameToPlayer } from "codegen/tables/NameToPlayer.sol";
import { BurnerToPlayer } from "codegen/tables/BurnerToPlayer.sol";
import { Planet } from "libraries/Planet.sol";
import { SpaceType, PlanetType } from "codegen/common.sol";
import { DFUtils } from "libraries/DFUtils.sol";
import { PlayerJunkLimit } from "codegen/tables/PlayerJunkLimit.sol";
import { JunkConfig } from "codegen/tables/JunkConfig.sol";

contract PlayerSystem is BaseSystem {
  // TODO: will move errors to each system that uses them. just like this one.
  error PlanetAlreadyOwned(); // 0x4c322828

  /**
   * @notice Register a player.
   * @param name Player name.
   * @param burner Burner wallet address.
   */
  function registerPlayer(string memory name, address burner) public {
    GlobalStats.setRegisterPlayerCount(GlobalStats.getRegisterPlayerCount() + 1);

    address player = _msgSender();
    if (Player.getIndex(player) != 0) {
      revert AlreadyRegistered();
    }
    bytes32 nameHash = keccak256(bytes(name));
    if (NameToPlayer.get(nameHash) != address(0)) {
      revert NameAlreadyTaken();
    }
    if (BurnerToPlayer.get(bytes32(uint256(uint160(burner)))) != address(0)) {
      revert BurnerAlreadyTaken();
    }
    if (BurnerToPlayer.get(bytes32(uint256(uint160(player)))) != address(0)) {
      revert AlreadyRegisteredAsBurner();
    }

    uint256 index = Counter.getPlayer() + 1;
    if (index > TempConfigSet.getPlayerLimit()) {
      revert PlayerLimitReached();
    }

    Counter.setPlayer(uint32(index));
    Player.set(player, burner, uint32(index), uint64(block.timestamp), name);
    NameToPlayer.set(nameHash, player);
    BurnerToPlayer.set(bytes32(uint256(uint160(burner))), player);
  }

  /**
   * @notice Change player name.
   * @param newName New player name.
   */
  function changePlayerName(string memory newName) public {
    address player = _msgSender();
    if (Player.getIndex(player) == 0) {
      revert NotRegistered();
    }
    bytes32 nameHash = keccak256(bytes(newName));
    if (NameToPlayer.get(nameHash) != address(0)) {
      revert NameAlreadyTaken();
    }

    Player.setName(player, newName);
    NameToPlayer.set(nameHash, player);
  }

  /**
   * @notice Change burner wallet address.
   * @param newBurner New burner wallet address.
   */
  function changeBurnerWallet(address newBurner) public {
    address player = _msgSender();
    if (Player.getIndex(player) == 0) {
      revert NotRegistered();
    }
    if (BurnerToPlayer.get(bytes32(uint256(uint160(newBurner)))) != address(0)) {
      revert BurnerAlreadyTaken();
    }

    BurnerToPlayer.set(bytes32(uint256(uint160(newBurner))), player);
    Player.setBurner(player, newBurner);
  }

  /**
   * @notice Spawn a player.
   * @param _proof Snark proof.
   * @param _input SpawnInput.
   */
  function spawnPlayer(Proof memory _proof, SpawnInput memory _input) public returns (uint256) {
    GlobalStats.setSpawnPlayerCount(GlobalStats.getSpawnPlayerCount() + 1);

    address worldAddress = _world();

    // NOTE: allow spawnPlayer when game is paused
    // DFUtils.tick(worldAddress);

    DFUtils.verify(worldAddress, _proof, _input);

    address player = _msgSender();

    if (Player.getIndex(player) == 0) {
      revert NotRegistered();
    }

    if (SpawnPlanet.get(player) != 0) {
      revert AlreadySpawned();
    }

    // new planet instances in memory
    Planet memory planet = DFUtils.readAnyPlanet(worldAddress, _input.planetHash, _input.perlin, _input.radiusSquare);
    if (planet.owner != address(0)) {
      revert PlanetAlreadyOwned();
    }
    planet.changeOwner(player);
    planet.population = 50000; // initial population for player's home planet

    // valid spawn planet
    if (
      planet.universeZone + 1 < UniverseZoneConfig.lengthBorders() ||
      planet.spaceType != SpaceType.NEBULA ||
      planet.level > 0 ||
      planet.planetType != PlanetType.PLANET
    ) {
      revert InvalidSpawnPlanet();
    }

    SpawnPlanet.set(player, planet.planetHash);
    planet.writeToStore();

    uint256 SPACE_JUNK_FREE_ALLOCATION = JunkConfig.getSPACE_JUNK_FREE_ALLOCATION();
    PlayerJunkLimit.set(player, 1000 * SPACE_JUNK_FREE_ALLOCATION);

    return _input.planetHash;
  }

  /**
   * @notice Initialize a player for backward compatibility.
   */
  function initializePlayer(
    uint256[2] memory _a,
    uint256[2][2] memory _b,
    uint256[2] memory _c,
    uint256[9] memory _input
  ) public returns (uint256) {
    Proof memory proof;
    proof.genFrom(_a, _b, _c);
    SpawnInput memory input;
    input.genFrom(_input);
    return spawnPlayer(proof, input);
  }

  function getMsgSender() public view returns (address) {
    return _msgSender();
  }
}
