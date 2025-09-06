// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Planet } from "libraries/Planet.sol";
import { PlanetType, MaterialType, Biome } from "codegen/common.sol";
import { PlayerWithdrawMaterial } from "codegen/tables/PlayerWithdrawMaterial.sol";
import { PlayerWithdrawSilver } from "codegen/tables/PlayerWithdrawSilver.sol";
import { DFUtils } from "libraries/DFUtils.sol";
import { GuildUtils } from "libraries/GuildUtils.sol";
import { Guild } from "codegen/tables/Guild.sol";
import { GlobalStats } from "codegen/tables/GlobalStats.sol";
import { PlayerStats } from "codegen/tables/PlayerStats.sol";
import { Errors } from "interfaces/errors.sol";

contract WithdrawMaterialSystem is BaseSystem {
  /**
   * @notice Withdraw material on Spacetime RIP with biome-based scoring.
   * @param planetHash Planet hash
   * @param materialType Material type to withdraw
   * @param materialToWithdraw Material amount to withdraw
   */
  function withdrawMaterial(
    uint256 planetHash,
    MaterialType materialType,
    uint256 materialToWithdraw
  ) public entryFee requireSameOwnerAndJunkOwner(planetHash) {
    _updateStats();
    _processWithdrawal(planetHash, materialType, materialToWithdraw);
  }

  function _updateStats() internal {
    GlobalStats.setWithdrawMaterialCount(GlobalStats.getWithdrawMaterialCount() + 1);
    PlayerStats.setWithdrawMaterialCount(_msgSender(), PlayerStats.getWithdrawMaterialCount(_msgSender()) + 1);
  }

  function _processWithdrawal(uint256 planetHash, MaterialType materialType, uint256 materialToWithdraw) internal {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    address executor = _msgSender();

    _validateWithdrawal(planet, executor, materialType, materialToWithdraw);
    _executeWithdrawal(planet, executor, materialType, materialToWithdraw);
  }

  function _validateWithdrawal(
    Planet memory planet,
    address executor,
    MaterialType materialType,
    uint256 materialToWithdraw
  ) internal view {
    if (planet.owner != executor) revert Errors.NotPlanetOwner();
    if (planet.planetType != PlanetType.SPACETIME_RIP) revert Errors.InvalidPlanetType();

    uint256 currentMaterial = planet.getMaterial(materialType);
    if (currentMaterial < materialToWithdraw) revert Errors.InsufficientMaterialOnPlanet();

    uint256 materialCap = planet.getMaterialCap(materialType);
    if (materialCap > materialToWithdraw * 5) revert Errors.WithdrawAmountTooLow();
  }

  function _executeWithdrawal(
    Planet memory planet,
    address executor,
    MaterialType materialType,
    uint256 materialToWithdraw
  ) internal {
    uint256 currentMaterial = planet.getMaterial(materialType);
    uint256 playerWithdrawMaterialAmount = PlayerWithdrawMaterial.get(executor, uint8(materialType));

    // Calculate biome-based score multiplier
    uint256 scoreMultiplier = getBiomeScoreMultiplier(materialType);
    uint256 scorePoints = (materialToWithdraw * scoreMultiplier) / 1e9;

    // Remove material from planet
    planet.setMaterial(materialType, currentMaterial - materialToWithdraw);

    // Add to player's withdrawn material amount
    playerWithdrawMaterialAmount += materialToWithdraw;

    // Add score points to player's silver (which is used as the score)
    uint256 currentPlayerSilver = PlayerWithdrawSilver.get(executor);
    PlayerWithdrawSilver.set(executor, currentPlayerSilver + scorePoints);

    // Add score points to guild if player is in a guild
    uint8 guildId = GuildUtils.getCurrentGuildId(executor);
    if (guildId != 0) {
      uint256 currentGuildSilver = Guild.getSilver(guildId);
      Guild.setSilver(guildId, currentGuildSilver + scorePoints);
    }

    planet.writeToStore();
    PlayerWithdrawMaterial.set(executor, uint8(materialType), playerWithdrawMaterialAmount);
  }

  /**
   * @notice Get material-specific score multiplier for material withdrawal
   * @param materialType The material being withdrawn
   * @return multiplier The score multiplier
   */
  function getBiomeScoreMultiplier(MaterialType materialType) internal pure returns (uint256 multiplier) {
    // Base multiplier starts at 1
    multiplier = 1;

    // Apply material-specific bonuses based on actual MaterialType enum
    if (materialType == MaterialType.CORRUPTED_CRYSTAL) {
      multiplier = 6; // 6x for corrupted crystals (highest value)
    } else if (materialType == MaterialType.BLACKALLOY) {
      multiplier = 4; // 4x for blackalloy
    } else if (materialType == MaterialType.PYROSTEEL) {
      multiplier = 3; // 3x for pyrosteel
    } else if (materialType == MaterialType.SCRAPIUM) {
      multiplier = 25; // 2.5x for scrapium (will be divided by 10)
    } else if (materialType == MaterialType.CRYOSTONE) {
      multiplier = 2; // 2x for cryostone
    } else if (materialType == MaterialType.SANDGLASS) {
      multiplier = 18; // 1.8x for sandglass (will be divided by 10)
    } else if (materialType == MaterialType.MYCELIUM) {
      multiplier = 15; // 1.5x for mycelium (will be divided by 10)
    } else if (materialType == MaterialType.AURORIUM) {
      multiplier = 13; // 1.3x for aurorium (will be divided by 10)
    } else if (materialType == MaterialType.WINDSTEEL) {
      multiplier = 12; // 1.2x for windsteel (will be divided by 10)
    } else if (materialType == MaterialType.LIVING_WOOD) {
      multiplier = 11; // 1.1x for living wood (will be divided by 10)
    } else if (materialType == MaterialType.WATER_CRYSTALS) {
      multiplier = 105; // 1.05x for water crystals (will be divided by 100)
    } else if (materialType == MaterialType.UNKNOWN) {
      multiplier = 1; // 1x for unknown materials
    } else {
      multiplier = 1; // Default multiplier for any other materials
    }

    // Handle decimal multipliers
    if (multiplier >= 100) {
      multiplier = multiplier / 100;
    } else if (multiplier >= 10) {
      multiplier = multiplier / 10;
    }
  }
}
