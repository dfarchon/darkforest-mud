// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { Planet } from "../../../lib/Planet.sol";
import { Artifact } from "../../../lib/Artifact.sol";
import { ArtifactStatus, ArtifactRarity } from "../../../codegen/common.sol";
import { DistanceMultiplier } from "../../../codegen/index.sol";
import { ArtifactProxySystem } from "../ArtifactProxySystem.sol";
import { ARTIFACT_INDEX } from "./constant.sol";
import { WormholeDest } from "./tables/WormholeDest.sol";
import { WormholeRecord } from "./tables/WormholeRecord.sol";
import { _wormholeDestTableId, _wormholeRecordTableId } from "./utils.sol";
import { PlanetOwner } from "../../../codegen/index.sol";

contract WormholeSystem is ArtifactProxySystem {
  error WormholeAlreadySet(); // 0x1fa9cff1
  error WormholeNotSet(); // 0xf337e05a
  error WormholeSetToSelf(); // 0x842ec8de
  error WormholeRequiresSameOwner(); // 0x0da3b747

  uint32[6] private _distanceMultipliers = [1000, 500, 250, 125, 62, 31];

  function getArtifactIndex() public pure override returns (uint8) {
    return ARTIFACT_INDEX;
  }

  function _shutdown(Planet memory planet, Artifact memory artifact) internal virtual override {
    super._shutdown(planet, artifact);

    ResourceId wormholeDestTableId = _wormholeDestTableId(_namespace());
    ResourceId wormholeRecordTableId = _wormholeRecordTableId(_namespace());
    bytes32 from = bytes32(planet.planetHash);
    bytes32 to = WormholeDest.get(wormholeDestTableId, uint32(artifact.id));
    if (to == 0) {
      revert WormholeNotSet();
    }
    (bytes32 left, bytes32 right) = from < to ? (from, to) : (to, from);
    uint256 multiplier = DistanceMultiplier.get(left, right);
    if (multiplier != 0) {
      multiplier = (multiplier * 1000) / _distanceMultipliers[uint8(artifact.rarity)];
      DistanceMultiplier.set(left, right, uint32(multiplier));
    }
    WormholeDest.deleteRecord(wormholeDestTableId, uint32(artifact.id));
    WormholeRecord.set(wormholeRecordTableId, left, right, false);
  }

  function _activate(Planet memory planet, Artifact memory artifact, bytes memory inputData) internal virtual override {
    super._activate(planet, artifact, inputData);

    bytes32 to = abi.decode(inputData, (bytes32));
    bytes32 from = bytes32(planet.planetHash);
    if (from == to) {
      revert WormholeSetToSelf();
    }

    if (PlanetOwner.get(to) != PlanetOwner.get(from)) {
      revert WormholeRequiresSameOwner();
    }

    (bytes32 left, bytes32 right) = from < to ? (from, to) : (to, from);
    ResourceId wormholeDestTableId = _wormholeDestTableId(_namespace());
    ResourceId wormholeRecordTableId = _wormholeRecordTableId(_namespace());
    if (WormholeRecord.get(wormholeRecordTableId, left, right)) {
      revert WormholeAlreadySet();
    }
    uint256 multiplier = DistanceMultiplier.get(left, right);
    if (multiplier == 0) {
      multiplier = _distanceMultipliers[uint8(artifact.rarity)];
    } else {
      multiplier = (multiplier * _distanceMultipliers[uint8(artifact.rarity)]) / 1000;
    }
    DistanceMultiplier.set(left, right, uint32(multiplier));
    WormholeDest.set(wormholeDestTableId, uint32(artifact.id), to);
    WormholeRecord.set(wormholeRecordTableId, left, right, true);
  }
}
