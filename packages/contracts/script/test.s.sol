// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { stdToml } from "forge-std/StdToml.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";
import { Planet } from "../src/lib/Planet.sol";
import { Proof } from "../src/lib/SnarkProof.sol";
import { MoveInput } from "../src/lib/VerificationInput.sol";
import { Planet as PlanetTable, Player, PlanetOwner } from "../src/codegen/index.sol";

contract TestMove is Script {
  // forge script TestMove --broadcast --sig 'run(address)' 0x8d8b6b8414e1e3dcfd4168561b9be6bd3bf6ec4b --rpc-url http://127.0.0.1:8545 -vvv
  function run(address worldAddress) external {
    // Specify a store so that you can use tables directly in PostDeploy
    StoreSwitch.setStoreAddress(worldAddress);

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

    // Start broadcasting transactions from the deployer account
    vm.startBroadcast(deployerPrivateKey);

    PlanetOwner.set(
      0x00000000f53ea1522cb962ab245e6995dc4d98b2e1bbf16431956a69db4168a6,
      0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    );
  }
}
