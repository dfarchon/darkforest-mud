// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Errors } from "../interfaces/errors.sol";
import { PlanetType, SpaceType } from "../codegen/common.sol";
import { Planet as PlanetTable, PlanetData, PlanetMetadata, PlanetMetadataData } from "../codegen/index.sol";
import { UniverseConfig, UniverseZoneConfig, PlanetLevelConfig } from "../codegen/index.sol";
import { SpaceTypeConfig, PlanetTypeConfig, SpaceTypeConfig } from "../codegen/index.sol";
import { PlanetInitialValue, PlanetInitialValueData, Ticker, PlanetOwner } from "../codegen/index.sol";
import { MoveData } from "../codegen/index.sol";
import { ABDKMath64x64 } from "abdk-libraries-solidity/ABDKMath64x64.sol";
import { UniverseLib } from "./Universe.sol";
import { MoveQueue } from "./MoveQueue.sol";

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
  MoveQueue moveQueue;
}

library PlanetLib {
  function readFromStore(Planet memory planet) internal view {
    _validateHash(planet);

    PlanetData memory data = PlanetTable.get(bytes32(planet.planetHash));
    if (data.planetType == PlanetType.UNKNOWN) {
      _initPlanet(planet);
    } else {
      _loadLatestData(planet, data);
    }

    _loadMetadata(planet);

    _doublePropeties(planet);
  }

  function sync(Planet memory planet) internal view {
    MoveData memory arrivedMove = planet.moveQueue.PopMove();
    while (uint256(arrivedMove.from) != 0) {
      _naturalGrowth(planet, arrivedMove.arrivalTime);
      planet.arrive(arrivedMove);
      arrivedMove = planet.moveQueue.PopMove();
    }
    _naturalGrowth(planet, Ticker.getTickNumber());
  }

  function send(
    Planet memory from,
    Planet memory to,
    uint256 distance,
    uint256 population,
    uint256 silver,
    uint256 artifact
  ) internal {
    _validateSent(from, population, silver);

    uint256 time = UniverseLib.distance(from, to, distance) * 100 / from.speed;
    uint256 present = Ticker.getTickNumber();

    MoveData memory move = MoveData({
      from: bytes32(from.planetHash),
      executor: from.owner,
      departureTime: uint64(present),
      arrivalTime: uint64(present + time),
      population: uint64(population),
      silver: uint64(silver),
      artifact: artifact
    });
    from.moveQueue.PushMove(move);

    from.population -= population;
    from.silver -= silver;
  }

  function arrive(Planet memory planet, MoveData memory move) internal view {
    assert(move.arrivalTime == planet.lastUpdateTick);
    uint256 population = planet.population;
    uint256 arrivedPopulation = move.population;
    if (move.executor == planet.owner) {
      population += arrivedPopulation;
    } else {
      uint256 defense = planet.defense;
      if (population > (arrivedPopulation * 100) / defense) {
        population -= (arrivedPopulation * 100) / defense;
      } else {
        planet.owner = move.executor;
        population = arrivedPopulation - ((population * defense) / 100);
        if (population == 0) {
          population = 1;
        }
      }
    }
    if (planet.planetType == PlanetType.QUASAR) {
      if (population > planet.populationCap) {
        population = planet.populationCap;
      }
    }
    planet.population = population;

    planet.silver += move.silver;
    if (planet.silver > planet.silverCap) {
      planet.silver = planet.silverCap;
    }
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
    planet.moveQueue.New(planet.planetHash);
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

  function _loadLatestData(Planet memory planet, PlanetData memory data) internal view {
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

  function _loadMetadata(Planet memory planet) internal view {
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

  function _naturalGrowth(Planet memory planet, uint256 untilTick) internal view {
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

  function _populationGrow(Planet memory planet, uint256 tickElapsed) internal view {
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

  function _silverGrow(Planet memory planet, uint256 tickElapsed) internal view {
    uint256 silver = planet.silver;
    uint256 cap = planet.silverCap;
    if (planet.silverGrowth == 0 || silver >= cap) {
      return;
    }
    silver += planet.silverGrowth * tickElapsed;
    planet.silver = silver > cap ? cap : silver;
  }

  function _validateSent(Planet memory from, uint256 population, uint256 silver) internal view {
    if (from.owner != msg.sender) {
      revert Errors.NotPlanetOwner();
    }
    if (from.population <= population) {
      revert Errors.NotEnoughPopulation();
    }
    if (from.silver < silver) {
      revert Errors.NotEnoughSilver();
    }
  }
}
