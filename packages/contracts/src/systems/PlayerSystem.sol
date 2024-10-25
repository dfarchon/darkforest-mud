// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "../codegen/world/IWorld.sol";
import { Errors } from "../interfaces/errors.sol";
import { Proof } from "../lib/SnarkProof.sol";
import { SpawnInput } from "../lib/VerificationInput.sol";
import { Player, Counter, TempConfigSet, SpawnPlanet, UniverseZoneConfig } from "../codegen/index.sol";
import { NameToPlayer, BurnerToPlayer } from "../codegen/index.sol";
import { Planet } from "../lib/Planet.sol";
import { SpaceType, PlanetType } from "../codegen/common.sol";

contract PlayerSystem is System {
  /**
   * @notice Register a player.
   * @param name Player name.
   * @param burner Burner wallet address.
   */
  function registerPlayer(string memory name, address burner) public {
    address player = _msgSender();
    if (Player.getIndex(player) != 0) {
      revert Errors.AlreadyRegistered();
    }
    bytes32 nameHash = keccak256(bytes(name));
    if (NameToPlayer.get(nameHash) != address(0)) {
      revert Errors.NameAlreadyTaken();
    }
    if (BurnerToPlayer.get(bytes32(uint256(uint160(burner)))) != address(0)) {
      revert Errors.BurnerAlreadyTaken();
    }
    if (BurnerToPlayer.get(bytes32(uint256(uint160(player)))) != address(0)) {
      revert Errors.AlreadyRegisteredAsBurner();
    }

    uint256 index = Counter.getPlayer() + 1;
    if (index > TempConfigSet.getPlayerLimit()) {
      revert Errors.PlayerLimitReached();
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
      revert Errors.NotRegistered();
    }
    bytes32 nameHash = keccak256(bytes(newName));
    if (NameToPlayer.get(nameHash) != address(0)) {
      revert Errors.NameAlreadyTaken();
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
      revert Errors.NotRegistered();
    }
    if (BurnerToPlayer.get(bytes32(uint256(uint160(newBurner)))) != address(0)) {
      revert Errors.BurnerAlreadyTaken();
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
    IWorld world = IWorld(_world());
    world.df__tick();

    if (!world.df__verifySpawnProof(_proof, _input)) {
      revert Errors.InvalidSpawnProof();
    }

    address player = _msgSender();

    if (Player.getIndex(player) == 0) {
      revert Errors.NotRegistered();
    }

    if (SpawnPlanet.get(player) != 0) {
      revert Errors.AlreadySpawned();
    }

    // new planet instances in memory
    Planet memory planet = world.df__readPlanet(_input.planetHash, _input.perlin, _input.radiusSquare);
    planet.changeOwner(player);
    planet.population = 50000; // initial population for player's home planet

    // valid spawn planet
    if (
      planet.universeZone + 1 < UniverseZoneConfig.lengthBorders() ||
      planet.spaceType != SpaceType.NEBULA ||
      planet.level > 0 ||
      planet.planetType != PlanetType.PLANET
    ) {
      revert Errors.InvalidSpawnPlanet();
    }

    SpawnPlanet.set(player, planet.planetHash);
    planet.writeToStore();
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
