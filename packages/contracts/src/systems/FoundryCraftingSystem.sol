// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Planet } from "libraries/Planet.sol";
import { Artifact, ArtifactLib } from "libraries/Artifact.sol";
import { Counter } from "codegen/tables/Counter.sol";
import { DFUtils } from "libraries/DFUtils.sol";
import { GlobalStats } from "codegen/tables/GlobalStats.sol";
import { PlayerStats } from "codegen/tables/PlayerStats.sol";
import { CraftedSpaceship, CraftedSpaceshipData } from "codegen/tables/CraftedSpaceship.sol";
import { SpaceshipBonus, SpaceshipBonusData } from "codegen/tables/SpaceshipBonus.sol";
import { FoundryCraftingCount, FoundryCraftingCountData } from "codegen/tables/FoundryCraftingCount.sol";
import { PlanetType, MaterialType, Biome, ArtifactRarity } from "codegen/common.sol";
import { IArtifactNFT } from "tokens/IArtifactNFT.sol";
import { Errors } from "interfaces/errors.sol";

contract FoundryCraftingSystem is BaseSystem {
  // ArtifactNFT will be accessed through the world contract
  // No constructor needed - follows the same pattern as other systems

  function craftSpaceship(
    uint256 foundryHash,
    uint8 spaceshipType,
    MaterialType[] memory materials,
    uint256[] memory amounts,
    Biome biome
  ) public entryFee requireSameOwnerAndJunkOwner(foundryHash) {
    _updateStats();
    _processSpaceshipCrafting(foundryHash, spaceshipType, materials, amounts, biome);
  }

  function _updateStats() internal {
    GlobalStats.setCraftSpaceshipCount(GlobalStats.getCraftSpaceshipCount() + 1);
    PlayerStats.setCraftSpaceshipCount(_msgSender(), PlayerStats.getCraftSpaceshipCount(_msgSender()) + 1);
  }

  function _processSpaceshipCrafting(
    uint256 foundryHash,
    uint8 spaceshipType,
    MaterialType[] memory materials,
    uint256[] memory amounts,
    Biome biome
  ) internal {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory foundry = DFUtils.readInitedPlanet(worldAddress, foundryHash);
    address executor = _msgSender();

    _validateCrafting(foundry, executor, spaceshipType, materials, amounts);
    _executeCrafting(foundry, executor, spaceshipType, materials, amounts, biome);
  }

  function _validateCrafting(
    Planet memory foundry,
    address executor,
    uint8 spaceshipType,
    MaterialType[] memory materials,
    uint256[] memory amounts
  ) internal view {
    if (foundry.owner != executor) revert Errors.NotPlanetOwner();
    if (foundry.planetType != PlanetType.FOUNDRY) revert Errors.InvalidPlanetType();
    if (foundry.level < 4) revert Errors.PlanetLevelTooLow();

    // Check crafting limit (max 3 crafts per foundry)
    FoundryCraftingCountData memory craftingData = FoundryCraftingCount.get(bytes32(foundry.planetHash));
    if (craftingData.count >= 3) revert Errors.FoundryCraftingLimitReached();

    // Validate materials and amounts with crafting multiplier
    uint256 craftingMultiplier = _getCraftingMultiplier(craftingData.count);
    for (uint256 i = 0; i < materials.length; i++) {
      uint256 currentAmount = foundry.getMaterial(materials[i]);
      uint256 requiredAmount = (amounts[i] * craftingMultiplier) / 100; // amounts already include multiplier
      if (currentAmount < requiredAmount) revert Errors.InsufficientMaterialOnPlanet();
    }
  }

  function _executeCrafting(
    Planet memory foundry,
    address executor,
    uint8 spaceshipType,
    MaterialType[] memory materials,
    uint256[] memory amounts,
    Biome biome
  ) internal {
    // Get current crafting count and calculate multiplier
    FoundryCraftingCountData memory craftingData = FoundryCraftingCount.get(bytes32(foundry.planetHash));
    uint256 craftingMultiplier = _getCraftingMultiplier(craftingData.count);

    // Consume materials with multiplier applied
    for (uint256 i = 0; i < materials.length; i++) {
      uint256 currentAmount = foundry.getMaterial(materials[i]);
      uint256 requiredAmount = (amounts[i] * craftingMultiplier) / 100;
      foundry.setMaterial(materials[i], currentAmount - requiredAmount);
    }

    // Calculate rarity based on planet level (same as NewArtifact)
    ArtifactRarity rarity = _calculateSpaceshipRarity(
      foundry.level,
      uint256(keccak256(abi.encodePacked(block.timestamp, executor, foundry.planetHash)))
    );

    // Create spaceship artifact
    Artifact memory spaceshipArtifact = ArtifactLib.NewSpaceshipArtifact(
      uint256(keccak256(abi.encodePacked(block.timestamp, executor, foundry.planetHash))),
      foundry.planetHash,
      spaceshipType,
      biome,
      rarity
    );

    // Calculate bonuses and store spaceship data

    uint32 artifactId = uint32(spaceshipArtifact.id);
    // todo find how to use CraftedSpaceship.set instead step by step setSpaceShip setBiome setRarity setCraftedAt setNftTokenId setCrafter etc
    //  CraftedSpaceship.set(artifactId, spaceshipType, biome, rarity, uint64(block.timestamp), 0, executor);
    CraftedSpaceship.setSpaceshipType(artifactId, spaceshipType);
    CraftedSpaceship.setBiome(artifactId, biome);
    CraftedSpaceship.setRarity(artifactId, rarity);
    CraftedSpaceship.setCraftedAt(artifactId, uint64(block.timestamp));
    CraftedSpaceship.setNftTokenId(artifactId, 0); // Will be set after NFT minting
    CraftedSpaceship.setCrafter(artifactId, executor);
    // todo find how to use SpaceshipBonus.set instead step by step setAttackBonus setDefenseBonus setSpeedBonus setRangeBonus etc
    //    SpaceshipBonus.set(artifactId, _calculateAttackBonus(config.baseAttack, biome, rarity), _calculateDefenseBonus(config.baseDefense, biome, rarity), _calculateSpeedBonus(config.baseSpeed, biome, rarity), _calculateRangeBonus(config.baseRange, biome, rarity));
    SpaceshipBonus.setAttackBonus(artifactId, _calculateAttackBonus(biome, rarity, spaceshipType));
    SpaceshipBonus.setDefenseBonus(artifactId, _calculateDefenseBonus(biome, rarity, spaceshipType));
    SpaceshipBonus.setSpeedBonus(artifactId, _calculateSpeedBonus(biome, rarity, spaceshipType));
    SpaceshipBonus.setRangeBonus(artifactId, _calculateRangeBonus(biome, rarity, spaceshipType));

    // TODO: Mint ArtifactNFT and update spaceship data
    // For now, we'll skip NFT minting to avoid deployment issues
    // uint256 tokenId = _mintSpaceshipNFT(executor, spaceshipArtifact.id, spaceshipType, biome, rarity);
    // CraftedSpaceship.setNftTokenId(spaceshipType, biome, rarity, tokenId);

    // Store artifact and add to planet
    spaceshipArtifact.writeToStore();
    foundry.pushArtifact(spaceshipArtifact.id);
    foundry.writeToStore();

    // Increment crafting count for this foundry
    FoundryCraftingCount.set(
      bytes32(foundry.planetHash),
      FoundryCraftingCountData({ count: craftingData.count + 1, lastCraftTime: uint64(block.timestamp) })
    );

    // Update counter
    Counter.setArtifact(uint24(spaceshipArtifact.id));
  }

  // TODO: Re-enable NFT minting once ArtifactNFT is properly deployed
  function _mintSpaceshipNFT(
    address to,
    uint256 spaceshipId,
    uint8 spaceshipType,
    Biome biome,
    ArtifactRarity rarity
  ) internal returns (uint256) {
    uint256 tokenId = _generateSpaceshipTokenId(spaceshipId, spaceshipType);

    // TODO: Get ArtifactNFT from world contract and mint
    // artifactNFT.mint(
    //     to,
    //     tokenId,
    //     3, // artifactType = Spaceship (original Dark Forest ID)
    //     uint8(rarity),
    //     uint8(biome)
    // );

    return tokenId;
  }

  function _generateSpaceshipTokenId(uint256 spaceshipId, uint8 spaceshipType) internal view returns (uint256) {
    // Format: [Round(8 bits)][SpaceshipType(8 bits)][UniqueID(16 bits)][Timestamp(32 bits)]
    uint256 round = uint256(keccak256(abi.encodePacked(block.timestamp))) % 256;
    uint256 timestamp = block.timestamp;

    return (round << 248) | (uint256(spaceshipType) << 240) | (spaceshipId << 224) | timestamp;
  }

  function _calculateSpaceshipRarity(uint256 planetLevel, uint256 seed) internal pure returns (ArtifactRarity) {
    // Use the same rarity calculation as NewArtifact._initRarity
    uint256 lvlBonusSeed = seed & 0xfff000;
    if (lvlBonusSeed < 0x40000) {
      // possibility 1/64
      planetLevel += 2;
    } else if (lvlBonusSeed < 0x100000) {
      // possibility 1/16
      planetLevel += 1;
    }

    if (planetLevel <= 1) {
      return ArtifactRarity.COMMON;
    } else if (planetLevel <= 3) {
      return ArtifactRarity.RARE;
    } else if (planetLevel <= 5) {
      return ArtifactRarity.EPIC;
    } else if (planetLevel <= 7) {
      return ArtifactRarity.LEGENDARY;
    } else {
      return ArtifactRarity.MYTHIC;
    }
  }

  function _calculateAttackBonus(
    Biome biome,
    ArtifactRarity rarity,
    uint8 spaceshipType
  ) internal pure returns (uint16) {
    uint16 biomeBonus = _getBiomeBonus(biome);
    uint16 roleBonus = _getSpaceshipRoleAttackBonus(spaceshipType);
    uint16 rarityMultiplier = _getRarityMultiplier(rarity);

    // If role bonus is 0, then no biome bonus is added
    if (roleBonus == 0) {
      return 0;
    }

    uint16 totalBonus = biomeBonus + roleBonus;
    return ((totalBonus * rarityMultiplier) / 100);
  }

  function _calculateDefenseBonus(
    Biome biome,
    ArtifactRarity rarity,
    uint8 spaceshipType
  ) internal pure returns (uint16) {
    uint16 biomeBonus = _getBiomeBonus(biome);
    uint16 roleBonus = _getSpaceshipRoleDefenseBonus(spaceshipType);
    uint16 rarityMultiplier = _getRarityMultiplier(rarity);

    // If role bonus is 0, then no biome bonus is added
    if (roleBonus == 0) {
      return 0;
    }

    uint16 totalBonus = biomeBonus + roleBonus;
    return ((totalBonus * rarityMultiplier) / 100);
  }

  function _calculateSpeedBonus(
    Biome biome,
    ArtifactRarity rarity,
    uint8 spaceshipType
  ) internal pure returns (uint16) {
    uint16 biomeBonus = _getBiomeBonus(biome);
    uint16 roleBonus = _getSpaceshipRoleSpeedBonus(spaceshipType);
    uint16 rarityMultiplier = _getRarityMultiplier(rarity);

    // If role bonus is 0, then no biome bonus is added
    if (roleBonus == 0) {
      return 0;
    }

    uint16 totalBonus = biomeBonus + roleBonus;
    return ((totalBonus * rarityMultiplier) / 100);
  }

  function _calculateRangeBonus(
    Biome biome,
    ArtifactRarity rarity,
    uint8 spaceshipType
  ) internal pure returns (uint16) {
    uint16 biomeBonus = _getBiomeBonus(biome);
    uint16 roleBonus = _getSpaceshipRoleRangeBonus(spaceshipType);
    uint16 rarityMultiplier = _getRarityMultiplier(rarity);

    // If role bonus is 0, then no biome bonus is added
    if (roleBonus == 0) {
      return 0;
    }

    uint16 totalBonus = biomeBonus + roleBonus;
    return ((totalBonus * rarityMultiplier) / 100);
  }

  function _getRarityMultiplier(ArtifactRarity rarity) internal pure returns (uint16) {
    if (rarity == ArtifactRarity.COMMON) return 100;
    if (rarity == ArtifactRarity.RARE) return 120;
    if (rarity == ArtifactRarity.EPIC) return 150;
    if (rarity == ArtifactRarity.LEGENDARY) return 200;
    if (rarity == ArtifactRarity.MYTHIC) return 300;
    return 100;
  }

  function _getBiomeBonus(Biome biome) internal pure returns (uint16) {
    uint16 b = uint16(biome);
    if (b >= 1 && b <= 3) {
      return 1;
    } else if (b >= 4 && b <= 6) {
      return 2;
    } else if (b >= 7 && b <= 9) {
      return 4;
    } else if (b == 10) {
      return 8;
    }
    return 0;
  }

  // Spaceship role-specific bonus functions
  function _getSpaceshipRoleAttackBonus(uint8 spaceshipType) internal pure returns (uint16) {
    // Scout: 0, Fighter: 5, Destroyer: 10, Carrier: 5
    if (spaceshipType == 1) return 0; // Scout - no attack bonus
    if (spaceshipType == 2) return 5; // Fighter
    if (spaceshipType == 3) return 10; // Destroyer
    if (spaceshipType == 4) return 5; // Carrier
    return 0;
  }

  function _getSpaceshipRoleDefenseBonus(uint8 spaceshipType) internal pure returns (uint16) {
    // Scout: 0, Fighter: 5, Destroyer: 10, Carrier: 15
    if (spaceshipType == 1) return 0; // Scout
    if (spaceshipType == 2) return 5; // Fighter
    if (spaceshipType == 3) return 10; // Destroyer
    if (spaceshipType == 4) return 15; // Carrier
    return 0;
  }

  function _getSpaceshipRoleSpeedBonus(uint8 spaceshipType) internal pure returns (uint16) {
    // Scout: 10, Fighter: 0, Destroyer: 0, Carrier: 0
    if (spaceshipType == 1) return 10; // Scout
    if (spaceshipType == 2) return 0; // Fighter
    if (spaceshipType == 3) return 0; // Destroyer
    if (spaceshipType == 4) return 0; // Carrier
    return 0;
  }

  function _getSpaceshipRoleRangeBonus(uint8 spaceshipType) internal pure returns (uint16) {
    // Scout: 5, Fighter: 5, Destroyer: 0, Carrier: 3
    if (spaceshipType == 1) return 5; // Scout
    if (spaceshipType == 2) return 5; // Fighter
    if (spaceshipType == 3) return 0; // Destroyer - no range bonus
    if (spaceshipType == 4) return 3; // Carrier
    return 0;
  }

  function _getCraftingMultiplier(uint8 craftingCount) internal pure returns (uint256) {
    // 1st craft: 100% (1.0x), 2nd craft: 150% (1.5x), 3rd craft: 225% (2.25x)
    if (craftingCount == 0) return 100;
    if (craftingCount == 1) return 150;
    if (craftingCount == 2) return 225;
    return 100; // Should never reach here due to limit check
  }

  // Public function to get crafting count for a foundry
  function getFoundryCraftingCount(uint256 foundryHash) public view returns (uint8 count, uint64 lastCraftTime) {
    FoundryCraftingCountData memory data = FoundryCraftingCount.get(bytes32(foundryHash));
    return (data.count, data.lastCraftTime);
  }

  // Public function to get crafting multiplier for a foundry
  function getCraftingMultiplier(uint256 foundryHash) public view returns (uint256 multiplier) {
    FoundryCraftingCountData memory data = FoundryCraftingCount.get(bytes32(foundryHash));
    return _getCraftingMultiplier(data.count);
  }
}
