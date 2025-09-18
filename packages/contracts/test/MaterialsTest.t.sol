// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { PlanetType, SpaceType, MaterialType, Biome } from "../src/codegen/common.sol";
import { Planet } from "../src/lib/Planet.sol";
import { PlanetLib } from "../src/lib/Planet.sol";
import { PlanetMaterialStorage } from "../src/codegen/tables/PlanetMaterialStorage.sol";
import { PlanetMaterial } from "../src/codegen/tables/PlanetMaterial.sol";

contract MaterialsTest is Test {
  function testMaterialGrowthLogic() public view {
    // Test the material growth logic directly without relying on world contract
    Planet memory planet;
    planet.planetHash = 1;
    planet.planetType = PlanetType.ASTEROID_FIELD;
    planet.level = 5;
    planet.spaceType = SpaceType.NEBULA;
    planet.perlin = 100;
    planet.silverGrowth = 1000;
    planet.silverCap = 1000000;

    // Test growth calculation
    uint256 growthRate = PlanetLib.getMaterialGrowth(planet, MaterialType.WATER_CRYSTALS);
    uint256 expectedGrowthRate = planet.silverGrowth;
    assertEq(growthRate, expectedGrowthRate);

    // Test material cap calculation
    uint256 materialCap = PlanetLib.getMaterialCap(planet, MaterialType.WATER_CRYSTALS);
    uint256 expectedCap = planet.silverCap;
    assertEq(materialCap, expectedCap);
  }

  function testMaterialGrowthCalculation() public view {
    // Test the material growth calculation for different planet levels
    Planet memory planet;
    planet.planetType = PlanetType.ASTEROID_FIELD;
    planet.silverGrowth = 1000;

    // Test level 1
    planet.level = 1;
    uint256 growthRate1 = PlanetLib.getMaterialGrowth(planet, MaterialType.WATER_CRYSTALS);
    assertEq(growthRate1, planet.silverGrowth);

    // Test level 3
    planet.level = 3;
    uint256 growthRate3 = PlanetLib.getMaterialGrowth(planet, MaterialType.WATER_CRYSTALS);
    assertEq(growthRate3, planet.silverGrowth);

    // Test level 5
    planet.level = 5;
    uint256 growthRate5 = PlanetLib.getMaterialGrowth(planet, MaterialType.WATER_CRYSTALS);
    assertEq(growthRate5, planet.silverGrowth);
  }

  function testMaterialCapCalculation() public pure {
    // Test the material cap calculation for different planet levels
    Planet memory planet;
    planet.planetType = PlanetType.ASTEROID_FIELD;
    planet.silverCap = 1000000;

    // Test level 1
    planet.level = 1;
    uint256 cap1 = PlanetLib.getMaterialCap(planet, MaterialType.WATER_CRYSTALS);
    assertEq(cap1, planet.silverCap);

    // Test level 3
    planet.level = 3;
    uint256 cap3 = PlanetLib.getMaterialCap(planet, MaterialType.WATER_CRYSTALS);
    assertEq(cap3, planet.silverCap);

    // Test level 5
    planet.level = 5;
    uint256 cap5 = PlanetLib.getMaterialCap(planet, MaterialType.WATER_CRYSTALS);
    assertEq(cap5, planet.silverCap);

    // Test level 7
    planet.level = 7;
    uint256 cap7 = PlanetLib.getMaterialCap(planet, MaterialType.WATER_CRYSTALS);
    assertEq(cap7, planet.silverCap);
  }

  function testNonAsteroidFieldPlanet() public view {
    // Test that non-ASTEROID_FIELD planets don't have material growth
    Planet memory planet;
    planet.planetType = PlanetType.PLANET;
    planet.level = 5;

    uint256 growthRate = PlanetLib.getMaterialGrowth(planet, MaterialType.WATER_CRYSTALS);
    assertEq(growthRate, 0); // Non-ASTEROID_FIELD planets should have 0 growth
  }

  function testMaterialStorageOperations() public view {
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
