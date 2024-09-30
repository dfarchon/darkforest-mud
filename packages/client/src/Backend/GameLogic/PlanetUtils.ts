import {
  SpaceType,
  type LocationId,
  type Planet,
  type PlanetType,
} from "@df/types";
import { PlanetLevel } from "@df/types";
import type { ClientComponents } from "@mud/createClientComponents";
import bigInt, { BigInteger } from "big-integer";
import { LOCATION_ID_UB } from "@df/constants";
import type { ContractConstants } from "../../_types/darkforest/api/ContractsAPITypes";
import { bonusFromHex, getBytesFromHex } from "@df/hexgen";
import { singletonEntity, encodeEntity } from "@latticexyz/store-sync/recs";
import {
  type Entity,
  Has,
  getComponentValue,
  getComponentValueStrict,
  runQuery,
} from "@latticexyz/recs";
import {
  CONTRACT_PRECISION,
  EMPTY_ADDRESS,
  MAX_PLANET_LEVEL,
  MIN_PLANET_LEVEL,
} from "@df/constants";

interface PlanetUtilsConfig {
  components: ClientComponents;
  contractConstants: ContractConstants;
}

export class PlanetUtils {
  private components: ClientComponents;
  private contractConstants: ContractConstants;

  public constructor({ components, contractConstants }: PlanetUtilsConfig) {
    this.components = components;
    this.contractConstants = contractConstants;
  }

  public readPlanet(planetId: LocationId): Planet | undefined {
    return undefined;
  }

  public _validateHash(planet: Planet): boolean {
    const locationBI = bigInt(planet.locationId, 16);
    if (locationBI.geq(LOCATION_ID_UB)) {
      return false;
      // throw new Error("not a valid location");
    }
    return true;
  }

  public _initPlanet(planet: Planet): Planet {
    planet = this._initZone(planet);
    planet = this._initSpaceType(planet);
    planet = this._initLevel(planet);
    planet = this._initPlanetType(planet);
    const { Ticker } = this.components;
    const ticker = getComponentValue(Ticker, singletonEntity);
    planet.lastUpdated = !ticker ? (ticker.tickNumber as number) : 0;
    return planet;
  }

  //TODO refer to the implementation logic of src/lib/Planet.sol

  public _initZone(planet: Planet): Planet {
    const borders = this.contractConstants.MAX_LEVEL_DIST;
    const distanceSquare = planet.distSquare;
    const maxZone = borders.length;
    for (let i = 0; i < maxZone; i++) {
      if (distanceSquare <= borders[i] * borders[i]) {
        planet.universeZone = i;
        return planet;
      }
    }
    planet.universeZone = maxZone;
    return planet;
  }

  public _initSpaceType(planet: Planet): Planet {
    const thresholds = [
      this.contractConstants.PERLIN_THRESHOLD_1,
      this.contractConstants.PERLIN_THRESHOLD_2,
      this.contractConstants.PERLIN_THRESHOLD_3,
    ];
    const perlin = planet.perlin;
    const length = thresholds.length;
    const bordersLength = this.contractConstants.MAX_LEVEL_DIST.length;
    if (planet.universeZone + 1 === bordersLength) {
      planet.spaceType = SpaceType.NEBULA;
      return planet;
    }
    for (let i = 0; i < length; i++) {
      if (perlin < thresholds[i]) {
        planet.spaceType = i as SpaceType;
        break;
      }
    }
    planet.spaceType = length as SpaceType;
    return planet;
  }

  public spaceTypeFromPerlin(
    perlin: number,
    distFromOrigin: number,
  ): SpaceType {
    // const MAX_LEVEL_DIST = [40000, 30000, 20000, 10000, 5000];
    const MAX_LEVEL_DIST = this.contractConstants.MAX_LEVEL_DIST;

    if (
      distFromOrigin < MAX_LEVEL_DIST[0] &&
      distFromOrigin > MAX_LEVEL_DIST[1]
    ) {
      return SpaceType.NEBULA;
    }

    if (perlin < this.contractConstants.PERLIN_THRESHOLD_1) {
      return SpaceType.NEBULA;
    } else if (perlin < this.contractConstants.PERLIN_THRESHOLD_2) {
      return SpaceType.SPACE;
    } else if (perlin < this.contractConstants.PERLIN_THRESHOLD_3) {
      return SpaceType.DEEP_SPACE;
    } else {
      return SpaceType.DEAD_SPACE;
    }
  }

  public _initLevel(planet: Planet): Planet {
    const levelBigInt = getBytesFromHex(planet.locationId, 29, 32);
    const thresholds = this.contractConstants.PLANET_LEVEL_THRESHOLDS;
    const maxLvl = thresholds.length;
    let x = 0;
    for (let i = 0; i < maxLvl; i++) {
      if (levelBigInt < bigInt(thresholds[i])) {
        x = maxLvl - i;
        break;
      }
    }

    // _bounceAndBoundLevel
    let level =
      x +
      this.contractConstants.SPACE_TYPE_PLANET_LEVEL_BONUS[
        Number(planet.spaceType)
      ];

    level += this.contractConstants.MIN_LEVEL_BIAS[planet.universeZone];
    if (level < 0) {
      planet.planetLevel = PlanetLevel.ZERO;
      return planet;
    }

    let posLevel = level;

    const limit = Math.min(
      this.contractConstants.SPACE_TYPE_PLANET_LEVEL_LIMITS[
        Number(planet.spaceType)
      ],
      this.contractConstants.MAX_LEVEL_LIMIT[planet.universeZone],
    );

    posLevel = Math.min(posLevel, limit);
    planet.planetLevel = posLevel as PlanetLevel;
    return planet;
  }

  public _initPlanetType(planet: Planet): Planet {
    const levelBigInt = getBytesFromHex(planet.locationId, 28, 29);
    const thresholds =
      this.contractConstants.PLANET_TYPE_WEIGHTS[Number(planet.spaceType)][
        Number(planet.planetLevel)
      ];
    const length = thresholds.length;
    let cumulativeThreshold = 0;
    for (let i = 0; i < length; i++) {
      cumulativeThreshold += thresholds[i];
      if (levelBigInt < bigInt(cumulativeThreshold)) {
        planet.planetType = i as PlanetType;
        break;
      }
    }
    return planet;
  }

  public _initPopulationAndSilver(planet: Planet): Planet {
    const { PlanetInitialResource } = this.components;
    const key = encodeEntity(PlanetInitialResource.metadata.keySchema, {
      spaceType: Number(planet.spaceType) + 1,
      planetType: planet.planetType as number,
      level: planet.planetLevel as number,
    });

    const planetInitialResource = getComponentValue(PlanetInitialResource, key);

    if (planetInitialResource === undefined) {
      throw Error("need planet initial resource");
    }

    planet.energy = Math.floor(
      Number(planetInitialResource.population) / CONTRACT_PRECISION,
    );
    planet.silver = Math.floor(
      Number(planetInitialResource.silver) / CONTRACT_PRECISION,
    );

    return planet;
  }
}
