// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { MudTest } from "@latticexyz/world/test/MudTest.t.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";
import { RevealedPlanet, RevealedPlanetData, LastReveal, Ticker, TempConfigSet } from "../src/codegen/index.sol";
import { Errors } from "../src/interfaces/errors.sol";
import { Proof } from "../src/lib/SnarkProof.sol";
import { RevealInput } from "../src/lib/VerificationInput.sol";
import { Planet } from "../src/lib/Planet.sol";
import { PlanetType, SpaceType } from "../src/codegen/common.sol";

contract RevealTest is MudTest {
  address admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
  uint256 p = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
  uint256 revealCd = 100;

  function setUp() public virtual override {
    super.setUp();
    vm.startPrank(admin);
    IWorld(worldAddress).df__unpause();
    TempConfigSet.setRevealCd(uint32(revealCd));
    // skip snark check
    TempConfigSet.setSkipProofCheck(true);
    vm.stopPrank();
  }

  function testRevealLocation() public {
    vm.prank(admin);
    IWorld(worldAddress).df__createPlanet(1, address(1), 0, 1, PlanetType.PLANET, SpaceType.NEBULA, 300000, 10000, 0);
    uint256 curTick = 1;
    vm.prank(admin);
    Ticker.setTickNumber(uint64(curTick));
    vm.prank(admin);
    LastReveal.set(address(this), uint64(curTick));
    vm.expectRevert(Errors.RevealTooOften.selector);
    Proof memory proof;
    RevealInput memory input;
    input.planetHash = 1;
    input.x = p - 100; // -100
    input.y = 200;
    IWorld(worldAddress).df__revealLocation(proof, input);

    vm.prank(admin);
    Ticker.setTickNumber(uint64(curTick + revealCd));
    IWorld(worldAddress).df__revealLocation(proof, input);
    RevealedPlanetData memory revealedPlanet = RevealedPlanet.get(bytes32(input.planetHash));
    assertEq(revealedPlanet.x, -100);
    assertEq(revealedPlanet.y, 200);
    assertEq(revealedPlanet.revealer, address(this));
    assertEq(LastReveal.get(address(this)), Ticker.getTickNumber());
  }

  function testRevealLocationOfUncapturedPlanet() public {
    uint256 curTick = Ticker.getTickNumber();
    vm.prank(admin);
    Ticker.setTickNumber(uint64(curTick + revealCd));

    Proof memory proof;
    RevealInput memory input;
    input.planetHash = 1;
    input.x = p - 100; // -100
    input.y = 200;
    IWorld(worldAddress).df__revealLocation(proof, input);
    RevealedPlanetData memory revealedPlanet = RevealedPlanet.get(bytes32(input.planetHash));
    assertEq(revealedPlanet.x, -100);
    assertEq(revealedPlanet.y, 200);
    assertEq(revealedPlanet.revealer, address(this));

    Planet memory planet = IWorld(worldAddress).df__readPlanet(1);
    assertTrue(uint8(planet.planetType) > 0);
    assertTrue(uint8(planet.spaceType) > 0);
  }
}
