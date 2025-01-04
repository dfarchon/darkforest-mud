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

import { updateWormhole } from "../src/modules/atfs/Wormhole/WormholeUpdateLibrary.sol";

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

    updateWormhole(worldAddress);
  }
}
