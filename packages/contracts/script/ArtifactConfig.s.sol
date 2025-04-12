// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { IArtifactNFT } from "../src/tokens/IArtifactNFT.sol";
import { ArtifactNFT } from "../src/tokens/ArtifactNFT.sol";

contract ArtifactConfig is Script {
  /**
   * @notice Script to configure artifact types, rarities and biomes for the ArtifactNFT contract
   * @dev Run this script with:
   *      forge script script/ArtifactConfig.s.sol --rpc-url <RPC_URL> --broadcast --sig "run(address)" <artifactNftAddress>
   *      Required env vars:
   *      - PRIVATE_KEY: Deployer's private key
   *      Required args:
   *      - artifactNftAddress: Address of deployed ArtifactNFT contract
   */

  function run(address artifactNftAddress) external {
    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    require(artifactNftAddress != address(0), "artifactNftAddress is not set");

    ArtifactNFT nft = ArtifactNFT(artifactNftAddress);

    uint8[] memory artifactTypeIndexes = new uint8[](5);
    string[] memory artifactTypeNames = new string[](5);

    artifactTypeIndexes[3] = 1;
    artifactTypeNames[3] = "Pink Bomb";

    artifactTypeIndexes[1] = 5;
    artifactTypeNames[1] = "Wormhole";

    artifactTypeIndexes[2] = 4;
    artifactTypeNames[2] = "Bloom Filter";

    artifactTypeIndexes[0] = 6;
    artifactTypeNames[0] = "Photoid Cannon";

    nft.bulkSetArtifactTypeNames(artifactTypeIndexes, artifactTypeNames);

    uint8[] memory artifactRarityIndexes = new uint8[](10);
    string[] memory artifactRarityNames = new string[](10);

    artifactRarityIndexes[0] = 1;
    artifactRarityNames[0] = "COMMON";

    artifactRarityIndexes[1] = 2;
    artifactRarityNames[1] = "RARE";

    artifactRarityIndexes[2] = 3;
    artifactRarityNames[2] = "EPIC";

    artifactRarityIndexes[3] = 4;
    artifactRarityNames[3] = "LEGENDARY";

    artifactRarityIndexes[4] = 5;
    artifactRarityNames[4] = "MYTHIC";

    nft.bulkSetArtifactRarityNames(artifactRarityIndexes, artifactRarityNames);

    uint8[] memory biomeIndexes = new uint8[](5);
    string[] memory biomeNames = new string[](5);

    biomeIndexes[0] = 1;
    biomeNames[0] = "OCEAN";

    biomeIndexes[1] = 2;
    biomeNames[1] = "FOREST";

    biomeIndexes[2] = 3;
    biomeNames[2] = "GRASSLAND";

    biomeIndexes[3] = 4;
    biomeNames[3] = "TUNDRA";

    biomeIndexes[4] = 5;
    biomeNames[4] = "SWAMP";

    biomeIndexes[5] = 6;
    biomeNames[5] = "DESERT";

    biomeIndexes[6] = 7;
    biomeNames[6] = "ICE";

    biomeIndexes[7] = 8;
    biomeNames[7] = "WASTELAND";

    biomeIndexes[8] = 9;
    biomeNames[8] = "LAVA";

    biomeIndexes[9] = 10;
    biomeNames[9] = "CORRUPTED";

    nft.bulkSetBiomeNames(biomeIndexes, biomeNames);

    vm.stopBroadcast();
  }
}
