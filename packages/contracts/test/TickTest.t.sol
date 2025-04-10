// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { IWorld } from "../src/codegen/world/IWorld.sol";
import { Ticker, TickerData, InnerCircle, InnerCircleData } from "../src/codegen/index.sol";
import { BaseTest } from "./BaseTest.t.sol";

contract MoveTest is BaseTest {
  function testTick() public {
    uint256 timestamp = block.timestamp;
    vm.warp(timestamp + 1000);
    vm.startPrank(admin);
    uint64 rate = 10;
    Ticker.setTickRate(rate);
    IWorld(worldAddress).df__unpause();
    TickerData memory ticker = Ticker.get();
    assertEq(ticker.paused, false);
    assertEq(ticker.timestamp, timestamp + 1000);
    assertEq(ticker.tickNumber, 0);
    assertEq(ticker.tickRate, rate);

    vm.warp(timestamp + 1100);
    IWorld(worldAddress).df__tick();
    ticker = Ticker.get();
    assertEq(ticker.timestamp, timestamp + 1100);
    assertEq(ticker.tickNumber, 100 * rate);

    vm.warp(timestamp + 1200);
    IWorld(worldAddress).df__pause();
    ticker = Ticker.get();
    assertEq(ticker.paused, true);
    assertEq(ticker.timestamp, timestamp + 1200);
    assertEq(ticker.tickNumber, 200 * rate);

    vm.warp(timestamp + 1300);
    IWorld(worldAddress).df__unpause();
    ticker = Ticker.get();
    assertEq(ticker.paused, false);
    assertEq(ticker.timestamp, timestamp + 1300);
    assertEq(ticker.tickNumber, 200 * rate);
  }

  function testInnerCircle() public {
    uint256 timestamp = block.timestamp;
    vm.warp(timestamp + 1000);
    vm.startPrank(admin);
    uint64 rate = 3;
    Ticker.setTickRate(rate);
    IWorld(worldAddress).df__unpause();
    uint64 radius = 5000;
    uint64 speed = 2;
    InnerCircle.set(radius, radius * 1000, speed);

    vm.warp(timestamp + 2000);
    IWorld(worldAddress).df__tick();
    InnerCircleData memory innerCircle = InnerCircle.get();
    assertEq(innerCircle.radius, radius - speed * rate);

    vm.warp(timestamp + 3000);
    IWorld(worldAddress).df__pause();
    innerCircle = InnerCircle.get();
    assertEq(innerCircle.radius, radius - speed * 2 * rate);

    vm.warp(timestamp + 4000);
    IWorld(worldAddress).df__unpause();
    innerCircle = InnerCircle.get();
    assertEq(innerCircle.radius, radius - speed * 2 * rate);
  }

  function testTickRate() public {
    vm.startPrank(admin);
    IWorld(worldAddress).df__unpause();
    vm.warp(block.timestamp + 1000);
    uint256 rate = 3;
    IWorld(worldAddress).df__updateTickRate(rate);
    TickerData memory ticker = Ticker.get();

    vm.warp(block.timestamp + 1000);
    IWorld(worldAddress).df__pause();
    assertEq(Ticker.getTickRate(), rate);
    assertEq(Ticker.getTickNumber(), ticker.tickNumber + 1000 * rate);
    ticker = Ticker.get();

    vm.warp(block.timestamp + 1000);
    rate = 10;
    IWorld(worldAddress).df__updateTickRate(rate);
    assertEq(Ticker.getTickRate(), rate);
    assertEq(Ticker.getTickNumber(), ticker.tickNumber);
  }
}
