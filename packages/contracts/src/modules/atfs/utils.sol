// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { RESOURCE_TABLE } from "@latticexyz/store/src/storeResourceTypes.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

import { DF_NAMESPACE, ARTIFACT_METADATA_TABLE_NAME, ARTIFACT_SYSTEM_NAME, ARTIFACT_PROXY_SYSTEM_NAME, EFFECT_TABLE_NAME } from "./constants.sol";

function _artifactIndexToNamespace(uint256 index) pure returns (bytes14) {
  return bytes14(bytes(string.concat("aft.", Strings.toString(index))));
}

function _artifactMetadataTableId(bytes14 namespace) pure returns (ResourceId) {
  return
    WorldResourceIdLib.encode({ typeId: RESOURCE_TABLE, namespace: namespace, name: ARTIFACT_METADATA_TABLE_NAME });
}

function _effectTableId(bytes14 namespace) pure returns (ResourceId) {
  return WorldResourceIdLib.encode({ typeId: RESOURCE_TABLE, namespace: namespace, name: EFFECT_TABLE_NAME });
}

function _artifactSystemId() pure returns (ResourceId) {
  return WorldResourceIdLib.encode({ typeId: RESOURCE_SYSTEM, namespace: DF_NAMESPACE, name: ARTIFACT_SYSTEM_NAME });
}

function _artifactProxySystemId(bytes14 namespace) pure returns (ResourceId) {
  return WorldResourceIdLib.encode({ typeId: RESOURCE_SYSTEM, namespace: namespace, name: ARTIFACT_PROXY_SYSTEM_NAME });
}
