// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { MudTest } from "@latticexyz/world/test/MudTest.t.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { Systems } from "@latticexyz/world/src/codegen/tables/Systems.sol";
import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";

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
import { ArtifactNFT } from "../src/tokens/ArtifactNFT.sol";
import { IArtifactNFT } from "../src/tokens/IArtifactNFT.sol";
import { ArtifactNFT as ArtifactNFTTable } from "../src/codegen/tables/ArtifactNFT.sol";

contract ArtifactNFTTest is MudTest {
  address admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
  ArtifactNFT nft;
  address portalSystem;

  bytes16 constant ARTIFACT_PORTAL_SYSTEM_NAME = "ArtifactPortalSy";
  bytes14 constant DF_NAMESPACE = "df";

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

    // deploy nft
    nft = new ArtifactNFT();
    nft.setDF(0, worldAddress);

    ArtifactNFTTable.set(address(nft));
    vm.stopPrank();
    portalSystem = Systems.getSystem(
      WorldResourceIdLib.encode({ typeId: RESOURCE_SYSTEM, namespace: DF_NAMESPACE, name: ARTIFACT_PORTAL_SYSTEM_NAME })
    );
  }

  function testMint() public {
    vm.expectRevert("mint: not artifact portal system");
    nft.mint(address(1), 1, 1, 1);

    vm.roll(1000);
    vm.prank(address(1));
    IWorld(worldAddress).df__prospectPlanet(1);

    Proof memory proof;
    BiomebaseInput memory input;
    input.planetHash = 1;

    vm.roll(1100);
    vm.prank(address(1));
    IWorld(worldAddress).df__findingArtifact(proof, input);
    uint256 artifact = PlanetArtifact.getArtifacts(bytes32(uint256(1)));
    assertEq(artifact, 1);

    vm.prank(address(1));
    vm.expectRevert(Errors.InvalidPlanetType.selector);
    IWorld(worldAddress).df__withdrawArtifact(1, 1);

    vm.prank(admin);
    PlanetConstants.setPlanetType(bytes32(uint256(1)), PlanetType.SPACETIME_RIP);

    vm.prank(address(2));
    vm.expectRevert(Errors.NotPlanetOwner.selector);
    IWorld(worldAddress).df__withdrawArtifact(1, 1);

    vm.prank(admin);
    ArtifactTable.setStatus(uint32(1), ArtifactStatus.CHARGING);
    vm.prank(address(1));
    vm.expectRevert(Errors.ArtifactInUse.selector);
    IWorld(worldAddress).df__withdrawArtifact(1, 1);

    vm.prank(admin);
    ArtifactTable.setStatus(uint32(1), ArtifactStatus.DEFAULT);

    vm.prank(address(1));
    IWorld(worldAddress).df__withdrawArtifact(1, 1);
    assertEq(nft.ownerOf(1), address(1));
    artifact = PlanetArtifact.getArtifacts(bytes32(uint256(1)));
    assertEq(artifact, 0);
    assertEq(ArtifactOwner.get(uint32(1)), bytes32(0));
  }

  function testDeposit() public {
    // mint artifact nft
    vm.roll(1000);
    vm.prank(address(1));
    IWorld(worldAddress).df__prospectPlanet(1);
    Proof memory proof;
    BiomebaseInput memory input;
    input.planetHash = 1;
    vm.roll(1100);
    vm.prank(address(1));
    IWorld(worldAddress).df__findingArtifact(proof, input);
    vm.prank(admin);
    PlanetConstants.setPlanetType(bytes32(uint256(1)), PlanetType.SPACETIME_RIP);
    vm.prank(address(1));
    IWorld(worldAddress).df__withdrawArtifact(1, 1);

    // deposit artifact nft
    vm.roll(1200);
    vm.expectRevert("depositFrom: to non-df address");
    nft.depositFrom(address(2), 1, address(1));
    vm.expectRevert("depositFrom: not artifact portal system");
    nft.depositFrom(worldAddress, 1, address(1));
    vm.prank(address(1));
    IWorld(worldAddress).df__depositArtifact(1, 1);
    assertEq(nft.ownerOf(1), worldAddress);
    assertEq(PlanetArtifact.getArtifacts(bytes32(uint256(1))), 1);
    assertEq(ArtifactOwner.get(uint32(1)), bytes32(uint256(1)));

    // withdraw artifact nft
    vm.roll(1300);
    vm.prank(address(1));
    IWorld(worldAddress).df__withdrawArtifact(1, 1);
    assertEq(nft.ownerOf(1), address(1));
    assertEq(PlanetArtifact.getArtifacts(bytes32(uint256(1))), 0);
    assertEq(ArtifactOwner.get(uint32(1)), bytes32(0));
  }
}
