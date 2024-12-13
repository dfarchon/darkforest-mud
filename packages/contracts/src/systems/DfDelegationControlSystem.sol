// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { DelegationControl } from "@latticexyz/world/src/DelegationControl.sol";
import { ResourceId } from "@latticexyz/world/src/WorldResourceId.sol";
import { Player, BurnerToPlayer } from "../codegen/index.sol";
import { GuildUtils } from "../lib/GuildUtils.sol";

contract DfDelegationControlSystem is DelegationControl {
  /**
   * Verify a delegation.
   * Allow delegation if:
   * 1. The sender is the burner address of the delegator, OR
   * 2. The sender's main address and delegator are in the same guild
   */
  function verify(address delegator, ResourceId, bytes memory) public view returns (bool) {
    // Check if sender is the burner address
    if (Player.getBurner(delegator) == _msgSender()) {
      return true;
    }

    address playerAddress = BurnerToPlayer.get(bytes32(uint256(uint160(_msgSender()))));

    if (playerAddress == address(0)) {
      playerAddress = _msgSender();
    }

    // Check if both addresses are in the same guild
    return GuildUtils.inSameGuildNow(playerAddress, delegator);
  }
}
