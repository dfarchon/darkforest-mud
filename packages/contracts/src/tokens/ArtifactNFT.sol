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
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title ArtifactNFT
 * @dev A contract for managing Artifact NFTs
 * @notice This contract is a temporary solution for managing Artifact NFTs.
 * It's possible to make it a mud system.
 */
contract ArtifactNFT is Ownable, ERC721Enumerable, IArtifactNFT {
  modifier exists(uint256 tokenId) {
    require(_ownerOf(tokenId) != address(0), "invalid tokenId");
    _;
  }

  bytes14 constant DF_NAMESPACE = "df";
  bytes16 constant ARTIFACT_PORTAL_SYSTEM_NAME = "ArtifactPortalSy";

  struct Artifact {
    uint8 index;
    uint8 rarity;
    uint8 biome;
  }

  mapping(uint8 round => address world) public dfs;
  mapping(address world => bool isDF) public isDF;
  mapping(uint256 tokenId => Artifact artifact) public artifacts;
  mapping(uint8 => string) artifactTypeNames;
  mapping(uint8 => string) artifactRarityNames;
  mapping(uint8 => string) biomeNames;

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
  function mint(
    address to,
    uint256 tokenId,
    uint8 artifactIndex,
    uint8 artifactRarity,
    uint8 biome
  ) public onlyDFCanMint(tokenId) {
    _safeMint(to, tokenId);
    artifacts[tokenId] = Artifact({ index: artifactIndex, rarity: artifactRarity, biome: biome });
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

  function getArtifact(uint256 tokenId) public view returns (uint8 index, uint8 rarity, uint8 biome) {
    Artifact storage artifact = artifacts[tokenId];
    return (artifact.index, artifact.rarity, artifact.biome);
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

  function setArtifactTypeNames(uint8 index, string memory name) public onlyOwner {
    artifactTypeNames[index] = name;
  }

  function setArtifactRarityNames(uint8 rarity, string memory name) public onlyOwner {
    artifactRarityNames[rarity] = name;
  }

  function setBiomeNames(uint8 biome, string memory name) public onlyOwner {
    biomeNames[biome] = name;
  }

  function bulkSetArtifactTypeNames(uint8[] memory indices, string[] memory names) public onlyOwner {
    for (uint8 i = 0; i < indices.length; i++) {
      artifactTypeNames[indices[i]] = names[i];
    }
  }

  function bulkSetArtifactRarityNames(uint8[] memory rarities, string[] memory names) public onlyOwner {
    for (uint8 i = 0; i < rarities.length; i++) {
      artifactRarityNames[rarities[i]] = names[i];
    }
  }

  function bulkSetBiomeNames(uint8[] memory biomes, string[] memory names) public onlyOwner {
    for (uint8 i = 0; i < biomes.length; i++) {
      biomeNames[biomes[i]] = names[i];
    }
  }

  function tokenURI(uint256 tokenId) public view override exists(tokenId) returns (string memory) {
    (uint8 index, uint8 rarity, uint8 biome) = getArtifact(tokenId);

    string memory artifactType = artifactTypeNames[index];
    string memory artifactRarity = artifactRarityNames[rarity];
    string memory biomeName = biomeNames[biome];

    string[17] memory parts;

    parts[
      0
    ] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350"><style>.base { fill: white; font-family: serif; font-size: 14px; }</style><rect width="100%" height="100%" fill="black" /><text x="10" y="20" class="base">';

    parts[1] = "Dark Forest Punk";

    parts[2] = '</text><text x="10" y="40" class="base">';

    parts[3] = "Dark Forest community rounds";

    parts[4] = '</text><text x="10" y="60" class="base">';

    parts[5] = "built on zkSNARKs &amp; MUD engine";

    parts[6] = '</text><text x="10" y="80" class="base">';

    parts[7] = "Onchain Reality Universe";

    parts[8] = '</text><text x="10" y="100" class="base">';

    parts[9] = string(abi.encodePacked("Artifact #", Strings.toHexString(tokenId)));

    parts[10] = '</text><text x="10" y="120" class="base">';

    parts[11] = artifactType;

    parts[12] = '</text><text x="10" y="140" class="base">';

    parts[13] = artifactRarity;

    parts[14] = '</text><text x="10" y="160" class="base">';

    parts[15] = biomeName;

    parts[16] = "</text></svg>";

    string memory output = string(
      abi.encodePacked(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6], parts[7], parts[8])
    );
    output = string(
      abi.encodePacked(output, parts[9], parts[10], parts[11], parts[12], parts[13], parts[14], parts[15], parts[16])
    );

    string memory json = Base64.encode(
      bytes(
        string(
          abi.encodePacked(
            '{"name": "Artifact #',
            Strings.toHexString(tokenId),
            '", "description": "The artifacts are gifts from Dark Forest Punk universe.", "image": "data:image/svg+xml;base64,',
            Base64.encode(bytes(output)),
            '"}'
          )
        )
      )
    );
    output = string(abi.encodePacked("data:application/json;base64,", json));

    return output;
  }
}
