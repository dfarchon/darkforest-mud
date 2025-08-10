// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { BaseTest } from "./BaseTest.t.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { EntryFee, TempConfigSet, Ticker } from "codegen/index.sol";
import { PlanetType, SpaceType } from "codegen/common.sol";
import { Errors } from "interfaces/errors.sol";
import { Proof } from "libraries/SnarkProof.sol";
import { MoveInput } from "libraries/VerificationInput.sol";
import { IMoveSystem } from "codegen/world/IMoveSystem.sol";
import { MaterialMove } from "../src/lib/Material.sol";

contract EntryFeeTest is BaseTest {
  function _mats(MaterialMove memory m1) internal pure returns (MaterialMove[11] memory a) {
    a[0] = m1;
  }

  function setUp() public override {
    super.setUp();

    vm.deal(user1, 100 ether);

    vm.startPrank(admin);
    // set entry fee to 1 ether
    EntryFee.setFee(1 ether);

    // unpause the universe if needed
    if (Ticker.getPaused()) {
      IWorld(worldAddress).df__unpause();
    }

    // skip snark check
    TempConfigSet.setSkipProofCheck(true);

    // init 2 planets
    IWorld(worldAddress).df__createPlanet(1, user1, 0, 1, PlanetType.PLANET, SpaceType.NEBULA, 300000, 10000, 0);
    IWorld(worldAddress).df__createPlanet(2, user2, 0, 1, PlanetType.PLANET, SpaceType.NEBULA, 200000, 10000, 0);

    vm.stopPrank();
  }

  function testEntryFee() public {
    Proof memory proof;
    MoveInput memory input;
    input.fromPlanetHash = 1;
    input.toPlanetHash = 2;
    input.distance = 80;
    vm.expectRevert(abi.encodeWithSelector(Errors.InsufficientEntryFee.selector, 1 ether));
    vm.prank(user1);
    IWorld(worldAddress).df__move(proof, input, 100000, 1000, 0, _mats(MaterialMove({ resourceId: 0, amount: 0 })));

    vm.prank(user1);
    (bool success, ) = worldAddress.call{ value: 1 ether }(
      abi.encodeWithSelector(IMoveSystem.df__move.selector, proof, input, 100000, 1000, 0)
    );
    assertTrue(success);
  }

  function testUpdateEntryFee() public {
    vm.expectRevert();
    IWorld(worldAddress).df__updateEntryFee(2 ether);

    vm.startPrank(admin);
    IWorld(worldAddress).df__updateEntryFee(2 ether);
    vm.stopPrank();

    assertEq(EntryFee.getFee(), 2 ether);
  }
}
