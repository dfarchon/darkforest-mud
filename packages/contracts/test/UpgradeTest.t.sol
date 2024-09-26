// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { MudTest } from "@latticexyz/world/test/MudTest.t.sol";
import { getKeysWithValue } from "@latticexyz/world-modules/src/modules/keyswithvalue/getKeysWithValue.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";
import { UpgradeConfig, UpgradeConfigData } from "../src/codegen/index.sol";
import { Planet as PlanetTable } from "../src/codegen/index.sol";
import { PlanetType, SpaceType } from "../src/codegen/common.sol";
import { Planet } from "../src/lib/Planet.sol";
import { PlanetMetadata, PlanetMetadataData } from "../src/codegen/index.sol";
import { PlanetProps, PlanetPropsData } from "../src/codegen/index.sol";
import { Ticker, TickerData } from "../src/codegen/index.sol";
import { Errors } from "../src/interfaces/errors.sol";

contract UpgradeTest is MudTest {
  address admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
  address user1 = address(1);
  uint256 planetHash = type(uint256).max;

  function setUp() public override {
    super.setUp();

    vm.startPrank(admin);
    // unpause the universe if needed
    if (Ticker.getPaused()) {
      IWorld(worldAddress).df__unpause();
    }

    // init 1 planets
    IWorld(worldAddress).df__createPlanet(
      planetHash,
      user1,
      0,
      1,
      PlanetType.PLANET,
      SpaceType.NEBULA,
      200000,
      100000,
      0
    );
    vm.stopPrank();
  }

  function testUpgrade_multiplier() public {
    // set range upgrade to 1
    vm.prank(admin);
    PlanetTable.setUpgrades(bytes32(planetHash), 0x010000);
    UpgradeConfigData memory upgradeConfig = UpgradeConfig.get();
    Planet memory planet = IWorld(worldAddress).df__readPlanet(planetHash);
    PlanetMetadataData memory metadata = PlanetMetadata.get(planet.spaceType, planet.planetType, uint8(planet.level));
    assertEq(planet.rangeUpgrades, 1);
    assertEq(planet.speedUpgrades, 0);
    assertEq(planet.defenseUpgrades, 0);
    assertEq(planet.populationCap, (metadata.populationCap * upgradeConfig.populationCapMultiplier) / 100);
    assertEq(planet.populationGrowth, (metadata.populationGrowth * upgradeConfig.populationGrowthMultiplier) / 100);
    assertEq(planet.range, (metadata.range * upgradeConfig.rangeMultiplier) / 100);
    assertEq(planet.speed, metadata.speed);
    assertEq(planet.defense, metadata.defense);

    // set range upgrade to 2
    vm.prank(admin);
    PlanetTable.setUpgrades(bytes32(planetHash), 0x020000);
    planet = IWorld(worldAddress).df__readPlanet(planetHash);
    assertEq(planet.rangeUpgrades, 2);
    assertEq(planet.speedUpgrades, 0);
    assertEq(planet.defenseUpgrades, 0);
    assertEq(
      planet.populationCap,
      (metadata.populationCap * uint256(upgradeConfig.populationCapMultiplier) ** 2) / 100 ** 2
    );
    assertEq(
      planet.populationGrowth,
      (metadata.populationGrowth * uint256(upgradeConfig.populationGrowthMultiplier) ** 2) / 100 ** 2
    );
    assertEq(planet.range, (metadata.range * uint256(upgradeConfig.rangeMultiplier) ** 2) / 100 ** 2);
    assertEq(planet.speed, metadata.speed);
    assertEq(planet.defense, metadata.defense);

    // additionally set speed upgrade to 2
    vm.prank(admin);
    PlanetTable.setUpgrades(bytes32(planetHash), 0x020200);
    planet = IWorld(worldAddress).df__readPlanet(planetHash);
    assertEq(planet.rangeUpgrades, 2);
    assertEq(planet.speedUpgrades, 2);
    assertEq(planet.defenseUpgrades, 0);
    assertEq(
      planet.populationCap,
      (metadata.populationCap * uint256(upgradeConfig.populationCapMultiplier) ** 4) / 100 ** 4
    );
    assertEq(
      planet.populationGrowth,
      (metadata.populationGrowth * uint256(upgradeConfig.populationGrowthMultiplier) ** 4) / 100 ** 4
    );
    assertEq(planet.range, (metadata.range * uint256(upgradeConfig.rangeMultiplier) ** 2) / 100 ** 2);
    assertEq(planet.speed, (metadata.speed * uint256(upgradeConfig.speedMultiplier) ** 2) / 100 ** 2);
    assertEq(planet.defense, metadata.defense);

    // additionally set defense upgrade to 1
    vm.prank(admin);
    PlanetTable.setUpgrades(bytes32(planetHash), 0x020201);
    planet = IWorld(worldAddress).df__readPlanet(planetHash);
    assertEq(planet.rangeUpgrades, 2);
    assertEq(planet.speedUpgrades, 2);
    assertEq(planet.defenseUpgrades, 1);
    assertEq(
      planet.populationCap,
      (metadata.populationCap * uint256(upgradeConfig.populationCapMultiplier) ** 5) / 100 ** 5
    );
    assertEq(
      planet.populationGrowth,
      (metadata.populationGrowth * uint256(upgradeConfig.populationGrowthMultiplier) ** 5) / 100 ** 5
    );
    assertEq(planet.range, (metadata.range * uint256(upgradeConfig.rangeMultiplier) ** 2) / 100 ** 2);
    assertEq(planet.speed, (metadata.speed * uint256(upgradeConfig.speedMultiplier) ** 2) / 100 ** 2);
    assertEq(planet.defense, (metadata.defense * upgradeConfig.defenseMultiplier) / 100);
  }

  function testUpgrade_cost() public {
    vm.prank(admin);
    vm.expectRevert(Errors.NotPlanetOwner.selector);
    IWorld(worldAddress).df__upgradePlanet(planetHash, 1, 1, 1);
    vm.prank(user1);
    vm.expectRevert(Errors.NotEnoughSilverToUpgrade.selector);
    IWorld(worldAddress).df__upgradePlanet(planetHash, 1, 1, 1);
    vm.prank(user1);
    IWorld(worldAddress).df__upgradePlanet(planetHash, 1, 1, 0);
    Planet memory planet = IWorld(worldAddress).df__readPlanet(planetHash);
    PlanetMetadataData memory metadata = PlanetMetadata.get(planet.spaceType, planet.planetType, uint8(planet.level));
    UpgradeConfigData memory upgradeConfig = UpgradeConfig.get();
    uint256 silverCost = uint8(upgradeConfig.silverCost) + uint8(upgradeConfig.silverCost >> 8);
    silverCost = (silverCost * planet.silverCap) / 100;
    assertEq(planet.silver, 100000 - silverCost);
    assertEq(planet.useProps, true);
    assertEq(PlanetTable.getUpgrades(bytes32(planetHash)), 0x010100);
    assertEq(planet.rangeUpgrades, 1);
    assertEq(planet.speedUpgrades, 1);
    assertEq(planet.defenseUpgrades, 0);
    PlanetPropsData memory props = PlanetProps.get(bytes32(planet.planetHash));
    assertEq(
      props.populationCap,
      (metadata.populationCap * uint256(upgradeConfig.populationCapMultiplier) ** 2) / 100 ** 2
    );
    assertEq(
      props.populationGrowth,
      (metadata.populationGrowth * uint256(upgradeConfig.populationGrowthMultiplier) ** 2) / 100 ** 2
    );
    assertEq(props.range, (metadata.range * uint256(upgradeConfig.rangeMultiplier) ** 1) / 100 ** 1);
    assertEq(props.speed, (metadata.speed * uint256(upgradeConfig.speedMultiplier) ** 1) / 100 ** 1);
    assertEq(props.defense, metadata.defense);
  }
}
