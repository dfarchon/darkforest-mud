// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { EntryFee } from "codegen/tables/EntryFee.sol";

contract AdminSystem is BaseSystem {
  /**
   * @notice To provide a convenient way for clients to update the entry fee for the game.
   * @param newEntryFee The new entry fee.
   */
  function updateEntryFee(uint256 newEntryFee) public namespaceOwner {
    EntryFee.set(newEntryFee);
  }

  // TODO: move pause, unpause, updateTickerRate to here
}
