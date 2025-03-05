// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import { Systems } from "@latticexyz/world/src/codegen/tables/Systems.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { IArtifactNFT } from "./IArtifactNFT.sol";

/**
 * @title ArtifactNFT
 * @dev A contract for managing Artifact NFTs
 * @notice This contract is a temporary solution for managing Artifact NFTs.
 * It's possible to make it a mud system.
 */
contract ArtifactNFT is Ownable, ERC721Enumerable, IArtifactNFT {
  bytes14 constant DF_NAMESPACE = "df";
  bytes16 constant ARTIFACT_PORTAL_SYSTEM_NAME = "ArtifactPortalSy";

  struct Artifact {
    uint8 index;
    uint8 rarity;
  }

  mapping(uint8 round => address world) public dfs;
  mapping(address world => bool isDF) public isDF;
  mapping(uint256 tokenId => Artifact artifact) public artifacts;

  event DFUpdated(uint8 indexed round, address indexed world);
  event Minted(address indexed to, uint256 indexed tokenId);

  modifier onlyDFCanMint(uint256 tokenId) {
    uint8 round = uint8(tokenId >> 24);
    require(_getDFArtifactSystemAddress(dfs[round]) == msg.sender, "mint: not artifact portal system");
    _;
  }

  modifier onlyDFCanDeposit(address world) {
    require(isDF[world], "depositFrom: to non-df address");
    require(_getDFArtifactSystemAddress(world) == msg.sender, "depositFrom: not artifact portal system");
    _;
  }

  constructor() Ownable(msg.sender) ERC721("DFArtifact", "DFATF") {}

  /**
   * Mint function for minting Artifact NFTs
   * @param to address owns the minted NFT
   * @param tokenId tokenId of the minted NFT
   * @param artifactIndex index of the artifact
   * @param artifactRarity rarity of the artifact
   */
  function mint(address to, uint256 tokenId, uint8 artifactIndex, uint8 artifactRarity) public onlyDFCanMint(tokenId) {
    _safeMint(to, tokenId);
    artifacts[tokenId] = Artifact({ index: artifactIndex, rarity: artifactRarity });
    emit Minted(to, tokenId);
  }

  /**
   * Deposit function for depositing Artifact NFTs from player's wallet to df world
   * Only DF artifact portal system can deposit player's NFTs to df world.
   * Players don't need to approve NFTs to the portal system contract.
   * @param to df world address
   * @param tokenId tokenId of the deposited NFT
   * @param from player's address
   */
  function depositFrom(address to, uint256 tokenId, address from) public onlyDFCanDeposit(to) {
    // df world not implements {IERC721Receiver-onERC721Received}
    _transfer(from, to, tokenId);
  }

  function setDF(uint8 round, address world) public onlyOwner {
    if (dfs[round] != address(0)) {
      isDF[dfs[round]] = false;
    }
    dfs[round] = world;
    isDF[world] = true;
    emit DFUpdated(round, world);
  }

  function getArtifact(uint256 tokenId) public view returns (uint8 index, uint8 rarity) {
    Artifact storage artifact = artifacts[tokenId];
    return (artifact.index, artifact.rarity);
  }

  function isApprovedForAll(
    address owner,
    address operator
  ) public view virtual override(ERC721, IERC721) returns (bool) {
    return super.isApprovedForAll(owner, operator) || (isDF[owner] && _getDFArtifactSystemAddress(owner) == operator);
  }

  function _getDFArtifactSystemAddress(address world) internal view returns (address) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = ResourceId.unwrap(
      WorldResourceIdLib.encode({ typeId: RESOURCE_SYSTEM, namespace: DF_NAMESPACE, name: ARTIFACT_PORTAL_SYSTEM_NAME })
    );
    bytes32 _blob = IStoreRead(world).getStaticField(Systems._tableId, _keyTuple, 0, Systems._fieldLayout);
    return (address(bytes20(_blob)));
  }
}
