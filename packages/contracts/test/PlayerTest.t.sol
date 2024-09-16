// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { MudTest } from "@latticexyz/world/test/MudTest.t.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";
import { Player, PlayerData, Counter } from "../src/codegen/index.sol";
import { Errors } from "../src/interfaces/errors.sol";
import { Proof } from "../src/lib/SnarkProof.sol";
import { SpawnInput } from "../src/lib/VerificationInput.sol";
import { PlayerSystem } from "../src/systems/PlayerSystem.sol";
import { Planet } from "../src/lib/Planet.sol";
import { PlanetType, SpaceType } from "../src/codegen/common.sol";

contract PlayerTest is MudTest {
  address admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

  function testRegisterPlayer() public {
    vm.roll(100);
    IWorld(worldAddress).df__registerPlayer("test", address(1));
    PlayerData memory player = Player.get(address(this));
    assertEq(player.burner, address(1));
    assertEq(player.index, 1);
    assertEq(player.createdAt, 100);
    assertEq(player.name, "test");

    vm.expectRevert(Errors.AlreadyRegistered.selector);
    IWorld(worldAddress).df__registerPlayer("test", address(2));

    vm.roll(200);
    vm.prank(admin);
    Counter.set(99);
    vm.prank(address(1));
    vm.expectRevert(Errors.NameAlreadyTaken.selector);
    IWorld(worldAddress).df__registerPlayer("test", address(2));
    vm.prank(address(1));
    vm.expectRevert(Errors.BurnerAlreadyTaken.selector);
    IWorld(worldAddress).df__registerPlayer("test1", address(1));
    vm.prank(address(1));
    vm.expectRevert(Errors.AlreadyRegisteredAsBurner.selector);
    IWorld(worldAddress).df__registerPlayer("test1", address(3));
    vm.prank(address(11));
    IWorld(worldAddress).df__registerPlayer("test1", address(2));
    player = Player.get(address(11));
    assertEq(player.burner, address(2));
    assertEq(player.index, 100);
    assertEq(player.createdAt, 200);
    assertEq(player.name, "test1");

    vm.expectRevert(Errors.PlayerLimitReached.selector);
    vm.prank(address(22));
    IWorld(worldAddress).df__registerPlayer("test2", address(3));
  }

  function testChangePlayerName() public {
    vm.expectRevert(Errors.NotRegistered.selector);
    IWorld(worldAddress).df__changePlayerName("test1");

    IWorld(worldAddress).df__registerPlayer("test", address(1));
    PlayerData memory player = Player.get(address(this));
    assertEq(player.name, "test");

    vm.expectRevert(Errors.NameAlreadyTaken.selector);
    IWorld(worldAddress).df__changePlayerName("test");
    IWorld(worldAddress).df__changePlayerName("test1");
    player = Player.get(address(this));
    assertEq(player.name, "test1");
  }

  function testChangeBurnerWallet() public {
    vm.expectRevert(Errors.NotRegistered.selector);
    IWorld(worldAddress).df__changeBurnerWallet(address(1));

    IWorld(worldAddress).df__registerPlayer("test", address(1));
    PlayerData memory player = Player.get(address(this));
    assertEq(player.burner, address(1));

    vm.expectRevert(Errors.BurnerAlreadyTaken.selector);
    IWorld(worldAddress).df__changeBurnerWallet(address(1));
    IWorld(worldAddress).df__changeBurnerWallet(address(2));
    player = Player.get(address(this));
    assertEq(player.burner, address(2));
  }

  function testSpawnPlayer() public {
    vm.prank(admin);
    // unpause the universe
    IWorld(worldAddress).df__unpause();
    Proof memory proof;
    SpawnInput memory input;
    input.planetHash = 4194292 + 1; // in order to get a planet of lvl 0
    input.perlin = 1;
    input.radiusSquare = (112500 + 1) ** 2;

    vm.expectRevert(Errors.NotRegistered.selector);
    IWorld(worldAddress).df__spawnPlayer(proof, input);

    IWorld(worldAddress).df__registerPlayer("test", address(1));
    IWorld(worldAddress).df__spawnPlayer(proof, input);
    Planet memory planet = IWorld(worldAddress).df__readPlanet(input.planetHash);
    assertEq(planet.owner, address(this));
    assertEq(planet.level, 0);
    assertEq(uint8(planet.planetType), uint8(PlanetType.PLANET));
    assertEq(uint8(planet.spaceType), uint8(SpaceType.NEBULA));
    vm.expectRevert(Errors.AlreadySpawned.selector);
    IWorld(worldAddress).df__spawnPlayer(proof, input);
  }

  function testSpawnPlayerFromBurner() public {
    IWorld(worldAddress).df__registerPlayer("test", address(1));
    vm.prank(admin);
    // unpause the universe
    IWorld(worldAddress).df__unpause();
    Proof memory proof;
    SpawnInput memory input;
    input.planetHash = 4194292 + 1; // in order to get a planet of lvl 0
    input.perlin = 1;
    input.radiusSquare = (112500 + 1) ** 2;

    vm.prank(address(2));
    vm.expectRevert();
    IWorld(worldAddress).callFrom(
      address(this),
      WorldResourceIdLib.encode("sy", "df", "PlayerSystem"),
      abi.encodeWithSelector(PlayerSystem.spawnPlayer.selector, proof, input)
    );

    vm.prank(address(1));
    IWorld(worldAddress).callFrom(
      address(this),
      WorldResourceIdLib.encode("sy", "df", "PlayerSystem"),
      abi.encodeWithSelector(PlayerSystem.spawnPlayer.selector, proof, input)
    );
    Planet memory planet = IWorld(worldAddress).df__readPlanet(input.planetHash);
    assertEq(planet.owner, address(this));
    assertEq(planet.level, 0);
    assertEq(uint8(planet.planetType), uint8(PlanetType.PLANET));
    assertEq(uint8(planet.spaceType), uint8(SpaceType.NEBULA));

    vm.expectRevert(Errors.AlreadySpawned.selector);
    vm.prank(address(1));
    IWorld(worldAddress).callFrom(
      address(this),
      WorldResourceIdLib.encode("sy", "df", "PlayerSystem"),
      abi.encodeWithSelector(PlayerSystem.spawnPlayer.selector, proof, input)
    );
  }
}
