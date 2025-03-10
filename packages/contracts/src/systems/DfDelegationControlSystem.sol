// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { DelegationControl } from "@latticexyz/world/src/DelegationControl.sol";
import { ResourceId } from "@latticexyz/world/src/WorldResourceId.sol";
import { Player } from "codegen/tables/Player.sol";
import { BurnerToPlayer } from "codegen/tables/BurnerToPlayer.sol";
import { GuildUtils } from "libraries/GuildUtils.sol";
import { DFUtils } from "libraries/DFUtils.sol";

contract DfDelegationControlSystem is DelegationControl {
  /**
   * Verify a delegation.
   * Allow delegation if:
   * 1. The sender is the burner address of the delegator, OR
   * 2. The sender's main address and delegator are in the same guild
   */
  function verify(address delegator, ResourceId resourceId, bytes memory) public view returns (bool) {
    // Check if sender is the burner address
    if (Player.getBurner(delegator) == _msgSender()) {
      return true;
    }

    address playerAddress = BurnerToPlayer.get(bytes32(uint256(uint160(_msgSender()))));

    if (playerAddress == address(0)) {
      playerAddress = _msgSender();
    }

    if (DFUtils.isValidSystemResourceId(resourceId) != true) {
      return false;
    }

    return GuildUtils.meetGrantRequirement(delegator, playerAddress);
  }
}
