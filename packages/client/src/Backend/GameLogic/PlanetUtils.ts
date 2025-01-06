import { CONTRACT_PRECISION, EMPTY_ADDRESS } from "@df/constants";
import { getBytesFromHex } from "@df/hexgen";
import { TxCollection } from "@df/network";
import {
  address,
  artifactIdFromHexStr,
  locationIdToHexStr,
  validLocationHash,
} from "@df/serde";
import type {
  Effect,
  EffectType,
  EthAddress,
  LocatablePlanet,
  LocationId,
  Planet,
  PlanetBonus,
  PlanetType,
  UpgradeState,
  WorldLocation,
} from "@df/types";
import { Biome, PlanetFlagType, SpaceType } from "@df/types";
import { PlanetLevel } from "@df/types";
import { locationsRevealedMap } from "@df/world/locations";
import { getComponentValue } from "@latticexyz/recs";
import { encodeEntity } from "@latticexyz/store-sync/recs";
import type { ClientComponents } from "@mud/createClientComponents";
import bigInt from "big-integer";

import type { ContractConstants } from "../../_types/darkforest/api/ContractsAPITypes";

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

  public getPlanetById(planetId: LocationId): Planet | undefined {
    const { PlanetConstants } = this.components;
    const planetEntity = encodeEntity(PlanetConstants.metadata.keySchema, {
      id: locationIdToHexStr(planetId) as `0x${string}`,
    });
    const hasPlanetEntity = Boolean(
      getComponentValue(PlanetConstants, planetEntity),
    );

    return hasPlanetEntity
      ? // If planet is in contract, it is OK to input any value for perlin and distSquare
        this.readPlanet(planetId, 0, 0)
      : undefined;
  }

  public defaultPlanetFromLocation(location: WorldLocation): LocatablePlanet {
    const planetId = location.hash;
    const perlin = location.perlin;
    const distSquare = location.coords.x ** 2 + location.coords.y ** 2;
    const planet: Planet = this.readPlanet(planetId, perlin, distSquare);
    const biome = this.getBiome(location);

    return {
      location: location,
      biome: biome,
      locationId: planet.locationId,
      perlin: planet.perlin,
      spaceType: planet.spaceType,
      owner: planet.owner.toLowerCase() as EthAddress,
      planetLevel: planet.planetLevel,
      planetType: planet.planetType,
      isHomePlanet: false,
      energyCap: planet.energyCap,
      energyGrowth: planet.energyGrowth,

      silverCap: planet.silverCap,
      silverGrowth: planet.silverGrowth,

      range: planet.range,
      defense: planet.defense,
      speed: planet.speed,
      energy: planet.energy,
      silver: planet.silver,
      lastUpdated: planet.lastUpdated,
      upgradeState: planet.upgradeState,
      transactions: new TxCollection(),
      silverSpent: planet.silverSpent,
      isInContract: planet.isInContract,
      syncedWithContract: planet.syncedWithContract,

      bonus: planet.bonus,
      energyGroDoublers: planet.energyGroDoublers,
      silverGroDoublers: planet.silverGroDoublers,
      // universeZone: planet.universeZone,

      prospectedBlockNumber: planet.prospectedBlockNumber,
      hasTriedFindingArtifact: planet.hasTriedFindingArtifact,
      heldArtifactIds: planet.heldArtifactIds,
      destroyed: planet.destroyed,
      frozen: planet.frozen,
      effects: planet.effects,
      flags: planet.flags,
    };
  }

  public getBiome(location: WorldLocation): Biome {
    const { perlin, biomebase, coords } = location;
    const distSquare = coords.x ** 2 + coords.y ** 2;
    const universeZone = this._initZone(distSquare);
    const spaceType = this._initSpaceType(universeZone, perlin);

    if (spaceType === SpaceType.DEAD_SPACE) {
      return Biome.CORRUPTED;
    }

    let biome = 3 * (spaceType - 1);
    if (biomebase < this.contractConstants.BIOME_THRESHOLD_1) {
      biome += 1;
    } else if (biomebase < this.contractConstants.BIOME_THRESHOLD_2) {
      biome += 2;
    } else {
      biome += 3;
    }

    return biome as Biome;
  }

  /**
   *
   * @param planetId
   * @param perlin
   * @param distSquare
   * @returns
   */
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
      ProspectedPlanet,
      PlanetFlags,
      PlanetArtifact,
      PlanetEffects,
    } = this.components;

    const planetEntity = encodeEntity(PlanetConstants.metadata.keySchema, {
      id: locationIdToHexStr(planetId) as `0x${string}`,
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

      const ownerInContract = getComponentValue(PlanetOwner, planetEntity);

      owner = ownerInContract ? address(ownerInContract.value) : EMPTY_ADDRESS;
      owner = owner.toLowerCase() as EthAddress;

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
      const planetMedataKey = encodeEntity(PlanetMetadata.metadata.keySchema, {
        spaceType: spaceType,
        planetType: planetType,
        level: planetLevel,
      });

      const planetMetadata = getComponentValue(PlanetMetadata, planetMedataKey);
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

    const coordsRevealed = getComponentValue(RevealedPlanet, planetEntity);

    const prospectedPlanet = getComponentValue(ProspectedPlanet, planetEntity);

    const planetArtifact = getComponentValue(PlanetArtifact, planetEntity);

    const planetFlags = getComponentValue(PlanetFlags, planetEntity);

    const TWO_POW32 = 4294967296n;

    const artifactIds = [];
    if (planetArtifact) {
      let val = planetArtifact.artifacts;
      for (let i = 0; i < 8; i++) {
        const id = val % TWO_POW32;
        if (id === 0n) {
          break;
        }
        artifactIds.push(artifactIdFromHexStr(id.toString()));
        val /= TWO_POW32;
      }
    }

    const effects = getComponentValue(PlanetEffects, planetEntity);
    const planetEffects: Effect[] = [];
    if (effects) {
      const effectNum = effects.num;
      let effectsArray = effects.effects;
      for (let i = 0; i < effectNum; i++) {
        planetEffects[effectNum - 1 - i] = {
          artifactIndex: Number((effectsArray & 0xff0000n) >> 16n),
          effectType: Number((effectsArray & 0xff00n) >> 8n) as EffectType,
          id: Number(effectsArray & 0xffn),
        };
        effectsArray >>= 24n;
      }
    }

    // Check for effect 0x060200 and apply multipliers, it's a BEFORE_MOVE type effect of cannon
    if (planetEffects.length > 0) {
      for (const effect of planetEffects) {
        if (effect.artifactIndex === 0x06 && effect.effectType === 0x02) {
          range *= 2;
          if (effect.id === 0x00) {
            speed *= 5;
          } else if (effect.id === 0x01) {
            speed *= 10;
          } else if (effect.id === 0x02) {
            speed *= 15;
          } else if (effect.id === 0x03) {
            speed *= 20;
          } else if (effect.id === 0x04) {
            speed *= 25;
          }
          break;
        }
      }
    }

    if (coordsRevealed) {
      locationsRevealedMap.setLocationRevealed(
        planetId,
        coordsRevealed.revealer as EthAddress,
      );
    }

    return {
      locationId: planetId,
      isHomePlanet: false,
      syncedWithContract: true,
      perlin,
      owner,
      spaceType,
      planetType,
      planetLevel,
      // universeZone,
      distSquare,
      range,
      speed,
      defense,
      energy: population / CONTRACT_PRECISION,
      energyCap: populationCap / CONTRACT_PRECISION,
      energyGrowth: populationGrowth / CONTRACT_PRECISION,
      silver: silver / CONTRACT_PRECISION,
      silverCap: silverCap / CONTRACT_PRECISION,
      silverGrowth: silverGrowth / CONTRACT_PRECISION,
      upgradeState,
      lastUpdated: lastUpdateTick,
      isInContract,
      // coordsRevealed,
      silverSpent: this.calculateSilverSpent(upgradeState, silverCap),
      bonus,
      energyGroDoublers: 0,
      silverGroDoublers: 0,
      prospectedBlockNumber: prospectedPlanet
        ? Number(prospectedPlanet.blockNumber)
        : undefined,
      hasTriedFindingArtifact: planetFlags
        ? (planetFlags.flags & (1n << BigInt(PlanetFlagType.EXPLORED))) > 0n
        : false,
      heldArtifactIds: artifactIds,
      destroyed: planetFlags
        ? (planetFlags.flags & (1n << BigInt(PlanetFlagType.DESTROYED))) > 0n
        : false,
      frozen: false,
      effects: planetEffects,
      flags: planetFlags ? planetFlags.flags : 0n,
      transactions: new TxCollection(),
    };
  }

  public _validateHash(locationId: LocationId): boolean {
    return validLocationHash(locationId);
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
    for (let i = 0; i <= length; i++) {
      if (perlin < thresholds[i]) {
        return (i + 1) as SpaceType;
      }
    }
    return (length + 1) as SpaceType;
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
      this.contractConstants.SPACE_TYPE_PLANET_LEVEL_BONUS[
        Number(spaceType) - 1
      ];

    level += this.contractConstants.MIN_LEVEL_BIAS[universeZone];
    if (level < 0) {
      return PlanetLevel.ZERO;
    }

    let posLevel = level;

    const limit = Math.min(
      this.contractConstants.SPACE_TYPE_PLANET_LEVEL_LIMITS[
        Number(spaceType) - 1
      ],
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
    if (spaceType === SpaceType.UNKNOWN) {
      throw new Error("spaceType is unknown");
    }
    const thresholds =
      this.contractConstants.PLANET_TYPE_WEIGHTS[Number(spaceType) - 1][
        Number(planetLevel)
      ];
    const length = thresholds.length;
    let cumulativeThreshold = 0;
    for (let i = 0; i < length; i++) {
      cumulativeThreshold += thresholds[i];
      if (levelBigInt < bigInt(cumulativeThreshold)) {
        return (i + 1) as PlanetType;
      }
    }
    throw new Error("planetType is unknown");
  }

  public _initPopulationAndSilver(
    spaceType: SpaceType,
    planetType: PlanetType,
    planetLevel: PlanetLevel,
  ): [number, number] {
    const { PlanetInitialResource } = this.components;
    const key = encodeEntity(PlanetInitialResource.metadata.keySchema, {
      spaceType: spaceType as number,
      planetType: planetType as number,
      level: planetLevel as number,
    });

    const planetInitialResource = getComponentValue(PlanetInitialResource, key);

    if (planetInitialResource === undefined) {
      throw Error("need planet initial resource");
    }

    return [
      Math.floor(Number(planetInitialResource.population)),
      Math.floor(Number(planetInitialResource.silver)),
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
