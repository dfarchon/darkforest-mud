// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { TickerLib } from "../lib/Ticker.sol";
import { Ticker, TickerData } from "../codegen/index.sol";

contract TickSystem is System {
  using TickerLib for TickerData;

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
    ticker.tick();
    Ticker.set(ticker);
  }

  function pause() public {
    TickerData memory ticker = Ticker.get();
    ticker.pause();
    Ticker.set(ticker);
  }

  function unpause() public {
    TickerData memory ticker = Ticker.get();
    ticker.unpause();
    Ticker.set(ticker);
  }

  function updatePlanet(uint256 planetHash) public { }
}
