import {
  SpaceType,
  type EthAddress,
  type LocationId,
  type Planet,
  type PlanetBonus,
  type PlanetType,
  type Upgrade,
  type UpgradeState,
} from "@df/types";
import { PlanetLevel } from "@df/types";
import type { ClientComponents } from "@mud/createClientComponents";
import bigInt, { type BigInteger } from "big-integer";
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

  public readPlanet(
    planetId: LocationId,
    perlin: number,
    distSquare: number,
  ): Planet {
    if (!this._validateHash(planetId)) {
      throw new Error("not a valid location");
    }
    const {
      PlanetConstants,
      PlanetOwner,
      Planet,
      PlanetProps,
      PlanetMetadata,
      RevealedPlanet,
    } = this.components;
    const planetEntity = encodeEntity(PlanetConstants.metadata.keySchema, {
      id: planetId as `0x${string}`,
    });
    const planetRec = getComponentValue(PlanetConstants, planetEntity);

    let spaceType: SpaceType;
    let planetType: PlanetType;
    let planetLevel: PlanetLevel;
    let universeZone: number;
    let population: number;
    let silver: number;
    let lastUpdateTick: number;
    let owner: EthAddress = EMPTY_ADDRESS;
    const upgradeState: UpgradeState = [0, 0, 0];
    let useProps = false;
    let isInContract = false;

    if (planetRec) {
      isInContract = true;
      spaceType = planetRec.spaceType as SpaceType;
      planetType = planetRec.planetType as PlanetType;
      planetLevel = planetRec.level as PlanetLevel;
      universeZone = this._initZone(distSquare);
      owner = getComponentValueStrict(PlanetOwner, planetEntity)
        ?.value as EthAddress;
      const planetData = getComponentValue(Planet, planetEntity);
      if (planetData) {
        population = Number(planetData.population);
        silver = Number(planetData.silver);
        lastUpdateTick = Number(planetData.lastUpdateTick);
        upgradeState[1] = (planetData.upgrades & 0xff0000) >> 16; // range
        upgradeState[2] = (planetData.upgrades & 0x00ff00) >> 8; // speed
        upgradeState[0] = planetData.upgrades & 0x0000ff; // defense
        useProps = planetData.useProps;
      } else {
        throw new Error("planet data not found");
      }
    } else {
      universeZone = this._initZone(distSquare);
      spaceType = this._initSpaceType(universeZone, perlin);
      planetLevel = this._initLevel(planetId, spaceType, universeZone);
      planetType = this._initPlanetType(planetId, spaceType, planetLevel);
      [population, silver] = this._initPopulationAndSilver(
        spaceType,
        planetType,
        planetLevel,
      );
      // todo read the current tick number
      lastUpdateTick = 0;
    }

    let range: number;
    let speed: number;
    let defense: number;
    let populationCap: number;
    let populationGrowth: number;
    let silverCap: number;
    let silverGrowth: number;
    const bonus: PlanetBonus = [
      this._doubleEnergyCap(planetId),
      this._doubleEnergyGrowth(planetId),
      this._doubleRange(planetId),
      this._doubleSpeed(planetId),
      this._doubleDefense(planetId),
      false, // not sure what this is
    ];
    if (useProps) {
      const planetProps = getComponentValue(PlanetProps, planetEntity);
      if (planetProps) {
        range = Number(planetProps.range);
        speed = Number(planetProps.speed);
        defense = Number(planetProps.defense);
        populationCap = Number(planetProps.populationCap);
        populationGrowth = Number(planetProps.populationGrowth);
        silverCap = Number(planetProps.silverCap);
        silverGrowth = Number(planetProps.silverGrowth);
      } else {
        throw new Error("planet props not found");
      }
    } else {
      const planetMetadata = getComponentValue(PlanetMetadata, planetEntity);
      if (planetMetadata) {
        range = Number(planetMetadata.range);
        speed = Number(planetMetadata.speed);
        defense = Number(planetMetadata.defense);
        populationCap = Number(planetMetadata.populationCap);
        populationGrowth = Number(planetMetadata.populationGrowth);
        silverCap = Number(planetMetadata.silverCap);
        silverGrowth = Number(planetMetadata.silverGrowth);

        // double properties
        if (bonus[0]) {
          populationCap *= 2;
        }
        if (bonus[1]) {
          populationGrowth *= 2;
        }
        if (bonus[2]) {
          range *= 2;
        }
        if (bonus[3]) {
          speed *= 2;
        }
        if (bonus[4]) {
          defense *= 2;
        }

        // activate upgrades
        [populationCap, populationGrowth, range, speed, defense] =
          this._activateUpgrades(
            populationCap,
            populationGrowth,
            range,
            speed,
            defense,
            upgradeState,
          );
      } else {
        throw new Error("planet metadata not found");
      }
    }

    const coordsRevealed = getComponentValue(RevealedPlanet, planetEntity)
      ? true
      : false;

    return {
      locationId: planetId,
      isHomePlanet: false,
      syncedWithContract: true,
      perlin,
      owner,
      spaceType,
      planetType,
      planetLevel,
      universeZone,
      distSquare,
      range,
      speed,
      defense,
      energy: population,
      energyCap: populationCap,
      energyGrowth: populationGrowth,
      silver,
      silverCap,
      silverGrowth,
      upgradeState,
      lastUpdated: lastUpdateTick,
      isInContract,
      coordsRevealed,
      silverSpent: this.calculateSilverSpent(upgradeState, silverCap),
      bonus,
      energyGroDoublers: 0,
      silverGroDoublers: 0,
    };
  }

  public _validateHash(locationId: LocationId): boolean {
    const locationBI = bigInt(locationId, 16);
    if (locationBI.geq(LOCATION_ID_UB)) {
      return false;
      // throw new Error("not a valid location");
    }
    return true;
  }

  // public _initPlanet(planet: Planet): Planet {
  //   planet = this._initZone(planet);
  //   planet = this._initSpaceType(planet);
  //   planet = this._initLevel(planet);
  //   planet = this._initPlanetType(planet);
  //   const { Ticker } = this.components;
  //   const ticker = getComponentValue(Ticker, singletonEntity);
  //   planet.lastUpdated = ticker === undefined ? 0 : Number(ticker.tickNumber);
  //   return planet;
  // }

  //TODO refer to the implementation logic of src/lib/Planet.sol

  public _initZone(distSquare: number): number {
    const borders = this.contractConstants.MAX_LEVEL_DIST;
    const distanceSquare = distSquare;
    const maxZone = borders.length;
    for (let i = 0; i < maxZone; i++) {
      if (distanceSquare <= borders[i] * borders[i]) {
        return i;
      }
    }
    return maxZone;
  }

  public _initSpaceType(universeZone: number, perlin: number): SpaceType {
    const thresholds = [
      this.contractConstants.PERLIN_THRESHOLD_1,
      this.contractConstants.PERLIN_THRESHOLD_2,
      this.contractConstants.PERLIN_THRESHOLD_3,
    ];
    const length = thresholds.length;
    const bordersLength = this.contractConstants.MAX_LEVEL_DIST.length;
    if (universeZone + 1 === bordersLength) {
      return SpaceType.NEBULA;
    }
    for (let i = 0; i < length; i++) {
      if (perlin < thresholds[i]) {
        return i as SpaceType;
      }
    }
    return length as SpaceType;
  }

  public _initLevel(
    locationId: LocationId,
    spaceType: SpaceType,
    universeZone: number,
  ): PlanetLevel {
    const levelBigInt = getBytesFromHex(locationId, 29, 32);
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
      this.contractConstants.SPACE_TYPE_PLANET_LEVEL_BONUS[Number(spaceType)];

    level += this.contractConstants.MIN_LEVEL_BIAS[universeZone];
    if (level < 0) {
      return PlanetLevel.ZERO;
    }

    let posLevel = level;

    const limit = Math.min(
      this.contractConstants.SPACE_TYPE_PLANET_LEVEL_LIMITS[Number(spaceType)],
      this.contractConstants.MAX_LEVEL_LIMIT[universeZone],
    );

    posLevel = Math.min(posLevel, limit);
    return posLevel as PlanetLevel;
  }

  public _initPlanetType(
    locationId: LocationId,
    spaceType: SpaceType,
    planetLevel: PlanetLevel,
  ): PlanetType {
    const levelBigInt = getBytesFromHex(locationId, 28, 29);
    const thresholds =
      this.contractConstants.PLANET_TYPE_WEIGHTS[Number(spaceType)][
        Number(planetLevel)
      ];
    const length = thresholds.length;
    let cumulativeThreshold = 0;
    for (let i = 0; i < length; i++) {
      cumulativeThreshold += thresholds[i];
      if (levelBigInt < bigInt(cumulativeThreshold)) {
        return i as PlanetType;
      }
    }
    return 0 as PlanetType;
  }

  public _initPopulationAndSilver(
    spaceType: SpaceType,
    planetType: PlanetType,
    planetLevel: PlanetLevel,
  ): [number, number] {
    const { PlanetInitialResource } = this.components;
    const key = encodeEntity(PlanetInitialResource.metadata.keySchema, {
      spaceType: Number(spaceType) + 1,
      planetType: planetType as number,
      level: planetLevel as number,
    });

    const planetInitialResource = getComponentValue(PlanetInitialResource, key);

    if (planetInitialResource === undefined) {
      throw Error("need planet initial resource");
    }

    return [
      Math.floor(Number(planetInitialResource.population) / CONTRACT_PRECISION),
      Math.floor(Number(planetInitialResource.silver) / CONTRACT_PRECISION),
    ];
  }

  public _doubleEnergyCap(locationId: LocationId): boolean {
    const rand = getBytesFromHex(locationId, 27, 28);
    return rand.toJSNumber() < 16 ? true : false;
  }

  public _doubleEnergyGrowth(locationId: LocationId): boolean {
    const rand = getBytesFromHex(locationId, 26, 27);
    return rand.toJSNumber() < 16 ? true : false;
  }

  public _doubleRange(locationId: LocationId): boolean {
    const rand = getBytesFromHex(locationId, 25, 26);
    return rand.toJSNumber() < 16 ? true : false;
  }

  public _doubleSpeed(locationId: LocationId): boolean {
    const rand = getBytesFromHex(locationId, 24, 25);
    return rand.toJSNumber() < 16 ? true : false;
  }

  public _doubleDefense(locationId: LocationId): boolean {
    const rand = getBytesFromHex(locationId, 23, 24);
    return rand.toJSNumber() < 16 ? true : false;
  }

  public _activateUpgrades(
    populationCap: number,
    populationGrowth: number,
    range: number,
    speed: number,
    defense: number,
    upgradeState: UpgradeState,
  ): [number, number, number, number, number] {
    const upgradeConfig = this.contractConstants.upgrades;
    let popCapMul = 1;
    let popGroMul = 1;
    let rangeMul = 1;
    let speedMul = 1;
    let defMul = 1;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < upgradeState[i]; j++) {
        const upgrade = upgradeConfig[i][j];
        popCapMul *= upgrade.energyCapMultiplier / 100;
        popGroMul *= upgrade.energyGroMultiplier / 100;
        rangeMul *= upgrade.rangeMultiplier / 100;
        speedMul *= upgrade.speedMultiplier / 100;
        defMul *= upgrade.defMultiplier / 100;
      }
    }
    return [
      populationCap * popCapMul,
      populationGrowth * popGroMul,
      range * rangeMul,
      speed * speedMul,
      defense * defMul,
    ];
  }

  private calculateSilverSpent(
    upgradeState: UpgradeState,
    silverCap: number,
  ): number {
    const upgradeCosts = [20, 40, 60, 80, 100];
    let totalUpgrades = 0;
    for (let i = 0; i < upgradeState.length; i++) {
      totalUpgrades += upgradeState[i];
    }
    let totalUpgradeCostPercent = 0;
    for (let i = 0; i < totalUpgrades; i++) {
      totalUpgradeCostPercent += upgradeCosts[i];
    }
    return (totalUpgradeCostPercent / 100) * silverCap;
  }
}