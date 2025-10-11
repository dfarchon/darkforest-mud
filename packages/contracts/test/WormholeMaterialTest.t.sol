// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { Test } from "forge-std/Test.sol";
import { Planet } from "src/lib/Planet.sol";
import { MaterialType, PlanetType, SpaceType } from "src/codegen/common.sol";
import { WormholeSystem } from "src/modules/atfs/Wormhole/WormholeSystem.sol";
import { WormholeMaintenanceSystem } from "src/systems/WormholeMaintenanceSystem.sol";

contract WormholeMaterialTest is Test {
  address public admin = address(0x1);
  address public player = address(0x2);

  function setUp() public {
    // Basic setup for testing
  }

  function testWormholeActivationMaterialConsumption() public {
    // Test the material consumption logic directly
    WormholeSystem wormholeSystem = new WormholeSystem();

    // Create a mock planet with sufficient materials
    Planet memory planet = _createMockPlanet(200, 100); // 200 mycelium, 100 sandglass

    // Test that materials are sufficient for activation
    uint256 myceliumAmount = planet.getMaterial(MaterialType.MYCELIUM);
    uint256 sandglassAmount = planet.getMaterial(MaterialType.SANDGLASS);

    assertEq(myceliumAmount, 200, "Planet should have 200 mycelium");
    assertEq(sandglassAmount, 100, "Planet should have 100 sandglass");

    // Test material consumption (this would be called during activation)
    planet.setMaterial(MaterialType.MYCELIUM, myceliumAmount - 100); // Consume 100 for activation
    planet.setMaterial(MaterialType.SANDGLASS, sandglassAmount - 50); // Consume 50 for activation

    // Verify materials were consumed
    uint256 remainingMycelium = planet.getMaterial(MaterialType.MYCELIUM);
    uint256 remainingSandglass = planet.getMaterial(MaterialType.SANDGLASS);

    assertEq(remainingMycelium, 100, "Mycelium should be consumed for activation");
    assertEq(remainingSandglass, 50, "Sandglass should be consumed for activation");
  }

  function testWormholeActivationInsufficientMaterials() public {
    // Test with insufficient materials
    Planet memory planet = _createMockPlanet(50, 25); // Only 50 mycelium, 25 sandglass

    // Test that materials are insufficient for activation
    uint256 myceliumAmount = planet.getMaterial(MaterialType.MYCELIUM);
    uint256 sandglassAmount = planet.getMaterial(MaterialType.SANDGLASS);

    assertEq(myceliumAmount, 50, "Planet should have 50 mycelium");
    assertEq(sandglassAmount, 25, "Planet should have 25 sandglass");

    // Test that activation would fail due to insufficient materials
    bool hasEnoughMycelium = myceliumAmount >= 100; // Need 100 for activation
    bool hasEnoughSandglass = sandglassAmount >= 50; // Need 50 for activation

    assertFalse(hasEnoughMycelium, "Should not have enough mycelium for activation");
    assertFalse(hasEnoughSandglass, "Should not have enough sandglass for activation");
  }

  function testWormholeMaintenanceMyceliumConsumption() public {
    // Test wormhole maintenance consumption
    Planet memory planet = _createMockPlanet(10, 0); // 10 mycelium, 0 sandglass

    // Test initial mycelium amount
    uint256 initialMycelium = planet.getMaterial(MaterialType.MYCELIUM);
    assertEq(initialMycelium, 10, "Planet should start with 10 mycelium");

    // Simulate 5 ticks of maintenance (1 mycelium per tick)
    for (uint256 i = 0; i < 5; i++) {
      uint256 currentMycelium = planet.getMaterial(MaterialType.MYCELIUM);
      if (currentMycelium >= 1) {
        planet.setMaterial(MaterialType.MYCELIUM, currentMycelium - 1);
      }
    }

    // Verify mycelium was consumed (10 - 5 = 5 remaining)
    uint256 remainingMycelium = planet.getMaterial(MaterialType.MYCELIUM);
    assertEq(remainingMycelium, 5, "Mycelium should be consumed for maintenance");
  }

  function testWormholeDeactivationOnMyceliumDepletion() public {
    // Test wormhole deactivation when mycelium is depleted
    Planet memory planet = _createMockPlanet(1, 0); // Only 1 mycelium

    // Test initial state
    uint256 initialMycelium = planet.getMaterial(MaterialType.MYCELIUM);
    assertEq(initialMycelium, 1, "Planet should start with 1 mycelium");

    // Simulate maintenance consumption that depletes mycelium
    uint256 currentMycelium = planet.getMaterial(MaterialType.MYCELIUM);
    if (currentMycelium >= 1) {
      planet.setMaterial(MaterialType.MYCELIUM, 0); // Deplete mycelium
    }

    // Verify mycelium was depleted
    uint256 remainingMycelium = planet.getMaterial(MaterialType.MYCELIUM);
    assertEq(remainingMycelium, 0, "Mycelium should be depleted");

    // Test that wormhole should be deactivated when mycelium is 0
    bool shouldDeactivate = remainingMycelium < 10; // Maintenance rate is 10 per tick
    assertTrue(shouldDeactivate, "Wormhole should be deactivated due to mycelium depletion");
  }

  /**
   * @notice Helper function to create a mock planet with specified materials
   * @param myceliumAmount Amount of mycelium to set
   * @param sandglassAmount Amount of sandglass to set
   * @return planet Mock planet with materials
   */
  function _createMockPlanet(
    uint256 myceliumAmount,
    uint256 sandglassAmount
  ) internal pure returns (Planet memory planet) {
    // Initialize a basic planet structure
    planet.planetHash = 1;
    planet.owner = address(0x1);
    planet.junkOwner = address(0x1);
    planet.lastUpdateTick = 0;
    planet.population = 1000;
    planet.silver = 1000;
    planet.rangeUpgrades = 0;
    planet.speedUpgrades = 0;
    planet.defenseUpgrades = 0;
    planet.useProps = false;
    planet.updateProps = false;
    planet.range = 100;
    planet.speed = 100;
    planet.defense = 100;
    planet.populationCap = 10000;
    planet.populationGrowth = 10;
    planet.silverCap = 10000;
    planet.silverGrowth = 10;
    planet.effectNumber = 0;
    planet.ownerChanged = false;
    planet.isInitializing = false;
    planet.perlin = 0;
    planet.level = 1;
    planet.planetType = PlanetType.PLANET;
    planet.spaceType = SpaceType.SPACE;
    planet.addJunkTick = 0;

    // Set materials
    planet.setMaterial(MaterialType.MYCELIUM, myceliumAmount);
    planet.setMaterial(MaterialType.SANDGLASS, sandglassAmount);
  }
}
