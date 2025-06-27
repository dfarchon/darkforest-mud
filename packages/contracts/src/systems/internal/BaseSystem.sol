// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { AccessControl } from "@latticexyz/world/src/AccessControl.sol";
import { SystemRegistry } from "@latticexyz/world/src/codegen/tables/SystemRegistry.sol";
import { EntryFee } from "codegen/tables/EntryFee.sol";
import { Errors } from "interfaces/errors.sol";
import { RevenueStats } from "codegen/tables/RevenueStats.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { JunkConfig } from "codegen/tables/JunkConfig.sol";
import { PlanetOwner } from "codegen/tables/PlanetOwner.sol";
import { PlanetJunkOwner } from "codegen/tables/PlanetJunkOwner.sol";

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
    ResourceId resourceId = SystemRegistry.get(address(this));
    bytes32 key = ResourceId.unwrap(resourceId);
    uint256 amount = RevenueStats.get(key) + _msgValue();
    RevenueStats.set(key, amount);
    _;
  }

  /**
   * @dev Used to ensure that the system is called by the namespace owner.
   */
  modifier namespaceOwner() {
    AccessControl.requireOwner(SystemRegistry.get(address(this)), _msgSender());
    _;
  }

  /**
   * @dev Used to ensure that the system is called by a user with access to the namespace
   * or this system.
   * @notice It equals to make a system with close access.
   */
  modifier hasAccess() {
    AccessControl.requireAccess(SystemRegistry.get(address(this)), _msgSender());
    _;
  }

  modifier requireSameOwnerAndJunkOwner(uint256 planetHash) {
    if (JunkConfig.getSPACE_JUNK_ENABLED()) {
      if (PlanetOwner.get(bytes32(planetHash)) != PlanetJunkOwner.get(bytes32(planetHash))) {
        revert NotSameOwnerAndJunkOwner();
      }
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
