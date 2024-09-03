// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { PlanetMetadata, PlanetMetadataData } from "../codegen/index.sol";
import { PlanetInitialResource, PlanetInitialResourceData } from "../codegen/index.sol";
import { SpaceType, PlanetType } from "../codegen/common.sol";

contract InitializeSystem is System {
  function setPlanetMetadata(uint8 level, PlanetMetadataData memory metadata, uint256 initialPopulationPercentage)
    public
  {
    PlanetMetadataData memory md = metadata;
    // NEBULA
    _initPlanetMetadataWithSpaceType(SpaceType.NEBULA, level, md, initialPopulationPercentage);

    // SPACE
    md.range = (metadata.range * 5) / 4;
    md.speed = (metadata.speed * 5) / 4;
    md.populationCap = (metadata.populationCap * 5) / 4;
    md.populationGrowth = (metadata.populationGrowth * 5) / 4;
    md.silverCap = (metadata.silverCap * 5) / 4;
    md.silverGrowth = (metadata.silverGrowth * 5) / 4;
    md.defense = metadata.defense / 2;
    _initPlanetMetadataWithSpaceType(SpaceType.SPACE, level, md, initialPopulationPercentage * 4);

    // DEEP_SPACE
    md.range = (metadata.range * 3) / 2;
    md.speed = (metadata.speed * 3) / 2;
    md.populationCap = (metadata.populationCap * 3) / 2;
    md.populationGrowth = (metadata.populationGrowth * 3) / 2;
    md.silverCap = (metadata.silverCap * 3) / 2;
    md.silverGrowth = (metadata.silverGrowth * 3) / 2;
    md.defense = metadata.defense / 4;
    _initPlanetMetadataWithSpaceType(SpaceType.DEEP_SPACE, level, md, initialPopulationPercentage * 10);

    // DEAD_SPACE * 2
    md.range = metadata.range * 2;
    md.speed = metadata.speed * 2;
    md.populationCap = metadata.populationCap * 2;
    md.populationGrowth = metadata.populationGrowth * 2;
    md.silverCap = metadata.silverCap * 2;
    md.silverGrowth = metadata.silverGrowth * 2;
    md.defense = (metadata.defense * 3) / 20;
    _initPlanetMetadataWithSpaceType(SpaceType.DEAD_SPACE, level, md, initialPopulationPercentage * 20);
  }

  /**
   * @dev
   * ASTEROID_FIELD: 1/2 defense, double silverCap
   * SPACETIME_RIP: 1/2 defense, double silverCap, no silverGrowth
   * PLANET: no silver, no silverGrowth
   * FOUNDRY: no silver, no silverGrowth
   * QUASAR: double speed, no silverGrowth, 10 times silverCap, no populationGrowth, 5 times populationCap
   */
  function _initPlanetMetadataWithSpaceType(
    SpaceType spaceType,
    uint8 level,
    PlanetMetadataData memory metadata,
    uint256 initialPopulationPercentage
  ) internal {
    PlanetMetadataData memory md = metadata;
    md.defense /= 2;
    md.silverCap *= 2;
    PlanetMetadata.set(spaceType, PlanetType.ASTEROID_FIELD, level, md);
    uint64 population = uint64(md.populationCap * initialPopulationPercentage / 100);
    PlanetInitialResource.set(
      spaceType, PlanetType.ASTEROID_FIELD, level, PlanetInitialResourceData(population, md.silverCap / 2)
    );

    md.silverGrowth = 0;
    PlanetMetadata.set(spaceType, PlanetType.SPACETIME_RIP, level, md);
    PlanetInitialResource.set(spaceType, PlanetType.SPACETIME_RIP, level, PlanetInitialResourceData(population, 0));
    md.defense = metadata.defense;
    md.silverCap = metadata.silverCap;
    PlanetMetadata.set(spaceType, PlanetType.PLANET, level, md);
    PlanetInitialResource.set(spaceType, PlanetType.PLANET, level, PlanetInitialResourceData(population, 0));
    PlanetMetadata.set(spaceType, PlanetType.FOUNDRY, level, md);
    PlanetInitialResource.set(spaceType, PlanetType.FOUNDRY, level, PlanetInitialResourceData(population, 0));
    md.silverCap *= 10;
    md.populationCap *= 5;
    population *= 5;
    md.speed *= 2;
    md.populationGrowth = 0;
    PlanetMetadata.set(spaceType, PlanetType.QUASAR, level, md);
    PlanetInitialResource.set(spaceType, PlanetType.QUASAR, level, PlanetInitialResourceData(population / 2, 0));
  }
}
