// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { DelegationControl } from "@latticexyz/world/src/DelegationControl.sol";
import { ResourceId } from "@latticexyz/world/src/WorldResourceId.sol";
import { Player } from "../codegen/index.sol";

contract DfDelegationControlSystem is DelegationControl {
  /**
   * Verify a delegation.
   */
  function verify(address delegator, ResourceId, bytes memory) public view returns (bool) {
    return Player.getBurner(delegator) == _msgSender();
  }
}
