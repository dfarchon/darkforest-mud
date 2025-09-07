// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Planet } from "libraries/Planet.sol";
import { DFUtils } from "libraries/DFUtils.sol";
import { MaterialType, PlanetType } from "codegen/common.sol";
import { MaterialUpgradeConfig } from "codegen/tables/MaterialUpgradeConfig.sol";
import { Errors } from "interfaces/errors.sol";

contract MaterialUpgradeSystem is BaseSystem {
  function upgradeWithMaterials(
    uint256 planetHash,
    uint256 rangeUpgrades,
    uint256 speedUpgrades,
    uint256 defenseUpgrades,
    MaterialType[] memory materials,
    uint256[] memory amounts
  ) public entryFee requireSameOwnerAndJunkOwner(planetHash) {
    _updateStats();
    _processMaterialUpgrade(planetHash, rangeUpgrades, speedUpgrades, defenseUpgrades, materials, amounts);
  }

  function _updateStats() internal {
    // Update global and player stats for material upgrades
    // Implementation depends on existing stats structure
  }

  function _processMaterialUpgrade(
    uint256 planetHash,
    uint256 rangeUpgrades,
    uint256 speedUpgrades,
    uint256 defenseUpgrades,
    MaterialType[] memory materials,
    uint256[] memory amounts
  ) internal {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    address executor = _msgSender();

    _validateUpgrade(planet, executor, rangeUpgrades, speedUpgrades, defenseUpgrades, materials, amounts);
    _executeUpgrade(planet, executor, rangeUpgrades, speedUpgrades, defenseUpgrades, materials, amounts);
  }

  function _validateUpgrade(
    Planet memory planet,
    address executor,
    uint256 rangeUpgrades,
    uint256 speedUpgrades,
    uint256 defenseUpgrades,
    MaterialType[] memory materials,
    uint256[] memory amounts
  ) internal view {
    if (planet.owner != executor) revert Errors.NotPlanetOwner();
    if (planet.planetType != PlanetType.PLANET) revert Errors.InvalidPlanetType();

    // Validate upgrade limits
    uint256 currentRange = planet.rangeUpgrades;
    uint256 currentSpeed = planet.speedUpgrades;
    uint256 currentDefense = planet.defenseUpgrades;

    // Note: Max upgrade limits would need to be defined in planet config or constants
    // For now, we'll use reasonable limits (e.g., 10 upgrades max per type)
    uint256 maxUpgrades = 10;
    if (currentRange + rangeUpgrades > maxUpgrades) revert Errors.UpgradeExceedsLimit();
    if (currentSpeed + speedUpgrades > maxUpgrades) revert Errors.UpgradeExceedsLimit();
    if (currentDefense + defenseUpgrades > maxUpgrades) revert Errors.UpgradeExceedsLimit();

    // Validate materials and amounts
    for (uint256 i = 0; i < materials.length; i++) {
      uint256 currentAmount = planet.getMaterial(materials[i]);
      if (currentAmount < amounts[i]) revert Errors.InsufficientMaterialOnPlanet();
    }
  }

  function _executeUpgrade(
    Planet memory planet,
    address executor,
    uint256 rangeUpgrades,
    uint256 speedUpgrades,
    uint256 defenseUpgrades,
    MaterialType[] memory materials,
    uint256[] memory amounts
  ) internal {
    // Consume materials
    for (uint256 i = 0; i < materials.length; i++) {
      uint256 currentAmount = planet.getMaterial(materials[i]);
      planet.setMaterial(materials[i], currentAmount - amounts[i]);
    }

    // Apply upgrades
    if (rangeUpgrades > 0) {
      planet.rangeUpgrades += rangeUpgrades;
    }

    if (speedUpgrades > 0) {
      planet.speedUpgrades += speedUpgrades;
    }

    if (defenseUpgrades > 0) {
      planet.defenseUpgrades += defenseUpgrades;
    }

    // Write updated planet to store
    planet.writeToStore();
  }

  function getMaterialCostForUpgrade(
    uint256 planetHash,
    uint256 upgradeType, // 0=range, 1=speed, 2=defense
    uint256 upgradeAmount
  ) public view returns (MaterialType[] memory materials, uint256[] memory amounts) {
    Planet memory planet = DFUtils.readInitedPlanet(_world(), planetHash);

    // Get base silver cost for upgrades
    uint256 silverCost = _calculateSilverCost(planet, upgradeType, upgradeAmount);

    // Convert silver cost to material requirements
    (materials, amounts) = _convertSilverToMaterials(silverCost, upgradeType);
  }

  function _calculateSilverCost(
    Planet memory planet,
    uint256 upgradeType,
    uint256 upgradeAmount
  ) internal view returns (uint256) {
    // This would integrate with existing upgrade cost calculation
    // For now, return a simplified calculation
    uint256 baseCost = planet.silverCap / 100; // 1% of silver cap per upgrade
    return baseCost * upgradeAmount;
  }

  function _convertSilverToMaterials(
    uint256 silverCost,
    uint256 upgradeType
  ) internal view returns (MaterialType[] memory materials, uint256[] memory amounts) {
    // Define material requirements based on upgrade type
    if (upgradeType == 0) {
      // Range upgrade
      materials = new MaterialType[](1);
      amounts = new uint256[](1);
      materials[0] = MaterialType.WINDSTEEL;
      amounts[0] = silverCost / 1000; // 1:1000 ratio with silver
    } else if (upgradeType == 1) {
      // Speed upgrade
      materials = new MaterialType[](1);
      amounts = new uint256[](1);
      materials[0] = MaterialType.AURORIUM;
      amounts[0] = silverCost / 1000;
    } else if (upgradeType == 2) {
      // Defense upgrade
      materials = new MaterialType[](1);
      amounts = new uint256[](1);
      materials[0] = MaterialType.PYROSTEEL;
      amounts[0] = silverCost / 1000;
    }
  }
}
