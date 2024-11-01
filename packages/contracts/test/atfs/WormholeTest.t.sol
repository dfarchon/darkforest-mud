// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { MudTest } from "@latticexyz/world/test/MudTest.t.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";

import { IWorld } from "../../src/codegen/world/IWorld.sol";
import { Counter, PlanetArtifact, ArtifactOwner } from "../../src/codegen/index.sol";
import { Planet as PlanetTable, Move, MoveData, Ticker, TickerData } from "../../src/codegen/index.sol";
import { Artifact as ArtifactTable, ArtifactData, TempConfigSet, DistanceMultiplier } from "../../src/codegen/index.sol";
import { Errors } from "../../src/interfaces/errors.sol";
import { Proof } from "../../src/lib/SnarkProof.sol";
import { BiomebaseInput, MoveInput } from "../../src/lib/VerificationInput.sol";
import { Planet } from "../../src/lib/Planet.sol";
import { PlanetType, SpaceType, ArtifactStatus, ArtifactRarity } from "../../src/codegen/common.sol";
import { Artifact, ArtifactLib } from "../../src/lib/Artifact.sol";
import { ARTIFACT_INDEX as WORMHOLE_INDEX } from "../../src/modules/atfs/Wormhole/constant.sol";
import { WormholeSystem } from "../../src/modules/atfs/Wormhole/WormholeSystem.sol";
import "forge-std/console.sol";

contract WormholeTest is MudTest {
  address admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
  uint32[] wormholeMultipliers = [1000, 500, 250, 125, 62, 31];

  function setUp() public virtual override {
    super.setUp();
    vm.startPrank(admin);
    // skip snark check
    TempConfigSet.setSkipProofCheck(true);
    IWorld(worldAddress).df__unpause();
    IWorld(worldAddress).df__createPlanet(1, address(1), 0, 1, PlanetType.FOUNDRY, SpaceType.NEBULA, 300000, 10000, 0);
    IWorld(worldAddress).df__createPlanet(2, address(2), 0, 1, PlanetType.PLANET, SpaceType.NEBULA, 300000, 10000, 0);
    Counter.setArtifact(1);
    PlanetArtifact.set(bytes32(uint256(1)), 1);
    ArtifactOwner.set(1, bytes32(uint256(1)));
    ArtifactTable.set(1, WORMHOLE_INDEX, ArtifactRarity.COMMON, ArtifactStatus.DEFAULT, 0, 0, 0);
    vm.stopPrank();
  }

  function testActivateWormhole() public {
    Planet memory planet1 = IWorld(worldAddress).df__readPlanet(1);
    vm.prank(address(1));
    vm.expectRevert(Errors.ArtifactNotChargeable.selector);
    IWorld(worldAddress).df__chargeArtifact(1, 1, bytes(""));

    Artifact memory artifact = IWorld(worldAddress).df__readArtifact(1);
    vm.prank(address(1));
    vm.expectRevert(WormholeSystem.WormholeSetToSelf.selector);
    IWorld(worldAddress).df__activateArtifact(1, 1, abi.encode(uint256(1)));
    vm.prank(address(1));
    IWorld(worldAddress).df__activateArtifact(1, 1, abi.encode(uint256(2)));
    assertEq(
      DistanceMultiplier.get(bytes32(uint256(1)), bytes32(uint256(2))),
      wormholeMultipliers[uint8(artifact.rarity)]
    );

    vm.prank(address(1));
    _move(1, 2, 100, 100000, 5000, 0);
    uint256 distance = (100 * wormholeMultipliers[uint8(artifact.rarity)]) / 1000;
    MoveData memory move1 = Move.get(bytes32(uint256(2)), 0);
    assertEq(move1.arrivalTick, move1.departureTick + (distance * 100) / planet1.speed);
  }

  function testShutdownWormhole() public {
    Planet memory planet1 = IWorld(worldAddress).df__readPlanet(1);
    vm.startPrank(address(1));
    IWorld(worldAddress).df__activateArtifact(1, 1, abi.encode(uint256(2)));
    IWorld(worldAddress).df__shutdownArtifact(1, 1);
    assertEq(DistanceMultiplier.get(bytes32(uint256(1)), bytes32(uint256(2))), 1000);
    Artifact memory artifact = IWorld(worldAddress).df__readArtifact(1);
    assertTrue(artifact.status == ArtifactStatus.COOLDOWN);

    _move(1, 2, 100, 100000, 5000, 1);
    MoveData memory move1 = Move.get(bytes32(uint256(2)), 0);
    assertEq(move1.arrivalTick, move1.departureTick + (100 * 100) / planet1.speed);
    vm.stopPrank();

    vm.warp(_getTimestampAtTick(move1.arrivalTick) + 1);
    IWorld(worldAddress).df__tick();
    artifact = IWorld(worldAddress).df__readArtifact(1);
    vm.expectRevert(Errors.ArtifactNotAvailable.selector);
    vm.prank(address(2));
    IWorld(worldAddress).df__activateArtifact(2, 1, abi.encode(uint256(1)));
    vm.warp(_getTimestampAtTick(artifact.cooldownTick + artifact.cooldown) + 1);
    vm.prank(address(2));
    IWorld(worldAddress).df__activateArtifact(2, 1, abi.encode(uint256(1)));
  }

  function _move(
    uint256 from,
    uint256 to,
    uint256 distance,
    uint256 population,
    uint256 silver,
    uint256 artifact
  ) internal {
    Proof memory proof;
    MoveInput memory input;
    input.fromPlanetHash = from;
    input.toPlanetHash = to;
    input.distance = distance;
    IWorld(worldAddress).df__move(proof, input, population, silver, artifact);
  }

  function _getTimestampAtTick(uint256 tick) internal view returns (uint256) {
    TickerData memory ticker = Ticker.get();
    return ticker.timestamp + (tick - ticker.tickNumber) / ticker.tickRate;
  }
}
