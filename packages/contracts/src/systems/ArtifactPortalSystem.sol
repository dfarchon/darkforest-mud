// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Errors } from "../interfaces/errors.sol";
import { Planet } from "../lib/Planet.sol";
import { Artifact } from "../lib/Artifact.sol";
import { ArtifactNFT } from "../codegen/tables/ArtifactNFT.sol";
import { Artifact as ArtifactTable } from "../codegen/tables/Artifact.sol";
import { ArtifactOwner } from "../codegen/tables/ArtifactOwner.sol";
import { DFUtils } from "../lib/DFUtils.sol";
import { PlanetType, ArtifactStatus } from "../codegen/common.sol";
import { IArtifactNFT } from "../tokens/IArtifactNFT.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { ArtifactLib } from "../lib/Artifact.sol";

contract ArtifactPortalSystem is System, Errors {
  function withdrawArtifact(uint256 planetHash, uint256 artifactId) public {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    if (planet.planetType != PlanetType.SPACETIME_RIP) {
      revert Errors.InvalidPlanetType();
    }
    Artifact memory artifact = planet.mustGetArtifact(artifactId);
    if (planet.owner != _msgSender()) {
      revert Errors.NotPlanetOwner();
    }
    if (artifact.status != ArtifactStatus.DEFAULT) {
      revert Errors.ArtifactInUse();
    }
    planet.removeArtifact(artifactId);

    planet.writeToStore();
    ArtifactOwner.deleteRecord(uint32(artifactId));
    ArtifactTable.deleteRecord(uint32(artifactId));
    IArtifactNFT nft = IArtifactNFT(ArtifactNFT.get());
    (bool success, bytes memory data) = address(nft).call(abi.encodeWithSelector(IERC721.ownerOf.selector, artifactId));
    if (!success) {
      nft.mint(planet.owner, artifactId, uint8(artifact.artifactIndex), uint8(artifact.rarity));
    } else {
      address owner = abi.decode(data, (address));
      if (owner != worldAddress) {
        revert Errors.ArtifactOutOfControl();
      }
      nft.transferFrom(worldAddress, planet.owner, artifactId);
    }
  }

  function depositArtifact(uint256 planetHash, uint256 artifactId) public {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    if (planet.planetType != PlanetType.SPACETIME_RIP) {
      revert Errors.InvalidPlanetType();
    }
    if (planet.owner != _msgSender()) {
      revert Errors.NotPlanetOwner();
    }
    IArtifactNFT nft = IArtifactNFT(ArtifactNFT.get());
    (uint8 index, uint8 rarity) = nft.getArtifact(artifactId);
    Artifact memory artifact = ArtifactLib.NewArtifactFromNFT(artifactId, planetHash, index, rarity);
    if (planet.hasArtifactSlot()) {
      planet.pushArtifact(artifact.id);
    } else {
      revert Errors.ArtifactStorageFull();
    }

    nft.transferFrom(_msgSender(), worldAddress, artifactId);
    artifact.writeToStore();
    planet.writeToStore();
  }
}
