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
import { SpaceshipConfig, SpaceshipConfigData } from "codegen/tables/SpaceshipConfig.sol";
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
    SpaceshipConfigData memory config = SpaceshipConfig.get(spaceshipType);
    CraftedSpaceship.set(
      spaceshipType,
      biome,
      rarity,
      CraftedSpaceshipData({
        attackBonus: _calculateAttackBonus(config.baseAttack, biome, rarity),
        defenseBonus: _calculateDefenseBonus(config.baseDefense, biome, rarity),
        speedBonus: _calculateSpeedBonus(config.baseSpeed, biome, rarity),
        rangeBonus: _calculateRangeBonus(config.baseRange, biome, rarity),
        crafter: executor,
        craftedAt: uint64(block.timestamp),
        nftTokenId: 0 // Will be set after NFT minting
      })
    );

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

  function _calculateAttackBonus(uint16 baseAttack, Biome biome, ArtifactRarity rarity) internal pure returns (uint16) {
    uint16 biomeBonus = _getBiomeAttackBonus(biome);
    uint16 rarityMultiplier = _getRarityMultiplier(rarity);
    return baseAttack + ((biomeBonus * rarityMultiplier) / 100);
  }

  function _calculateDefenseBonus(
    uint16 baseDefense,
    Biome biome,
    ArtifactRarity rarity
  ) internal pure returns (uint16) {
    uint16 biomeBonus = _getBiomeDefenseBonus(biome);
    uint16 rarityMultiplier = _getRarityMultiplier(rarity);
    return baseDefense + ((biomeBonus * rarityMultiplier) / 100);
  }

  function _calculateSpeedBonus(uint16 baseSpeed, Biome biome, ArtifactRarity rarity) internal pure returns (uint16) {
    uint16 biomeBonus = _getBiomeSpeedBonus(biome);
    uint16 rarityMultiplier = _getRarityMultiplier(rarity);
    return baseSpeed + ((biomeBonus * rarityMultiplier) / 100);
  }

  function _calculateRangeBonus(uint16 baseRange, Biome biome, ArtifactRarity rarity) internal pure returns (uint16) {
    uint16 biomeBonus = _getBiomeRangeBonus(biome);
    uint16 rarityMultiplier = _getRarityMultiplier(rarity);
    return baseRange + ((biomeBonus * rarityMultiplier) / 100);
  }

  function _getRarityMultiplier(ArtifactRarity rarity) internal pure returns (uint16) {
    if (rarity == ArtifactRarity.COMMON) return 100;
    if (rarity == ArtifactRarity.RARE) return 120;
    if (rarity == ArtifactRarity.EPIC) return 150;
    if (rarity == ArtifactRarity.LEGENDARY) return 200;
    if (rarity == ArtifactRarity.MYTHIC) return 300;
    return 100;
  }

  function _getBiomeAttackBonus(Biome biome) internal pure returns (uint16) {
    if (biome == Biome.TUNDRA) return 20;
    if (biome == Biome.DESERT) return 20;
    if (biome == Biome.WASTELAND) return 15;
    if (biome == Biome.LAVA) return 30;
    if (biome == Biome.CORRUPTED) return 25;
    return 0;
  }

  function _getBiomeDefenseBonus(Biome biome) internal pure returns (uint16) {
    if (biome == Biome.FOREST) return 15;
    if (biome == Biome.SWAMP) return 15;
    if (biome == Biome.ICE) return 25;
    if (biome == Biome.WASTELAND) return 15;
    if (biome == Biome.CORRUPTED) return 25;
    return 0;
  }

  function _getBiomeSpeedBonus(Biome biome) internal pure returns (uint16) {
    if (biome == Biome.OCEAN) return 20;
    if (biome == Biome.GRASSLAND) return 25;
    if (biome == Biome.CORRUPTED) return 25;
    return 0;
  }

  function _getBiomeRangeBonus(Biome biome) internal pure returns (uint16) {
    if (biome == Biome.OCEAN) return 10;
    if (biome == Biome.FOREST) return 5;
    if (biome == Biome.GRASSLAND) return 15;
    if (biome == Biome.TUNDRA) return 5;
    if (biome == Biome.SWAMP) return 10;
    if (biome == Biome.DESERT) return 10;
    if (biome == Biome.ICE) return 5;
    if (biome == Biome.WASTELAND) return 10;
    if (biome == Biome.LAVA) return 5;
    if (biome == Biome.CORRUPTED) return 15;
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
