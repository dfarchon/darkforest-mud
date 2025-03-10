// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { EntryFee } from "codegen/tables/EntryFee.sol";
import { Errors } from "interfaces/errors.sol";

contract BaseSystem is System, Errors {
  /**
   * @dev Used to ensure that the system is called with the correct entry fee.
   * We could not implement this via system hooks because hooks won't be given the msg.value.
   * @notice The entry fee is set in the EntryFee table.
   */
  modifier entryFee() {
    uint256 fee = EntryFee.getFee();
    if (_msgValue() < fee) {
      revert InsufficientEntryFee(fee);
    }
    _;
  }

  // TODO: move planet and artifact read/write to here as internal functions
  // TODO: move verify to here as internal function
  // TODO: new an admin system for admin actions including pause/unpause, setEntryFee, etc.
  // TODO: remove any external functions except the tick from the tick system
  // TODO: create some frequently used modifiers, like requireOwner, requirePlanetOwner, etc.
  // TODO: use readable string errors instead of custom errors
  // TODO: fix possible issues lying in ArtifactStorage.push
}
