// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IArtifactNFT is IERC721 {
  function mint(address to, uint256 tokenId, uint8 artifactIndex, uint8 artifactRarity, uint8 biome) external;
  function depositFrom(address to, uint256 tokenId, address from) external;
  function setDF(uint8 round, address world) external;
  function getArtifact(uint256 tokenId) external view returns (uint8 index, uint8 rarity, uint8 biome);
}
