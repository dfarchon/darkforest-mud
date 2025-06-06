// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { BaseTest } from "../BaseTest.t.sol";
import { IWorld } from "../../src/codegen/world/IWorld.sol";
import { Counter, PlanetArtifact, ArtifactOwner, Round } from "../../src/codegen/index.sol";
import { Planet as PlanetTable, PlanetConstants, Move, MoveData, Ticker, TickerData } from "../../src/codegen/index.sol";
import { Artifact as ArtifactTable, ArtifactData, TempConfigSet, DistanceMultiplier } from "../../src/codegen/index.sol";
import { Errors } from "../../src/interfaces/errors.sol";
import { Proof } from "../../src/lib/SnarkProof.sol";
import { BiomebaseInput, MoveInput } from "../../src/lib/VerificationInput.sol";
import { Planet } from "../../src/lib/Planet.sol";
import { PlanetType, SpaceType, ArtifactStatus, ArtifactRarity, Biome } from "../../src/codegen/common.sol";
import { Artifact, ArtifactLib } from "../../src/lib/Artifact.sol";
import { ARTIFACT_INDEX as BLOOM_FILTER_INDEX } from "../../src/modules/atfs/BloomFilter/constant.sol";
import { BloomFilterSystem } from "../../src/modules/atfs/BloomFilter/BloomFilterSystem.sol";
import "forge-std/console.sol";

contract BloomFilterTest is BaseTest {
  uint8[] bloomFilterRequiredMaxLevels = [0, 2, 4, 6, 8, 9];

  function setUp() public virtual override {
    super.setUp();
    vm.startPrank(admin);
    // set round number 0
    Round.set(0);
    // skip snark check
    TempConfigSet.setSkipProofCheck(true);
    IWorld(worldAddress).df__unpause();
    IWorld(worldAddress).df__createPlanet(1, address(1), 0, 1, PlanetType.FOUNDRY, SpaceType.NEBULA, 300000, 10000, 0);
    IWorld(worldAddress).df__createPlanet(2, address(2), 0, 1, PlanetType.PLANET, SpaceType.NEBULA, 300000, 10000, 0);
    Counter.setArtifact(1);
    PlanetArtifact.set(bytes32(uint256(1)), 1);
    ArtifactOwner.set(1, bytes32(uint256(1)));
    ArtifactTable.set(1, BLOOM_FILTER_INDEX, ArtifactRarity.COMMON, Biome.CORRUPTED, ArtifactStatus.DEFAULT, 0, 0, 0);
    vm.stopPrank();
  }

  function testActivateBloomFilter() public {
    vm.prank(address(1));
    vm.expectRevert(Errors.ArtifactNotChargeable.selector);
    IWorld(worldAddress).df__chargeArtifact(1, 1, bytes(""));

    vm.startPrank(admin);
    PlanetConstants.setLevel(bytes32(uint256(1)), 9);
    PlanetTable.setPopulation(bytes32(uint256(1)), 1);
    vm.stopPrank();

    vm.prank(address(1));
    vm.expectRevert(Errors.PlanetLevelMismatch.selector);
    IWorld(worldAddress).df__activateArtifact(1, 1, bytes(""));
    vm.prank(admin);
    PlanetConstants.setLevel(bytes32(uint256(1)), 2);
    vm.prank(address(1));
    IWorld(worldAddress).df__activateArtifact(1, 1, bytes(""));

    Planet memory planet = IWorld(worldAddress).df__readPlanet(1);
    assertEq(planet.population, planet.populationCap);
    assertEq(planet.artifactStorage.number, 0);

    Artifact memory artifact = IWorld(worldAddress).df__readArtifact(1);
    assertTrue(artifact.status == ArtifactStatus.BROKEN);
  }
}
