// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { RESOURCE_TABLE } from "@latticexyz/store/src/storeResourceTypes.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { WORMHOLE_DEST_TABLE_NAME, WORMHOLE_RECORD_TABLE_NAME } from "./constant.sol";

function _wormholeDestTableId(bytes14 namespace) pure returns (ResourceId) {
  return WorldResourceIdLib.encode({ typeId: RESOURCE_TABLE, namespace: namespace, name: WORMHOLE_DEST_TABLE_NAME });
}

function _wormholeRecordTableId(bytes14 namespace) pure returns (ResourceId) {
  return WorldResourceIdLib.encode({ typeId: RESOURCE_TABLE, namespace: namespace, name: WORMHOLE_RECORD_TABLE_NAME });
}
