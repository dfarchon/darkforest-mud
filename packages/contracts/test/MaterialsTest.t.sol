// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { PlanetType, SpaceType, MaterialType, Biome } from "../src/codegen/common.sol";
import { Planet } from "../src/lib/Planet.sol";
import { PlanetLib } from "../src/lib/Planet.sol";
import { PlanetMaterialStorage } from "../src/codegen/tables/PlanetMaterialStorage.sol";
import { PlanetMaterial } from "../src/codegen/tables/PlanetMaterial.sol";

contract MaterialsTest is Test {
  function testMaterialGrowthLogic() public {
    // Test the material growth logic directly without relying on world contract
    Planet memory planet;
    planet.planetHash = 1;
    planet.planetType = PlanetType.ASTEROID_FIELD;
    planet.level = 5;
    planet.spaceType = SpaceType.NEBULA;
    planet.perlin = 100;

    // Test growth calculation
    uint256 growthRate = PlanetLib.getMaterialGrowth(planet, MaterialType.WATER_CRYSTALS);
    uint256 expectedGrowthRate = planet.level * 1e16 * 2; // 5 * 1e16 * 2 = 1e17
    assertEq(growthRate, expectedGrowthRate);

    // Test material cap calculation
    uint256 materialCap = PlanetLib.getMaterialCap(planet, MaterialType.WATER_CRYSTALS);
    uint256 expectedCap = planet.level * 2000 * 1e18; // 5 * 2000 * 1e18 = 1e22
    assertEq(materialCap, expectedCap);
  }

  function testMaterialGrowthCalculation() public {
    // Test the material growth calculation for different planet levels
    Planet memory planet;
    planet.planetType = PlanetType.ASTEROID_FIELD;

    // Test level 1
    planet.level = 1;
    uint256 growthRate1 = PlanetLib.getMaterialGrowth(planet, MaterialType.WATER_CRYSTALS);
    assertEq(growthRate1, 2e16); // 1 * 1e16 * 2

    // Test level 3
    planet.level = 3;
    uint256 growthRate3 = PlanetLib.getMaterialGrowth(planet, MaterialType.WATER_CRYSTALS);
    assertEq(growthRate3, 6e16); // 3 * 1e16 * 2

    // Test level 5
    planet.level = 5;
    uint256 growthRate5 = PlanetLib.getMaterialGrowth(planet, MaterialType.WATER_CRYSTALS);
    assertEq(growthRate5, 1e17); // 5 * 1e16 * 2
  }

  function testMaterialCapCalculation() public {
    // Test the material cap calculation for different planet levels
    Planet memory planet;
    planet.planetType = PlanetType.ASTEROID_FIELD;

    // Test level 1 (should use level * 1000 * 1e18)
    planet.level = 1;
    uint256 cap1 = PlanetLib.getMaterialCap(planet, MaterialType.WATER_CRYSTALS);
    assertEq(cap1, 1000 * 1e18); // 1 * 1000 * 1e18

    // Test level 3 (should use level * 1000 * 1e18)
    planet.level = 3;
    uint256 cap3 = PlanetLib.getMaterialCap(planet, MaterialType.WATER_CRYSTALS);
    assertEq(cap3, 3000 * 1e18); // 3 * 1000 * 1e18

    // Test level 5 (should use level * 2000 * 1e18)
    planet.level = 5;
    uint256 cap5 = PlanetLib.getMaterialCap(planet, MaterialType.WATER_CRYSTALS);
    assertEq(cap5, 10000 * 1e18); // 5 * 2000 * 1e18

    // Test level 7 (should use level * 6000 * 1e18)
    planet.level = 7;
    uint256 cap7 = PlanetLib.getMaterialCap(planet, MaterialType.WATER_CRYSTALS);
    assertEq(cap7, 42000 * 1e18); // 7 * 6000 * 1e18
  }

  function testNonAsteroidFieldPlanet() public {
    // Test that non-ASTEROID_FIELD planets don't have material growth
    Planet memory planet;
    planet.planetType = PlanetType.PLANET;
    planet.level = 5;

    uint256 growthRate = PlanetLib.getMaterialGrowth(planet, MaterialType.WATER_CRYSTALS);
    assertEq(growthRate, 0); // Non-ASTEROID_FIELD planets should have 0 growth
  }

  function testMaterialStorageOperations() public {
    // Test material storage operations
    Planet memory planet;
    planet.planetHash = 1;

    // Initialize material storage arrays
    uint256 materialCount = uint8(type(MaterialType).max) + 1;
    planet.materialStorage.exists = new bool[](materialCount);
    planet.materialStorage.updates = new bool[](materialCount);
    planet.materialStorage.amount = new uint256[](materialCount);

    // Test setting and getting materials
    planet.materialStorage.setMaterial(planet.planetHash, MaterialType.WATER_CRYSTALS, 1000);
    uint256 amount = planet.materialStorage.getMaterial(planet.planetHash, MaterialType.WATER_CRYSTALS);
    assertEq(amount, 1000);

    // Test updating material amount
    planet.materialStorage.setMaterial(planet.planetHash, MaterialType.WATER_CRYSTALS, 2000);
    amount = planet.materialStorage.getMaterial(planet.planetHash, MaterialType.WATER_CRYSTALS);
    assertEq(amount, 2000);

    // Test getting non-existent material
    amount = planet.materialStorage.getMaterial(planet.planetHash, MaterialType.LIVING_WOOD);
    assertEq(amount, 0);
  }
}
