// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { MudTest } from "@latticexyz/world/test/MudTest.t.sol";
import { getKeysWithValue } from "@latticexyz/world-modules/src/modules/keyswithvalue/getKeysWithValue.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";
import { PlayerWithdrawSilver } from "../src/codegen/index.sol";
import { Planet as PlanetTable } from "../src/codegen/index.sol";
import { PlanetType, SpaceType } from "../src/codegen/common.sol";
import { Planet } from "../src/lib/Planet.sol";
import { Ticker, TickerData } from "../src/codegen/index.sol";
import { Errors } from "../src/interfaces/errors.sol";

contract WithdrawSilverTest is MudTest {
  address admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
  address user1 = address(1);
  uint256 planetHash = type(uint256).max;

  function setUp() public override {
    super.setUp();

    vm.startPrank(admin);
    // unpause the universe if needed
    if (Ticker.getPaused()) {
      IWorld(worldAddress).df__unpause();
    }

    // init 1 planets
    IWorld(worldAddress).df__createPlanet(
      planetHash,
      user1,
      0,
      9,
      PlanetType.SPACETIME_RIP,
      SpaceType.SPACE,
      800000000,
      800000000,
      0
    );
    vm.stopPrank();
  }

  function testWithdrawSilver() public {
    vm.prank(admin);
    vm.expectRevert(Errors.NotPlanetOwner.selector);
    IWorld(worldAddress).df__withdrawSilver(planetHash, 200000000);
    vm.prank(user1);
    vm.expectRevert(Errors.InsufficientSilverOnPlanet.selector);
    IWorld(worldAddress).df__withdrawSilver(planetHash, 900000000);
    vm.prank(user1);
    vm.expectRevert(Errors.WithdrawAmountTooLow.selector);
    IWorld(worldAddress).df__withdrawSilver(planetHash, 100000000);
    vm.prank(user1);
    IWorld(worldAddress).df__withdrawSilver(planetHash, 300000000);
    Planet memory planet = IWorld(worldAddress).df__readPlanet(planetHash);
    assertEq(planet.silver, 800000000 - 300000000);
    uint256 playerSilverAmount = PlayerWithdrawSilver.get(user1);
    assertEq(playerSilverAmount, 300000000);
  }
}
