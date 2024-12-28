// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { MudTest } from "@latticexyz/world/test/MudTest.t.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";

import { IWorld } from "../../src/codegen/world/IWorld.sol";
import { Planet as PlanetTable, ProspectedPlanet, PlanetArtifact, ArtifactOwner } from "../../src/codegen/index.sol";
import { Counter, Artifact as ArtifactTable, ArtifactData, PlanetConstants, Ticker, TempConfigSet } from "../../src/codegen/index.sol";
import { Move, MoveData } from "../../src/codegen/index.sol";
import { Errors } from "../../src/interfaces/errors.sol";
import { Proof } from "../../src/lib/SnarkProof.sol";
import { BiomebaseInput, MoveInput } from "../../src/lib/VerificationInput.sol";
import { Planet } from "../../src/lib/Planet.sol";
import { EffectLib } from "../../src/lib/Effect.sol";
import { PlanetType, SpaceType, ArtifactStatus, ArtifactRarity, PlanetFlagType } from "../../src/codegen/common.sol";
import { Artifact, ArtifactLib } from "../../src/lib/Artifact.sol";
import { ARTIFACT_INDEX as CANNON_INDEX, COMMON_CHARGE, COMMON_ACTIVATE_BEFORE_MOVE, COMMON_ACTIVATE_STAT_BUFF } from "../../src/modules/atfs/PhotoidCannon/constant.sol";
import { CannonSystem } from "../../src/modules/atfs/PhotoidCannon/CannonSystem.sol";

import "forge-std/console.sol";

contract CannonTest is MudTest {
  using EffectLib for Planet;

  address admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

  function setUp() public virtual override {
    super.setUp();
    vm.startPrank(admin);
    // skip snark check
    TempConfigSet.setSkipProofCheck(true);
    IWorld(worldAddress).df__unpause();
    IWorld(worldAddress).df__createPlanet(1, address(1), 0, 1, PlanetType.FOUNDRY, SpaceType.NEBULA, 300000, 10000, 0);
    IWorld(worldAddress).df__createPlanet(2, address(2), 0, 1, PlanetType.PLANET, SpaceType.NEBULA, 300000, 10000, 0);
    Counter.setArtifact(2);
    PlanetArtifact.set(bytes32(uint256(1)), (1 << 32) + 2);
    ArtifactOwner.set(1, bytes32(uint256(1)));
    ArtifactOwner.set(2, bytes32(uint256(1)));
    ArtifactTable.set(1, CANNON_INDEX, ArtifactRarity.COMMON, ArtifactStatus.DEFAULT, 0, 0, 0);
    ArtifactTable.set(2, CANNON_INDEX, ArtifactRarity.RARE, ArtifactStatus.DEFAULT, 0, 0, 0);
    vm.stopPrank();
  }

  function testChargeCannon() public {
    Planet memory planet = IWorld(worldAddress).df__readPlanet(1);
    Artifact memory artifact = planet.mustGetArtifact(1);
    assertTrue(artifact.status == ArtifactStatus.DEFAULT);
    vm.prank(address(1));
    IWorld(worldAddress).df__chargeArtifact(1, 1, bytes(""));
    Planet memory planetAfter = IWorld(worldAddress).df__readPlanet(1);
    assertEq(planetAfter.checkFlag(PlanetFlagType.OFFENSIVE_ARTIFACT), true);
    Artifact memory artifactAfter = planetAfter.mustGetArtifact(1);
    assertEq(planetAfter.effectNumber, 1);
    assertEq(planetAfter.effects[0].id, COMMON_CHARGE);
    assertTrue(planetAfter.defense < planet.defense);
    assertTrue(artifactAfter.status == ArtifactStatus.CHARGING);
    assertTrue(artifactAfter.chargeTick == Ticker.getTickNumber());
  }

  function testShutdownCannon() public {
    Planet memory originalPlanet = IWorld(worldAddress).df__readPlanet(1);
    vm.prank(address(1));
    IWorld(worldAddress).df__chargeArtifact(1, 1, bytes(""));
    vm.warp(block.timestamp + 100);
    vm.roll(block.number + 100);
    vm.prank(address(1));
    IWorld(worldAddress).df__shutdownArtifact(1, 1);
    Planet memory planet = IWorld(worldAddress).df__readPlanet(1);
    Artifact memory artifact = planet.mustGetArtifact(1);
    assertEq(planet.effectNumber, 0);
    assertTrue(artifact.status == ArtifactStatus.DEFAULT);
    assertEq(originalPlanet.defense, planet.defense);
  }

  function testActivateCannon() public {
    Planet memory planet = IWorld(worldAddress).df__readPlanet(1);
    vm.prank(address(1));
    IWorld(worldAddress).df__chargeArtifact(1, 1, bytes(""));
    Artifact memory artifact = planet.mustGetArtifact(1);
    vm.warp(block.timestamp + artifact.charge / Ticker.getTickRate() + 1);
    vm.prank(address(1));
    IWorld(worldAddress).df__activateArtifact(1, 1, bytes(""));
    Planet memory planetAfter = IWorld(worldAddress).df__readPlanet(1);
    assertEq(planetAfter.checkFlag(PlanetFlagType.OFFENSIVE_ARTIFACT), false);
    artifact.readFromStore(Ticker.getTickNumber());
    assertEq(planetAfter.effectNumber, 2);
    assertEq(planetAfter.effects[0].id, COMMON_CHARGE);
    assertEq(planetAfter.effects[1].id, COMMON_ACTIVATE_BEFORE_MOVE);
    assertEq(planetAfter.artifactStorage.number, 2 - 1);
    assertTrue(artifact.status == ArtifactStatus.BROKEN);
    assertTrue(artifact.activateTick == Ticker.getTickNumber());

    vm.prank(address(1));
    vm.expectRevert(CannonSystem.OneCannonOnly.selector);
    IWorld(worldAddress).df__chargeArtifact(1, 2, bytes(""));

    vm.prank(address(1));
    _move(1, 2, 80, 100000, 5000, 0);
    planetAfter = IWorld(worldAddress).df__readPlanet(1);
    assertEq(planetAfter.effectNumber, 0);
    assertEq(planetAfter.defense, planet.defense);
    assertEq(planetAfter.range, planet.range);
    assertEq(planetAfter.speed, planet.speed);
    planet.applyEffect(COMMON_ACTIVATE_STAT_BUFF);
    MoveData memory move = Move.get(bytes32(uint256(2)), 0);
    assertEq(move.arrivalTick - move.departureTick, (80 * 100) / planet.speed);
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
}
