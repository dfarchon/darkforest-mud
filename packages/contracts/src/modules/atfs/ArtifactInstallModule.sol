// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { Module } from "@latticexyz/world/src/Module.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { IBaseWorld } from "@latticexyz/world/src/codegen/interfaces/IBaseWorld.sol";
import { revertWithBytes } from "@latticexyz/world/src/revertWithBytes.sol";
import { IInstallLibrary } from "./IInstallLibrary.sol";
import { IArtifactSystem } from "../../codegen/world/IArtifactSystem.sol";
import { IArtifactProxySystem } from "./IArtifactProxySystem.sol";
import { _artifactIndexToNamespace, _artifactProxySystemId } from "./utils.sol";

contract ArtifactInstallModule is Module {
  function install(bytes memory encodedArgs) public {
    // Require the module to not be installed with these args yet
    requireNotInstalled(__self, encodedArgs);

    // Decode args
    (address installLibrary, address artifactProxySystem) = abi.decode(encodedArgs, (address, address));
    uint256 index = IArtifactProxySystem(artifactProxySystem).getArtifactIndex();

    bytes14 namespace = _artifactIndexToNamespace(index);

    // Install artifact
    IBaseWorld world = IBaseWorld(_world());
    (bool success, bytes memory returnData) = installLibrary.delegatecall(
      abi.encodeCall(IInstallLibrary.installArtifact, (world, namespace, artifactProxySystem))
    );
    if (!success) revertWithBytes(returnData);

    // Register artifact proxy system
    world.registerSystem(_artifactProxySystemId(namespace), System(artifactProxySystem), true);

    // Transfer ownership of the namespace to the caller
    world.transferOwnership(WorldResourceIdLib.encodeNamespace(namespace), _msgSender());

    // Register the artifact into the game
    IArtifactSystem(address(world)).df__registerArtifact(index);
  }

  function installRoot(bytes memory) public pure {
    revert Module_RootInstallNotSupported();
  }
}
