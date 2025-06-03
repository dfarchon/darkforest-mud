// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Planet } from "libraries/Planet.sol";
import { Artifact } from "libraries/Artifact.sol";
import { ArtifactNFT } from "codegen/tables/ArtifactNFT.sol";
import { Artifact as ArtifactTable } from "codegen/tables/Artifact.sol";
import { ArtifactOwner } from "codegen/tables/ArtifactOwner.sol";
import { ArtifactWithdrawal } from "codegen/tables/ArtifactWithdrawal.sol";
import { DFUtils } from "libraries/DFUtils.sol";
import { PlanetType, ArtifactStatus } from "codegen/common.sol";
import { IArtifactNFT } from "tokens/IArtifactNFT.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { ArtifactLib } from "libraries/Artifact.sol";

contract ArtifactPortalSystem is BaseSystem {
  function withdrawArtifact(uint256 planetHash, uint256 artifactId) public {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    if (planet.planetType != PlanetType.SPACETIME_RIP) {
      revert InvalidPlanetType();
    }
    Artifact memory artifact = planet.mustGetArtifact(artifactId);
    if (planet.owner != _msgSender()) {
      revert NotPlanetOwner();
    }
    if (artifact.status != ArtifactStatus.DEFAULT) {
      revert ArtifactInUse();
    }
    if (uint8(artifact.rarity) >= planet.level) {
      revert ArtifactRarityTooHigh();
    }
    if (ArtifactWithdrawal.getDisabled()) revert ArtifactWithdrawalDisabled();
    planet.removeArtifact(artifactId);

    planet.writeToStore();
    ArtifactOwner.deleteRecord(uint32(artifactId));
    ArtifactTable.deleteRecord(uint32(artifactId));
    IArtifactNFT nft = IArtifactNFT(ArtifactNFT.get());
    (bool success, bytes memory data) = address(nft).call(abi.encodeWithSelector(IERC721.ownerOf.selector, artifactId));
    if (!success) {
      // PUNK: add artifact biome later
      nft.mint(planet.owner, artifactId, uint8(artifact.artifactIndex), uint8(artifact.rarity), uint8(artifact.biome));
    } else {
      address owner = abi.decode(data, (address));
      if (owner != worldAddress) {
        revert ArtifactOutOfControl();
      }
      nft.transferFrom(worldAddress, planet.owner, artifactId);
    }
  }

  function depositArtifact(uint256 planetHash, uint256 artifactId) public {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    if (planet.planetType != PlanetType.SPACETIME_RIP) {
      revert InvalidPlanetType();
    }
    if (planet.owner != _msgSender()) {
      revert NotPlanetOwner();
    }
    IArtifactNFT nft = IArtifactNFT(ArtifactNFT.get());
    (uint8 index, uint8 rarity, uint8 biome) = nft.getArtifact(artifactId);
    if (uint8(rarity) >= planet.level) {
      revert ArtifactRarityTooHigh();
    }
    Artifact memory artifact = ArtifactLib.NewArtifactFromNFT(artifactId, planetHash, index, rarity, biome);
    if (planet.hasArtifactSlot()) {
      planet.pushArtifact(artifact.id);
    } else {
      revert ArtifactStorageFull();
    }

    nft.depositFrom(worldAddress, artifactId, _msgSender());
    artifact.writeToStore();
    planet.writeToStore();
  }
}
