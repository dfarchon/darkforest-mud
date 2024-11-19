// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { MudTest } from "@latticexyz/world/test/MudTest.t.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";

import { IWorld } from "../../src/codegen/world/IWorld.sol";
import { Counter, PlanetArtifact, ArtifactOwner } from "../../src/codegen/index.sol";
import { Planet as PlanetTable, PlanetConstants, Move, MoveData, Ticker, TickerData } from "../../src/codegen/index.sol";
import { Artifact as ArtifactTable, ArtifactData, TempConfigSet, DistanceMultiplier } from "../../src/codegen/index.sol";
import { Errors } from "../../src/interfaces/errors.sol";
import { Proof } from "../../src/lib/SnarkProof.sol";
import { BiomebaseInput, MoveInput } from "../../src/lib/VerificationInput.sol";
import { Planet } from "../../src/lib/Planet.sol";
import { PlanetType, SpaceType, ArtifactStatus, ArtifactRarity } from "../../src/codegen/common.sol";
import { Artifact, ArtifactLib } from "../../src/lib/Artifact.sol";
import { ARTIFACT_INDEX as BLOOM_FILTER_INDEX } from "../../src/modules/atfs/BloomFilter/constant.sol";
import { BloomFilterSystem } from "../../src/modules/atfs/BloomFilter/BloomFilterSystem.sol";
import "forge-std/console.sol";

contract BloomFilterTest is MudTest {
  address admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
  uint8[] bloomFilterRequiredMaxLevels = [0, 2, 4, 6, 8, 9];

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
    ArtifactTable.set(1, BLOOM_FILTER_INDEX, ArtifactRarity.COMMON, ArtifactStatus.DEFAULT, 0, 0, 0);
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
    vm.expectRevert(BloomFilterSystem.BloomFilterRarityTooLow.selector);
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
