// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { AccessControl } from "@latticexyz/world/src/AccessControl.sol";
import { SystemRegistry } from "@latticexyz/world/src/codegen/tables/SystemRegistry.sol";
import { Ticker, TickerData } from "codegen/tables/Ticker.sol";
import { InnerCircle, InnerCircleData } from "codegen/tables/InnerCircle.sol";

contract TickSystem is BaseSystem {
  /**
   * @notice Tick. Serves for universal updates.
   * Imagine there is a core game variable which should be updated for each game operation.
   * If this variable is not required to write into the store, then we get two methods to
   * update it. Either calculate the newest value during each operation processing based
   * on some initial number and configuration value, or update it within the 1st operation's
   * process of each block and saves gas for other operations within the same block.
   * Assume that an update in memory costs 500 gas including reading states from store and
   * doing some calculation, and an update in storage costs 5000+500 gas. If in average,
   * there are at least 10 operations from all players within one block, then we save gas
   * by updating it in storage once per block.
   */
  function tick() public {
    TickerData memory ticker = Ticker.get();
    if (ticker.paused) {
      revert Paused();
    }
    _tick(ticker);
    Ticker.set(ticker);
  }

  function pause() public namespaceOwner {
    TickerData memory ticker = Ticker.get();
    if (ticker.paused) {
      revert Paused();
    }
    _tick(ticker);
    _pause(ticker);
    Ticker.set(ticker);
  }

  function unpause() public namespaceOwner {
    TickerData memory ticker = Ticker.get();
    if (!ticker.paused) {
      revert NotPaused();
    }
    _unpause(ticker);
    Ticker.set(ticker);
  }

  function updateTickRate(uint256 tickRate) public namespaceOwner {
    TickerData memory ticker = Ticker.get();
    if (!ticker.paused) {
      _tick(ticker);
    }
    ticker.tickRate = uint64(tickRate);
    Ticker.set(ticker);
  }

  function _tick(TickerData memory ticker) internal {
    // it's ok to revert if current block number is smaller than the last tick block number
    uint256 tickCount = (block.timestamp - ticker.timestamp) * ticker.tickRate;
    if (tickCount == 0) {
      return;
    }

    // global updates
    _globalUpdates(tickCount);

    // update ticker
    ticker.timestamp = uint64(block.timestamp);
    ticker.tickNumber += uint64(tickCount);
  }

  function _pause(TickerData memory ticker) internal pure {
    ticker.paused = true;
  }

  function _unpause(TickerData memory ticker) internal view {
    ticker.paused = false;
    ticker.timestamp = uint64(block.timestamp);
  }

  function _requireOwner() internal view {
    AccessControl.requireOwner(SystemRegistry.get(address(this)), _msgSender());
  }

  // TODO: convert updates to system hooks
  function _globalUpdates(uint256 tickCount) internal {
    _shrinkInnerCircle(tickCount);
  }

  function _shrinkInnerCircle(uint256 tickCount) internal {
    InnerCircleData memory innerCircle = InnerCircle.get();
    if (innerCircle.radius == 0) {
      return;
    }
    uint256 shrinkage = innerCircle.speed * tickCount;
    innerCircle.radiusx1000 = shrinkage > innerCircle.radiusx1000 ? 0 : uint64(innerCircle.radiusx1000 - shrinkage);
    innerCircle.radius = innerCircle.radiusx1000 / 1000;
    InnerCircle.set(innerCircle);
  }
}
