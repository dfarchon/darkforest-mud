// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { MudTest } from "@latticexyz/world/test/MudTest.t.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";
import { Planet as PlanetTable, ProspectedPlanet, ExploredPlanet, PlanetArtifact, ArtifactOwner } from "../src/codegen/index.sol";
import { Counter, Artifact as ArtifactTable, ArtifactData, PlanetConstants, Ticker, TempConfigSet } from "../src/codegen/index.sol";
import { Errors } from "../src/interfaces/errors.sol";
import { Proof } from "../src/lib/SnarkProof.sol";
import { BiomebaseInput, MoveInput } from "../src/lib/VerificationInput.sol";
import { Planet } from "../src/lib/Planet.sol";
import { PlanetType, SpaceType, ArtifactStatus, ArtifactRarity } from "../src/codegen/common.sol";
import { Artifact, ArtifactLib } from "../src/lib/Artifact.sol";
import { ARTIFACT_INDEX as CANNON_INDEX, COMMON_CHARGE, COMMON_ACTIVATE, COMMON_ACTIVATE_AFTER_MOVE } from "../src/modules/atfs/PhotoidCannon/constant.sol";
import "forge-std/console.sol";

contract CannonTest is MudTest {
  address admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

  function setUp() public virtual override {
    super.setUp();
    vm.startPrank(admin);
    // skip snark check
    TempConfigSet.setSkipProofCheck(true);
    IWorld(worldAddress).df__unpause();
    IWorld(worldAddress).df__createPlanet(1, address(1), 0, 1, PlanetType.FOUNDRY, SpaceType.NEBULA, 300000, 10000, 0);
    vm.stopPrank();
    vm.startPrank(address(1));
    vm.roll(1000);
    IWorld(worldAddress).df__prospectPlanet(1);
    Proof memory proof;
    BiomebaseInput memory input;
    input.planetHash = 1;
    vm.roll(1100);
    IWorld(worldAddress).df__findingArtifact(proof, input);
    vm.stopPrank();
    vm.startPrank(admin);
    ArtifactTable.setArtifactIndex(1, CANNON_INDEX);
    ArtifactTable.setRarity(1, ArtifactRarity.COMMON);
    vm.stopPrank();
  }

  function testChargeCannon() public {
    Planet memory planet = IWorld(worldAddress).df__readPlanet(1);
    Artifact memory artifact = planet.mustGetArtifact(1);
    assertTrue(artifact.status == ArtifactStatus.DEFAULT);
    vm.prank(address(1));
    IWorld(worldAddress).df__chargeArtifact(1, 1);
    Planet memory planetAfter = IWorld(worldAddress).df__readPlanet(1);
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
    IWorld(worldAddress).df__chargeArtifact(1, 1);
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
    IWorld(worldAddress).df__chargeArtifact(1, 1);
    Artifact memory artifact = planet.mustGetArtifact(1);
    vm.warp(block.timestamp + artifact.charge / Ticker.getTickRate() + 1);
    vm.prank(address(1));
    IWorld(worldAddress).df__activateArtifact(1, 1);
    Planet memory planetAfter = IWorld(worldAddress).df__readPlanet(1);
    artifact.readFromStore(Ticker.getTickNumber());
    assertEq(planetAfter.effectNumber, 3);
    assertEq(planetAfter.effects[0].id, COMMON_CHARGE);
    assertEq(planetAfter.effects[1].id, COMMON_ACTIVATE);
    assertEq(planetAfter.effects[2].id, COMMON_ACTIVATE_AFTER_MOVE);
    assertTrue(artifact.status == ArtifactStatus.BROKEN);
    assertTrue(artifact.activateTick == Ticker.getTickNumber());
    assertTrue(planetAfter.range > planet.range);
    assertTrue(planetAfter.speed > planet.speed);
  }
}
