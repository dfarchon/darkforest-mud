// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { BaseTest } from "./BaseTest.t.sol";
import { IWorld } from "../src/codegen/world/IWorld.sol";
import { Ticker, TickerData, PendingMove, PendingMoveData, Move, MoveData } from "../src/codegen/index.sol";
import { Planet as PlanetTable, Counter, TempConfigSet } from "../src/codegen/index.sol";
import { PlanetType, SpaceType, MaterialType, Biome } from "../src/codegen/common.sol";
import { Planet } from "../src/lib/Planet.sol";
import { Proof } from "../src/lib/SnarkProof.sol";
import { MoveInput } from "../src/lib/VerificationInput.sol";
import { MaterialMove } from "../src/lib/Material.sol";
import { PlanetLib } from "../src/lib/Planet.sol";
import { PlanetMaterialStorage } from "../src/codegen/tables/PlanetMaterialStorage.sol";

contract MaterialsTest is BaseTest {
  function setUp() public override {
    super.setUp();

    vm.startPrank(admin);
    // skip snark check
    TempConfigSet.setSkipProofCheck(true);

    // unpause the universe if needed
    if (Ticker.getPaused()) {
      IWorld(worldAddress).df__unpause();
    }

    // init 2 planets
    IWorld(worldAddress).df__createPlanet(
      1,
      user1,
      0,
      1,
      PlanetType.ASTEROID_FIELD,
      SpaceType.NEBULA,
      300000,
      10000,
      0
    );
    IWorld(worldAddress).df__createPlanet(2, user2, 0, 1, PlanetType.PLANET, SpaceType.NEBULA, 200000, 10000, 0);

    // set tick rate to 1
    Ticker.setTickRate(1);
    vm.stopPrank();
  }

  function testMaterialsGrowth() public {
    uint64 tick = Ticker.getTickNumber();
    vm.prank(admin);
    uint64 elapsed = 1000;
    Ticker.setTickNumber(tick + elapsed);
    Planet memory planet1 = IWorld(worldAddress).df__readPlanet(1);

    bool[] memory exits = planet1.materialStorage.exists;
    for (uint256 i = 0; i < exits.length; i++) {
      if (exits[i]) {
        MaterialType material = MaterialType(i);
        uint256 currentAmount = planet1.materialStorage.getMaterial(planet1.planetHash, material);
        uint256 expectedAmount = planet1.level * 1e16 * 2 * elapsed;
        assertEq(currentAmount, expectedAmount);
      }
    }

    MaterialType[] memory allowedMaterials = PlanetLib.allowedMaterialsForBiome(
      Biome(uint8(planet1.getPlanetBiome()) - 1)
    );
    uint256 existsMap = 0;
    for (uint256 i = 0; i < allowedMaterials.length; i++) {
      existsMap |= 1 << uint256(allowedMaterials[i]);
    }
    uint256 currentExistsMap;
    for (uint256 i = 0; i < exits.length; i++) {
      if (exits[i]) {
        currentExistsMap |= 1 << uint256(i);
      }
    }
    assertEq(currentExistsMap, existsMap);
  }
}
