// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Errors } from "../interfaces/errors.sol";
import { PlanetType, SpaceType } from "../codegen/common.sol";
import { Planet as PlanetTable, PlanetData, PlanetMetadata, PlanetMetadataData } from "../codegen/index.sol";
import { UniverseConfig, UniverseZoneConfig, PlanetLevelConfig } from "../codegen/index.sol";
import { SpaceTypeConfig, PlanetTypeConfig, SpaceTypeConfig } from "../codegen/index.sol";
import { PlanetInitialValue, PlanetInitialValueData, Ticker, PlanetOwner } from "../codegen/index.sol";

using PlanetLib for Planet global;

struct Planet {
  uint256 planetHash;
  uint256 distSquare; // only for toPlanet in a move
  // properties generated during initialization
  uint256 perlin;
  address owner;
  uint256 lastUpdateTick;
  uint256 level;
  PlanetType planetType;
  SpaceType spaceType;
  uint256 universeZone; // only for newly initialized toPlanet in a move
  uint256 population;
  uint256 silver;
  // properties read from planet metadata
  uint256 range;
  uint256 speed;
  uint256 defense;
  uint256 populationCap;
  uint256 populationGrowth;
  uint256 silverCap;
  uint256 silverGrowth;
}

library PlanetLib {
  function readFromStore(Planet memory planet) internal view {
    if (
      planet.planetHash
        >= (21888242871839275222246405745257275088548364400416034343698204186575808495617 / UniverseConfig.getSparsity())
    ) {
      revert Errors.InvalidPlanetHash();
    }

    PlanetData memory data = PlanetTable.get(bytes32(planet.planetHash));
    bool newPlanet;
    if (data.planetType == PlanetType.UNKNOWN) {
      newPlanet = true;
      _initPlanet(planet);
    } else {
      // read metadata
      planet.perlin = data.perlin;
      planet.owner = PlanetOwner.get(bytes32(planet.planetHash));
      planet.lastUpdateTick = data.lastUpdateTick;
      planet.level = data.level;
      planet.planetType = data.planetType;
      planet.spaceType = data.spaceType;
      planet.population = data.population;
      planet.silver = data.silver;
    }

    // read latest data
    PlanetMetadataData memory metadata = PlanetMetadata.get(planet.spaceType, planet.planetType, uint8(planet.level));
    planet.range = metadata.range;
    planet.speed = metadata.speed;
    planet.defense = metadata.defense;
    planet.populationCap = metadata.populationCap;
    planet.populationGrowth = metadata.populationGrowth;
    planet.silverCap = metadata.silverCap;
    planet.silverGrowth = metadata.silverGrowth;

    _doublePropeties(planet);

    if (newPlanet) {
      PlanetInitialValueData memory initialValues =
        PlanetInitialValue.get(planet.spaceType, planet.planetType, uint8(planet.level));
      planet.population = initialValues.population;
      planet.silver = initialValues.silver;
    }
  }

  function _initPlanet(Planet memory planet) internal view {
    _initSpaceType(planet);
    _initZone(planet);
    _initLevel(planet);
    _initPlanetType(planet);
    planet.lastUpdateTick = Ticker.getTickNumber();
  }

  function _initSpaceType(Planet memory planet) internal view {
    uint32[] memory thresholds = SpaceTypeConfig.getPerlinThresholds();
    uint256 perlin = planet.perlin;
    assert(thresholds.length == 3);
    if (perlin >= thresholds[2]) {
      planet.spaceType = SpaceType.DEAD_SPACE;
    } else if (perlin >= thresholds[1]) {
      planet.spaceType = SpaceType.DEEP_SPACE;
    } else if (perlin >= thresholds[0]) {
      planet.spaceType = SpaceType.SPACE;
    } else {
      planet.spaceType = SpaceType.NEBULA;
    }
  }

  function _initZone(Planet memory planet) internal view {
    uint64[] memory borders = UniverseZoneConfig.getBorders();
    uint256 distanceSquare = planet.distSquare;
    uint256 maxZone = borders.length;
    for (uint256 i; i < maxZone;) {
      if (distanceSquare < borders[i] ** 2) {
        planet.universeZone = i;
        return;
      }
      unchecked {
        ++i;
      }
    }
    planet.universeZone = maxZone;
  }

  function _initLevel(Planet memory planet) internal view {
    uint256 value = uint24(planet.planetHash);
    uint32[] memory thresholds = PlanetLevelConfig.getThresholds();
    uint256 maxLvl = thresholds.length;
    for (uint256 i; i < maxLvl;) {
      if (value < thresholds[i]) {
        planet.level = maxLvl - i;
        break;
      }
      unchecked {
        ++i;
      }
    }
    _bounceAndBoundLevel(planet);
  }

  function _bounceAndBoundLevel(Planet memory planet) internal view {
    // bounce level
    int256 level = int256(planet.level) + SpaceTypeConfig.getPlanetLevelBonus()[uint8(planet.spaceType)];
    level += UniverseZoneConfig.getPlanetLevelBonus()[uint8(planet.universeZone)];

    // bound level
    if (level < 0) {
      planet.level = 0;
      return;
    }
    uint256 posLevel = uint256(level);
    uint256 limit = SpaceTypeConfig.getPlanetLevelLimits()[uint8(planet.spaceType)];
    if (posLevel > limit) {
      planet.level = limit;
    }
    limit = UniverseZoneConfig.getPlanetLevelLimits()[uint8(planet.universeZone)];
    if (posLevel > limit) {
      planet.level = limit;
    }
  }

  function _initPlanetType(Planet memory planet) internal view {
    uint256 value = uint8(planet.planetHash >> 24);
    uint8[] memory thresholds = PlanetTypeConfig.getThresholds(planet.spaceType, uint8(planet.level));
    uint256 length = thresholds.length;
    uint256 cumulativeThreshold;
    for (uint256 i; i < length;) {
      cumulativeThreshold += thresholds[i];
      if (value < cumulativeThreshold) {
        planet.planetType = PlanetType(i + 1);
        return;
      }
      unchecked {
        ++i;
      }
    }
  }

  function _doublePropeties(Planet memory planet) internal pure {
    uint256 value = planet.planetHash >> 32;
    if (uint8(value) < 16) {
      planet.populationCap *= 2;
    }
    value >>= 8;
    if (uint8(value) < 16) {
      planet.populationGrowth *= 2;
    }
    value >>= 8;
    if (uint8(value) < 16) {
      planet.range *= 2;
    }
    value >>= 8;
    if (uint8(value) < 16) {
      planet.speed *= 2;
    }
    value >>= 8;
    if (uint8(value) < 16) {
      planet.defense *= 2;
    }
  }
}
