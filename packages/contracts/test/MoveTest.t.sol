// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { BaseTest } from "./BaseTest.t.sol";
import { IWorld } from "../src/codegen/world/IWorld.sol";
import { Ticker, TickerData, PendingMove, PendingMoveData, Move, MoveData } from "../src/codegen/index.sol";
import { Planet as PlanetTable, Counter, TempConfigSet } from "../src/codegen/index.sol";
import { PlanetType, SpaceType } from "../src/codegen/common.sol";
import { Planet } from "../src/lib/Planet.sol";
import { Proof } from "../src/lib/SnarkProof.sol";
import { MoveInput } from "../src/lib/VerificationInput.sol";
import { ABDKMath64x64 } from "abdk-libraries-solidity/ABDKMath64x64.sol";

contract MoveTest is BaseTest {
  function setUp() public override {
    super.setUp();

    vm.startPrank(admin);
    // skip snark check
    TempConfigSet.setSkipProofCheck(true);

    // unpause the universe if needed
    if (Ticker.getPaused()) {
      IWorld(worldAddress).df__unpause();
    }

    // init 2 planets
    IWorld(worldAddress).df__createPlanet(1, user1, 0, 1, PlanetType.PLANET, SpaceType.NEBULA, 300000, 10000, 0);
    IWorld(worldAddress).df__createPlanet(2, user2, 0, 1, PlanetType.PLANET, SpaceType.NEBULA, 200000, 10000, 0);

    // set tick rate to 1
    Ticker.setTickRate(1);
    vm.stopPrank();
  }

  function testMove() public {
    vm.warp(block.timestamp + 1000);
    Planet memory planet1 = IWorld(worldAddress).df__readPlanet(1);
    Planet memory planet2 = IWorld(worldAddress).df__readPlanet(2);
    assertEq(planet1.population, 300000);
    assertEq(planet1.silver, 10000);

    Proof memory proof;
    MoveInput memory input;
    input.fromPlanetHash = planet1.planetHash;
    input.toPlanetHash = planet2.planetHash;
    input.distance = 80;
    vm.prank(user1);
    IWorld(worldAddress).df__move(proof, input, 100000, 1000, 0);
    PendingMoveData memory pendingMove = PendingMove.get(bytes32(planet2.planetHash));
    assertEq(pendingMove.head, 0);
    assertEq(pendingMove.number, 1);
    uint256 index = _getIndexAt(pendingMove, 0);
    assertEq(index, 0);
    MoveData memory move1 = Move.get(bytes32(planet2.planetHash), uint8(index));
    assertEq(move1.captain, user1);
    assertEq(move1.id, 1);
    assertEq(move1.from, bytes32(planet1.planetHash));
    assertEq(move1.departureTick, Ticker.getTickNumber());
    assertEq(move1.arrivalTick, move1.departureTick + (input.distance * 100) / planet1.speed);
    assertEq(
      move1.population,
      ABDKMath64x64.toUInt(
        ABDKMath64x64.div(
          ABDKMath64x64.fromUInt(100000),
          ABDKMath64x64.exp_2(ABDKMath64x64.divu(input.distance, planet1.range))
        ) - ABDKMath64x64.divu(planet1.populationCap, 20)
      )
    );
    assertEq(move1.silver, 1000);
    assertEq(move1.artifact, 0);
    assertEq(
      _getPopulationAtTick(planet1, move1.departureTick) - 100000,
      PlanetTable.getPopulation(bytes32(planet1.planetHash))
    );
    assertEq(planet1.silver - 1000, PlanetTable.getSilver(bytes32(planet1.planetHash)));
  }

  function testPendingMove() public {
    vm.warp(block.timestamp + 1000);
    Planet memory planet1 = IWorld(worldAddress).df__readPlanet(1);
    Planet memory planet2 = IWorld(worldAddress).df__readPlanet(2);

    Proof memory proof;
    MoveInput memory input;
    input.fromPlanetHash = planet1.planetHash;
    input.toPlanetHash = planet2.planetHash;
    input.distance = 320;
    vm.prank(user1);
    IWorld(worldAddress).df__move(proof, input, 100000, 1000, 0);
    PendingMoveData memory pendingMove = PendingMove.get(bytes32(planet2.planetHash));
    uint256 index = _getIndexAt(pendingMove, 0);
    MoveData memory move1 = Move.get(bytes32(planet2.planetHash), uint8(index));

    input.distance /= 2;
    planet1 = IWorld(worldAddress).df__readPlanet(1);
    vm.prank(user1);
    IWorld(worldAddress).df__move(proof, input, 110000, 1000, 0);
    pendingMove = PendingMove.get(bytes32(planet2.planetHash));
    assertEq(pendingMove.head, 0);
    assertEq(pendingMove.number, 2);
    // the second move takes less time to arrive than the first move
    index = _getIndexAt(pendingMove, 1);
    assertEq(index, 0);
    index = _getIndexAt(pendingMove, 0);
    assertEq(index, 1);
    MoveData memory move2 = Move.get(bytes32(planet2.planetHash), uint8(index));
    assertEq(move2.id, 2);
    assertEq(move2.departureTick, move1.departureTick);
    assertEq(move2.arrivalTick, move2.departureTick + (input.distance * 100) / planet1.speed);
    assertEq(move2.arrivalTick - move2.departureTick, (move1.arrivalTick - move1.departureTick) / 2);
    assertEq(planet1.population - 110000, PlanetTable.getPopulation(bytes32(planet1.planetHash)));
    assertEq(planet1.silver - 1000, PlanetTable.getSilver(bytes32(planet1.planetHash)));

    input.distance *= 2;
    vm.warp(_getTimestampAtTick(move2.arrivalTick));
    planet2 = IWorld(worldAddress).df__readPlanet(2);
    vm.prank(user1);
    IWorld(worldAddress).df__move(proof, input, 120000, 1000, 0);
    pendingMove = PendingMove.get(bytes32(planet2.planetHash));
    assertEq(pendingMove.head, 1);
    assertEq(pendingMove.number, 2);
    // the second move (index 1) has arrived, the third move(index 1) was newly pushed into the queue
    index = _getIndexAt(pendingMove, 0);
    assertEq(index, 0);
    index = _getIndexAt(pendingMove, 1);
    assertEq(index, 1);
    MoveData memory move3 = Move.get(bytes32(planet2.planetHash), uint8(index));
    assertEq(Counter.getMove(), 3);
    assertEq(move3.id, 3);
    assertEq(
      _getPopulationAtTick(planet2, move2.arrivalTick) - (move2.population * 100) / planet2.defense,
      PlanetTable.getPopulation(bytes32(planet2.planetHash))
    );
    assertEq(planet2.silver + move2.silver, PlanetTable.getSilver(bytes32(planet2.planetHash)));
  }

  function testCapturePlanet() public {
    vm.warp(block.timestamp + 1000);
    Planet memory planet1 = IWorld(worldAddress).df__readPlanet(1);
    Planet memory planet2 = IWorld(worldAddress).df__readPlanet(2);

    Proof memory proof;
    MoveInput memory input;
    input.fromPlanetHash = planet1.planetHash;
    input.toPlanetHash = planet2.planetHash;
    input.distance = 320;
    vm.prank(user1);
    IWorld(worldAddress).df__move(proof, input, 100000, 1000, 0);
    PendingMoveData memory pendingMove = PendingMove.get(bytes32(planet2.planetHash));
    uint256 index = _getIndexAt(pendingMove, 0);
    MoveData memory move1 = Move.get(bytes32(planet2.planetHash), uint8(index));
    input.distance *= 2;
    vm.prank(user1);
    IWorld(worldAddress).df__move(proof, input, 200000, 1000, 0);
    pendingMove = PendingMove.get(bytes32(planet2.planetHash));
    index = _getIndexAt(pendingMove, 1);
    MoveData memory move2 = Move.get(bytes32(planet2.planetHash), uint8(index));

    vm.warp(_getTimestampAtTick(move1.arrivalTick));
    planet2 = IWorld(worldAddress).df__readPlanet(2);
    planet2.population = 1;
    vm.startPrank(admin);
    // set the planet2 population to 1 to let user1 captures it
    PlanetTable.setPopulation(bytes32(planet2.planetHash), 1);
    IWorld(worldAddress).df__tick();
    Planet memory latestPlanet2 = IWorld(worldAddress).df__readPlanet(2);
    assertEq(latestPlanet2.owner, user1);
    assertEq(
      latestPlanet2.population,
      move1.population - ((_getPopulationAtTick(planet2, move1.arrivalTick) * planet2.defense) / 100)
    );
    assertEq(latestPlanet2.silver, move1.silver + planet2.silver);

    vm.warp(_getTimestampAtTick(move2.arrivalTick));
    planet2 = latestPlanet2;
    IWorld(worldAddress).df__tick();
    latestPlanet2 = IWorld(worldAddress).df__readPlanet(2);
    assertEq(latestPlanet2.owner, user1);
    assertEq(latestPlanet2.population, move2.population + _getPopulationAtTick(planet2, move2.arrivalTick));
    assertEq(latestPlanet2.silver, move2.silver + planet2.silver);
  }

  function _getIndexAt(PendingMoveData memory pendingMove, uint8 i) internal pure returns (uint8) {
    return uint8(pendingMove.indexes >> (8 * (29 - ((pendingMove.head + i) % 30))));
  }

  function _getTimestampAtTick(uint256 tick) internal view returns (uint256) {
    TickerData memory ticker = Ticker.get();
    return ticker.timestamp + (tick - ticker.tickNumber) / ticker.tickRate;
  }

  function _getPopulationAtTick(Planet memory planet, uint256 tick) internal pure returns (uint256) {
    uint256 tickElapsed = tick - planet.lastUpdateTick;
    if (tickElapsed == 0) {
      return planet.population;
    }
    if (planet.populationGrowth == 0) {
      return planet.population;
    }
    int128 time = ABDKMath64x64.fromUInt(tickElapsed);
    int128 one = ABDKMath64x64.fromUInt(1);

    int128 denominator = ABDKMath64x64.add(
      ABDKMath64x64.mul(
        ABDKMath64x64.exp(
          ABDKMath64x64.div(
            ABDKMath64x64.mul(
              ABDKMath64x64.mul(ABDKMath64x64.fromInt(-4), ABDKMath64x64.fromUInt(planet.populationGrowth)),
              time
            ),
            ABDKMath64x64.fromUInt(planet.populationCap)
          )
        ),
        ABDKMath64x64.sub(
          ABDKMath64x64.div(ABDKMath64x64.fromUInt(planet.populationCap), ABDKMath64x64.fromUInt(planet.population)),
          one
        )
      ),
      one
    );

    return ABDKMath64x64.toUInt(ABDKMath64x64.div(ABDKMath64x64.fromUInt(planet.populationCap), denominator));
  }
}
