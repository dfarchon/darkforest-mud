// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { MudTest } from "@latticexyz/world/test/MudTest.t.sol";
import { getKeysWithValue } from "@latticexyz/world-modules/src/modules/keyswithvalue/getKeysWithValue.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";
import { Ticker, PendingMove, PendingMoveData, Move, MoveData } from "../src/codegen/index.sol";
import { PlanetType, SpaceType } from "../src/codegen/common.sol";
import { Planet } from "../src/lib/Planet.sol";
import { Proof } from "../src/lib/SnarkProof.sol";
import { MoveInput } from "../src/lib/VerificationInput.sol";

contract MoveTest is MudTest {
  address admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
  address user1 = address(1);

  function setUp() public override {
    super.setUp();

    vm.startPrank(admin);
    // unpause the universe if needed
    if (Ticker.getPaused()) {
      IWorld(worldAddress).df__unpause();
    }

    // init 2 planets
    IWorld(worldAddress).df__createPlanet(1, user1, 0, 1, PlanetType.PLANET, SpaceType.NEBULA, 200000, 10000);
    IWorld(worldAddress).df__createPlanet(2, user1, 0, 1, PlanetType.PLANET, SpaceType.NEBULA, 200000, 10000);
    vm.stopPrank();
  }

  function testMove() public {
    vm.roll(200);
    Planet memory planet1 = IWorld(worldAddress).df__readPlanet(1);
    Planet memory planet2 = IWorld(worldAddress).df__readPlanet(2);
    uint256 population = planet1.population;
    assertEq(population, planet2.population);

    uint256 defense = planet2.defense;
    Proof memory proof;
    MoveInput memory input;
    input.fromPlanetHash = planet1.planetHash;
    input.toPlanetHash = planet2.planetHash;
    input.distance = 80;
    vm.prank(user1);
    IWorld(worldAddress).df__move(proof, input, 200000, 1000, 0);
    PendingMoveData memory pendingMove = PendingMove.get(bytes32(planet2.planetHash));
    assertEq(pendingMove.head, 0);
    assertEq(pendingMove.number, 1);
    uint256 index = pendingMove.indexes >> (8 * 29);
    assertEq(index, 0);
    MoveData memory move = Move.get(bytes32(planet2.planetHash), uint8(index));
    assertEq(move.captain, user1);
    assertEq(move.from, bytes32(planet1.planetHash));
    assertEq(move.departureTime, Ticker.getTickNumber());
    assertEq(move.arrivalTime, move.departureTime + input.distance * 100 / planet1.speed);
    // assertEq(move.population, 200000);
    assertEq(move.silver, 1000);
    assertEq(move.artifact, 0);
  }
}
