// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { Errors } from "../interfaces/errors.sol";
import { PlanetType, SpaceType } from "../codegen/common.sol";
import { Planet as PlanetTable, PlanetData, PlanetMetadata, PlanetMetadataData } from "../codegen/index.sol";
import { UniverseConfig, UniverseZoneConfig, PlanetLevelConfig } from "../codegen/index.sol";
import { SpaceTypeConfig, PlanetTypeConfig, SpaceTypeConfig } from "../codegen/index.sol";
import { PlanetInitialValue, PlanetInitialValueData, Ticker, PlanetOwner } from "../codegen/index.sol";
import { PendingMoveData, MoveData } from "../codegen/index.sol";
import { ABDKMath64x64 } from "abdk-libraries-solidity/ABDKMath64x64.sol";
import { PendingMoveLib } from "./Move.sol";

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
  PendingMoveData moveQueue;
}

library PlanetLib {
  using PendingMoveLib for PendingMoveData;

  function readFromStore(Planet memory planet) internal view {
    _validateHash(planet);

    if (PlanetTable.getPlanetType(bytes32(planet.planetHash)) == PlanetType.UNKNOWN) {
      _initPlanet(planet);
    } else {
      _readLatestData(planet);
    }

    _readMetadata(planet);

    _doublePropeties(planet);
  }

  function writeToStore(Planet memory planet) internal {
    PlanetData memory data = PlanetData({
      perlin: uint8(planet.perlin),
      lastUpdateTick: uint64(planet.lastUpdateTick),
      level: uint8(planet.level),
      planetType: planet.planetType,
      spaceType: planet.spaceType,
      population: uint64(planet.population),
      silver: uint64(planet.silver)
    });
    PlanetTable.set(bytes32(planet.planetHash), data);
    PlanetOwner.set(bytes32(planet.planetHash), planet.owner);
    planet.moveQueue.WriteToStore(planet.planetHash);
  }

  function naturalGrowth(Planet memory planet, uint256 untilTick) internal pure {
    if (planet.lastUpdateTick >= untilTick) {
      return;
    }
    uint256 tickElapsed = untilTick - planet.lastUpdateTick;
    planet.lastUpdateTick = untilTick;
    if (planet.owner == address(0)) {
      return;
    }
    _populationGrow(planet, tickElapsed);
    _silverGrow(planet, tickElapsed);
  }

  function pushMove(Planet memory planet, MoveData memory move) internal {
    planet.moveQueue.PushMove(planet.planetHash, move);
  }

  function popArrivedMove(Planet memory planet, uint256 untilTick) internal view returns (MoveData memory move) {
    return planet.moveQueue.PopArrivedMove(planet.planetHash, untilTick);
  }

  function _validateHash(Planet memory planet) internal view {
    if (
      planet.planetHash
        >= (21888242871839275222246405745257275088548364400416034343698204186575808495617 / UniverseConfig.getSparsity())
    ) {
      revert Errors.InvalidPlanetHash();
    }
  }

  function _initPlanet(Planet memory planet) internal view {
    _initZone(planet);
    _initSpaceType(planet);
    _initLevel(planet);
    _initPlanetType(planet);
    _initPopulationAndSilver(planet);
    planet.moveQueue.New();
    planet.lastUpdateTick = Ticker.getTickNumber();
  }

  function _initSpaceType(Planet memory planet) internal view {
    uint32[] memory thresholds = SpaceTypeConfig.getPerlinThresholds();
    uint256 perlin = planet.perlin;
    uint256 length = thresholds.length;
    // if a planet locates at the last second zone, its space type is NEBULA
    if (planet.universeZone + 1 == UniverseZoneConfig.lengthBorders()) {
      planet.spaceType = SpaceType.NEBULA;
      return;
    }
    for (uint256 i; i < thresholds.length;) {
      if (perlin < thresholds[i]) {
        planet.spaceType = SpaceType(i + 1);
        return;
      }
      unchecked {
        ++i;
      }
    }
    planet.spaceType = SpaceType(length);
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
    revert Errors.UnknownPlanetType();
  }

  function _initPopulationAndSilver(Planet memory planet) internal view {
    PlanetInitialValueData memory initialValues =
      PlanetInitialValue.get(planet.spaceType, planet.planetType, uint8(planet.level));
    planet.population = initialValues.population;
    planet.silver = initialValues.silver;
  }

  function _readLatestData(Planet memory planet) internal view {
    PlanetData memory data = PlanetTable.get(bytes32(planet.planetHash));
    planet.perlin = data.perlin;
    planet.owner = PlanetOwner.get(bytes32(planet.planetHash));
    planet.lastUpdateTick = data.lastUpdateTick;
    planet.level = data.level;
    planet.planetType = data.planetType;
    planet.spaceType = data.spaceType;
    planet.population = data.population;
    planet.silver = data.silver;
    planet.moveQueue.ReadFromStore(planet.planetHash);
  }

  function _readMetadata(Planet memory planet) internal view {
    PlanetMetadataData memory metadata = PlanetMetadata.get(planet.spaceType, planet.planetType, uint8(planet.level));
    planet.range = metadata.range;
    planet.speed = metadata.speed;
    planet.defense = metadata.defense;
    planet.populationCap = metadata.populationCap;
    planet.populationGrowth = metadata.populationGrowth;
    planet.silverCap = metadata.silverCap;
    planet.silverGrowth = metadata.silverGrowth;
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

  function _populationGrow(Planet memory planet, uint256 tickElapsed) internal pure {
    if (planet.populationGrowth == 0) {
      return;
    }
    int128 time = ABDKMath64x64.fromUInt(tickElapsed);
    int128 one = ABDKMath64x64.fromUInt(1);

    int128 denominator = ABDKMath64x64.add(
      ABDKMath64x64.mul(
        ABDKMath64x64.exp(
          ABDKMath64x64.div(
            ABDKMath64x64.mul(
              ABDKMath64x64.mul(ABDKMath64x64.fromInt(-4), ABDKMath64x64.fromUInt(planet.populationGrowth)), time
            ),
            ABDKMath64x64.fromUInt(planet.populationCap)
          )
        ),
        ABDKMath64x64.sub(
          ABDKMath64x64.div(ABDKMath64x64.fromUInt(planet.populationCap), ABDKMath64x64.fromUInt(planet.population)),
          one
        )
      ),
      one
    );

    planet.population =
      ABDKMath64x64.toUInt(ABDKMath64x64.div(ABDKMath64x64.fromUInt(planet.populationCap), denominator));
  }

  function _silverGrow(Planet memory planet, uint256 tickElapsed) internal pure {
    uint256 silver = planet.silver;
    uint256 cap = planet.silverCap;
    if (planet.silverGrowth == 0 || silver >= cap) {
      return;
    }
    silver += planet.silverGrowth * tickElapsed;
    planet.silver = silver > cap ? cap : silver;
  }
}