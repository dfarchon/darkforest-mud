// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { MudTest } from "@latticexyz/world/test/MudTest.t.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";
import { Planet as PlanetTable, ProspectedPlanet, ExploredPlanet, PlanetArtifact, ArtifactOwner } from "../src/codegen/index.sol";
import { Counter, Artifact as ArtifactTable, ArtifactData, PlanetConstants } from "../src/codegen/index.sol";
import { Errors } from "../src/interfaces/errors.sol";
import { Proof } from "../src/lib/SnarkProof.sol";
import { BiomebaseInput, MoveInput } from "../src/lib/VerificationInput.sol";
import { Planet } from "../src/lib/Planet.sol";
import { PlanetType, SpaceType, ArtifactStatus } from "../src/codegen/common.sol";
import { Artifact, ArtifactLib } from "../src/lib/Artifact.sol";
import "forge-std/console.sol";

contract CannonTest is MudTest {
  address admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

  function setUp() public virtual override {
    super.setUp();
    vm.startPrank(admin);
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
  }

  function testChargeCannon() public {
    Planet memory planet = IWorld(worldAddress).df__readPlanet(1);
    Artifact memory artifact = planet.mustGetArtifact(1);
    vm.prank(address(1));
    IWorld(worldAddress).df__chargeArtifact(1, 1);
    Planet memory planetAfter = IWorld(worldAddress).df__readPlanet(1);
    console.log("planet defense", planet.defense);
    console.log("planetAfter defense", planetAfter.defense);
    console.log("planet effect number", planet.effectNumber);
    console.log("planetAfter effect number", planetAfter.effectNumber);
  }
}
