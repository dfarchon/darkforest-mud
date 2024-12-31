// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { stdToml } from "forge-std/StdToml.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";

import { WorldAddressHelper } from "./addressHelper.s.sol";
import { IWorld } from "../src/codegen/world/IWorld.sol";
import { Planet } from "../src/lib/Planet.sol";
import { Proof } from "../src/lib/SnarkProof.sol";
import { MoveInput } from "../src/lib/VerificationInput.sol";
import { Planet as PlanetTable, Player, PlanetOwner, SnarkConfig } from "../src/codegen/index.sol";

import { updateWormhole, updateWormhole2 } from "../src/modules/atfs/Wormhole/WormholeUpdateLibrary.sol";
import { WormholeDest } from "../src/modules/atfs/Wormhole/tables/WormholeDest.sol";
import { WormholeRecord } from "../src/modules/atfs/Wormhole/tables/WormholeRecord.sol";
import { Wormhole } from "../src/modules/atfs/Wormhole/tables/Wormhole.sol";
import { Artifact } from "../src/lib/Artifact.sol";
import { ArtifactStatus } from "../src/codegen/common.sol";
import { ARTIFACT_INDEX } from "../src/modules/atfs/Wormhole/constant.sol";
import { _wormholeTableId, _wormholeDestTableId, _wormholeRecordTableId } from "../src/modules/atfs/Wormhole/utils.sol";
contract UpdateWormhole is WorldAddressHelper {
  /**
   * @notice This is an example for writing a script to interact with the contract
   * Usage:
   *    1. copy this file to `packages/contracts/script/test.s.sol`
   *    2. run `forge script UpdateWormhole --broadcast --rpc-url https://rpc.redstonechain.com -vvv`
   */
  function run() external {
    address worldAddress = getWorldAddress();
    // Specify a store so that you can use tables directly in PostDeploy
    StoreSwitch.setStoreAddress(worldAddress);

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

    // Start broadcasting transactions from the deployer account
    vm.startBroadcast(deployerPrivateKey);

    updateWormhole2(worldAddress);
    // updateWormhole(worldAddress);
  }

  // forge script UpdateWormhole --sig "fix(uint256,uint256)" 11, 0x3c9af48e53a9fbb82262ffb1bb3215667d0388e199d149e8cb69db004c94 --broadcast --rpc-url https://rpc.redstonechain.com -vvv
  function fix(uint256 wormholeId, uint256 planetId) external {
    address worldAddress = getWorldAddress();
    // Specify a store so that you can use tables directly in PostDeploy
    StoreSwitch.setStoreAddress(worldAddress);

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

    // Start broadcasting transactions from the deployer account
    vm.startBroadcast(deployerPrivateKey);

    Artifact memory artifact = IWorld(worldAddress).df__readArtifact(wormholeId);
    require(artifact.artifactIndex == ARTIFACT_INDEX, "Not a wormhole");
    require(artifact.status == ArtifactStatus.ACTIVE, "Not active");
    require(
      Wormhole.get(_wormholeTableId(bytes14("atf.5")), bytes32(artifact.planetHash)) == 0,
      "Wormhole already set"
    );
    require(
      WormholeDest.get(_wormholeDestTableId(bytes14("atf.5")), uint32(artifact.id)) == 0,
      "WormholeDest already set"
    );
    require(artifact.planetHash != planetId, "Should provide the connected planet");

    Wormhole.set(_wormholeTableId(bytes14("atf.5")), bytes32(artifact.planetHash), bytes32(planetId));
  }
}
