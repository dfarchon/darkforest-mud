// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { BaseTest } from "./BaseTest.t.sol";
import { IWorld } from "../src/codegen/world/IWorld.sol";
import { Planet as PlanetTable, ProspectedPlanet, PlanetArtifact, ArtifactOwner, Round } from "../src/codegen/index.sol";
import { Counter, Artifact as ArtifactTable, ArtifactData, PlanetConstants } from "../src/codegen/index.sol";
import { Errors } from "../src/interfaces/errors.sol";
import { Proof } from "../src/lib/SnarkProof.sol";
import { BiomebaseInput, MoveInput } from "../src/lib/VerificationInput.sol";
import { Planet } from "../src/lib/Planet.sol";
import { PlanetType, SpaceType, ArtifactStatus, PlanetFlagType } from "../src/codegen/common.sol";
import { Artifact, ArtifactLib } from "../src/lib/Artifact.sol";
import { TempConfigSet } from "../src/codegen/index.sol";

contract ArtifactTest is BaseTest {
  function setUp() public virtual override {
    super.setUp();
    vm.startPrank(admin);
    // set round number 0
    Round.set(0);
    // skip snark check
    TempConfigSet.setSkipProofCheck(true);
    IWorld(worldAddress).df__unpause();
    IWorld(worldAddress).df__createPlanet(1, address(1), 0, 1, PlanetType.FOUNDRY, SpaceType.NEBULA, 300000, 10000, 0);
    IWorld(worldAddress).df__createPlanet(2, address(2), 0, 1, PlanetType.FOUNDRY, SpaceType.NEBULA, 300000, 10000, 0);
    vm.stopPrank();
  }

  function testProspect() public {
    vm.roll(1000);
    vm.expectRevert(Errors.NotPlanetOwner.selector);
    IWorld(worldAddress).df__prospectPlanet(1);

    vm.prank(admin);
    PlanetConstants.setPlanetType(bytes32(uint256(1)), PlanetType.PLANET);
    vm.prank(address(1));
    vm.expectRevert(Errors.InvalidProspectTarget.selector);
    IWorld(worldAddress).df__prospectPlanet(1);
    vm.prank(admin);
    PlanetConstants.setPlanetType(bytes32(uint256(1)), PlanetType.FOUNDRY);

    vm.prank(address(1));
    IWorld(worldAddress).df__prospectPlanet(1);
    assertEq(ProspectedPlanet.get(bytes32(uint256(1))), 1000);

    vm.roll(1256);
    vm.prank(address(1));
    vm.expectRevert(Errors.PlanetAlreadyProspected.selector);
    IWorld(worldAddress).df__prospectPlanet(1);

    vm.roll(1257);
    vm.prank(address(1));
    IWorld(worldAddress).df__prospectPlanet(1);
  }

  function testFindArtifact() public {
    vm.roll(1000);
    vm.prank(address(1));
    IWorld(worldAddress).df__prospectPlanet(1);

    Proof memory proof;
    BiomebaseInput memory input;
    input.planetHash = 1;

    vm.roll(1100);
    vm.expectRevert(Errors.NotPlanetOwner.selector);
    IWorld(worldAddress).df__findingArtifact(proof, input);

    vm.roll(1300);
    vm.prank(address(1));
    vm.expectRevert(Errors.PlanetNotProspected.selector);
    IWorld(worldAddress).df__findingArtifact(proof, input);

    vm.roll(1100);
    bytes32 hash = blockhash(1000);
    uint256 seed = uint256(keccak256(abi.encodePacked(uint256(1), block.timestamp, hash)));
    vm.prank(address(1));
    IWorld(worldAddress).df__findingArtifact(proof, input);
    Planet memory planet = IWorld(worldAddress).df__readPlanet(1);
    assertEq(planet.checkFlag(PlanetFlagType.EXPLORED), true);
    uint256 artifact = PlanetArtifact.getArtifacts(bytes32(uint256(1)));
    assertEq(artifact, 1);
    assertEq(Counter.getArtifact(), 1);
    assertEq(ArtifactOwner.get(uint32(artifact)), bytes32(uint256(1)));
    ArtifactData memory data = ArtifactTable.get(uint32(artifact));
    Artifact memory tArtifact = ArtifactLib.NewArtifact(seed, 1, 1, SpaceType.NEBULA, 1); // PUNK: biomebase is 1
    assertEq(uint8(data.rarity), uint8(tArtifact.rarity));
    assertEq(uint8(data.artifactIndex), tArtifact.artifactIndex);
    assertEq(uint8(data.status), uint8(ArtifactStatus.DEFAULT));

    vm.roll(2000);
    vm.prank(address(1));
    vm.expectRevert(Errors.PlanetAlreadyExplored.selector);
    IWorld(worldAddress).df__findingArtifact(proof, input);
    vm.prank(address(1));
    vm.expectRevert(Errors.PlanetAlreadyExplored.selector);
    IWorld(worldAddress).df__prospectPlanet(1);
  }

  function testMoveArtifact() public {
    // prospect and find artifact
    vm.roll(1000);
    vm.warp(block.timestamp + 1000);
    vm.prank(address(1));
    IWorld(worldAddress).df__prospectPlanet(1);
    Proof memory proof;
    BiomebaseInput memory input;
    input.planetHash = 1;
    vm.prank(address(1));
    IWorld(worldAddress).df__findingArtifact(proof, input);

    // move artifact
    vm.warp(block.timestamp + 1000);
    vm.prank(address(1));
    _move(1, 2, 80, 100000, 1000, 1);
    assertEq(ArtifactOwner.get(1), bytes32(uint256(1)));
    assertEq(PlanetArtifact.getArtifacts(bytes32(uint256(1))), 0);

    // artifact arrives
    vm.warp(block.timestamp + 1000);
    vm.prank(address(2));
    _move(2, 1, 80, 100000, 1000, 0); // to update two planets
    assertEq(ArtifactOwner.get(1), bytes32(uint256(2)));
    assertEq(PlanetArtifact.getArtifacts(bytes32(uint256(2))), 1);
  }

  function testMoveArtifact2() public {
    // prospect and find artifact
    vm.roll(1000);
    vm.warp(block.timestamp + 1000);
    vm.prank(address(1));
    IWorld(worldAddress).df__prospectPlanet(1);
    Proof memory proof;
    BiomebaseInput memory input;
    input.planetHash = 1;
    vm.prank(address(1));
    IWorld(worldAddress).df__findingArtifact(proof, input);
    vm.prank(address(2));
    IWorld(worldAddress).df__prospectPlanet(2);
    input.planetHash = 2;
    vm.prank(address(2));
    IWorld(worldAddress).df__findingArtifact(proof, input);
    assertEq(Counter.getArtifact(), 2);

    // move artifact
    vm.warp(block.timestamp + 1000);
    vm.prank(address(1));
    _move(1, 2, 80, 50000, 1000, 1);

    // artifact arrives
    vm.warp(block.timestamp + 1000);
    vm.prank(address(2));
    _move(2, 1, 80, 50000, 1000, 0); // to update two planets
    assertEq(PlanetArtifact.getArtifacts(bytes32(uint256(2))), 2 + (uint256(1) << 32));

    // use admin to create more artifacts on planet 2
    vm.prank(admin);
    PlanetArtifact.setArtifacts(bytes32(uint256(2)), 2 + (uint256(1) << 32) + (uint256(3) << 64));

    // move artifact
    vm.prank(address(2));
    _move(2, 1, 80, 50000, 1000, 1);
    assertEq(PlanetArtifact.getArtifacts(bytes32(uint256(2))), 2 + (uint256(3) << 32));

    // artifact arrives
    vm.warp(block.timestamp + 1000);
    vm.prank(address(1));
    _move(1, 2, 80, 50000, 1000, 0); // to update two planets
    assertEq(ArtifactOwner.get(1), bytes32(uint256(1)));
    assertEq(PlanetArtifact.getArtifacts(bytes32(uint256(1))), 1);
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
