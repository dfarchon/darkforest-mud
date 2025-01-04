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
import { Planet as PlanetTable, Player, PlanetOwner } from "../src/codegen/index.sol";
import { RevealedPlanet, PlanetBiomeConfig, PlanetBiomeConfigData, ArtifactConfig } from "../src/codegen/index.sol";
import { SpaceType, PlanetType, ArtifactRarity, PlanetStatus } from "../src/codegen/common.sol";

contract TestScript2 is WorldAddressHelper {
  using stdToml for string;
  using Strings for uint256;
  /**
   * @notice This is an example for writing a script to interact with the contract
   * Usage:
   *    1. copy this file to `packages/contracts/script/test.s.sol`
   *    2. run `forge script TestScript2 --broadcast --rpc-url https://rpc.redstonechain.com -vvv`
   */
  function run() external {
    address worldAddress = getWorldAddress();
    // Specify a store so that you can use tables directly in PostDeploy
    StoreSwitch.setStoreAddress(worldAddress);

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

    // Start broadcasting transactions from the deployer account
    vm.startBroadcast(deployerPrivateKey);

    // configure the universe
    string memory tomlPath = "df.config.toml";
    string memory toml = vm.readFile(tomlPath);

    uint8[] memory indexes = abi.decode(toml.parseRaw(".artifact.indexes"), (uint8[]));

    for (uint256 i = 1; i <= uint8(type(ArtifactRarity).max); i++) {
      string memory key = string.concat(".artifact.", i.toString());
      ArtifactConfig.set(ArtifactRarity(i), indexes, abi.decode(toml.parseRaw(key), (uint16[])));
    }
  }
}
