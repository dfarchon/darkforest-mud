// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { IBaseWorld } from "@latticexyz/world/src/codegen/interfaces/IBaseWorld.sol";
import { System } from "@latticexyz/world/src/System.sol";

interface IInstallLibrary {
  function installArtifact(IBaseWorld world, System artifactProxySystem) external returns (uint256 index);
}
