// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { AccessControl } from "@latticexyz/world/src/AccessControl.sol";
import { SystemRegistry } from "@latticexyz/world/src/codegen/tables/SystemRegistry.sol";
import { EntryFee } from "codegen/tables/EntryFee.sol";
import { Errors } from "interfaces/errors.sol";

contract BaseSystem is System, Errors {
  /**
   * @dev Used to ensure that the system is called with the correct entry fee.
   * We could not implement this via system hooks because hooks won't be given the msg.value.
   */
  modifier entryFee() {
    uint256 fee = EntryFee.getFee();
    if (_msgValue() < fee) {
      revert InsufficientEntryFee(fee);
    }
    _;
  }

  /**
   * @dev Used to ensure that the system is called by the namespace owner.
   * @notice It equals to make a system with close access.
   */
  modifier namespaceOwner() {
    AccessControl.requireOwner(SystemRegistry.get(address(this)), _msgSender());
    _;
  }

  /**
   * @dev Used to ensure that the system is called by a user with access to the namespace
   * or this system.
   */
  modifier hasAccess() {
    AccessControl.requireAccess(SystemRegistry.get(address(this)), _msgSender());
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
