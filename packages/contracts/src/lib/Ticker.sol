// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { TickerData, InnerCircle, InnerCircleData } from "../codegen/index.sol";
import { Errors } from "../interfaces/errors.sol";

library TickerLib {
  function tick(TickerData memory ticker) internal {
    if (ticker.paused) {
      revert Errors.Paused();
    }

    // it's ok to revert if current block number is smaller than the last tick block number
    uint256 tickCount = (block.number - ticker.blockNumber) * ticker.tickRate;
    if (tickCount == 0) {
      return;
    }

    // global updates
    _globalUpdates(tickCount);

    // update ticker
    ticker.blockNumber = uint64(block.number);
    ticker.tickNumber += uint64(tickCount);
  }

  function pause(TickerData memory ticker) internal {
    tick(ticker);
    ticker.paused = true;
  }

  function unpause(TickerData memory ticker) internal {
    if (!ticker.paused) {
      revert Errors.NotPaused();
    }
    ticker.paused = false;
    ticker.blockNumber = uint64(block.number);
  }

  function _globalUpdates(uint256 tickCount) internal {
    _shrinkInnerCircle(tickCount);
  }

  function _shrinkInnerCircle(uint256 tickCount) internal {
    InnerCircleData memory innerCircle = InnerCircle.get();
    if (innerCircle.radius == 0) {
      return;
    }
    uint256 shrinkage = innerCircle.speed * tickCount;
    InnerCircle.setRadius(shrinkage > innerCircle.radius ? 0 : uint64(innerCircle.radius - shrinkage));
  }
}
