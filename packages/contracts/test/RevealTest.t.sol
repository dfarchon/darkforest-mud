// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { MudTest } from "@latticexyz/world/test/MudTest.t.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";
import { RevealedPlanet, RevealedPlanetData } from "../src/codegen/index.sol";
import { Errors } from "../src/interfaces/errors.sol";
import { Proof } from "../src/lib/SnarkProof.sol";
import { RevealInput } from "../src/lib/VerificationInput.sol";
import { Planet } from "../src/lib/Planet.sol";
import { PlanetType, SpaceType } from "../src/codegen/common.sol";

contract RevealTest is MudTest {
  address admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
  uint256 p = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

  function testRevealLocation() public {
    vm.prank(admin);
    IWorld(worldAddress).df__unpause();
    IWorld(worldAddress).df__createPlanet(1, address(1), 0, 1, PlanetType.PLANET, SpaceType.NEBULA, 300000, 10000, 0);

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
    assertEq(planet.owner, address(1));
    assertEq(planet.population, 300000);
    assertEq(planet.silver, 10000);
    assertEq(uint8(planet.planetType), uint8(PlanetType.PLANET));
    assertEq(uint8(planet.spaceType), uint8(SpaceType.NEBULA));
    assertEq(planet.level, 1);
  }

  function testRevealLocationOfUncapturedPlanet() public {
    vm.prank(admin);
    IWorld(worldAddress).df__unpause();

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
