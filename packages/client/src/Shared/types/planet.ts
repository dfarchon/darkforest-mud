import type { Biome, SpaceType } from "./game_types";
import type { ArtifactId, EthAddress, LocationId } from "./identifier";
import type { TransactionCollection } from "./transaction";
import type { UpgradeState } from "./upgrade";
import type { Abstract } from "./utility";
import type { WorldLocation } from "./world";

/**
 * Abstract type representing a planet level.
 */
export type PlanetLevel = Abstract<number, "PlanetLevel">;

/**
 * Enumeration of the possible planet levels.
 */
export const PlanetLevel = {
  ZERO: 0 as PlanetLevel,
  ONE: 1 as PlanetLevel,
  TWO: 2 as PlanetLevel,
  THREE: 3 as PlanetLevel,
  FOUR: 4 as PlanetLevel,
  FIVE: 5 as PlanetLevel,
  SIX: 6 as PlanetLevel,
  SEVEN: 7 as PlanetLevel,
  EIGHT: 8 as PlanetLevel,
  NINE: 9 as PlanetLevel,
  // Don't forget to update MIN_PLANET_LEVEL and/or MAX_PLANET_LEVEL in the `constants` package
} as const;

/**
 * Mapping from PlanetLevel to pretty-printed names.
 */
export const PlanetLevelNames = {
  [PlanetLevel.ZERO]: "Level 0",
  [PlanetLevel.ONE]: "Level 1",
  [PlanetLevel.TWO]: "Level 2",
  [PlanetLevel.THREE]: "Level 3",
  [PlanetLevel.FOUR]: "Level 4",
  [PlanetLevel.FIVE]: "Level 5",
  [PlanetLevel.SIX]: "Level 6",
  [PlanetLevel.SEVEN]: "Level 7",
  [PlanetLevel.EIGHT]: "Level 8",
  [PlanetLevel.NINE]: "Level 9",
} as const;
/**
 * Abstract type representing a planet status.
 */
export type PlanetStatus = Abstract<number, "PlanetStatus">;

/**
 * Enumeration of the possible planet statuses.
 */
export const PlanetStatus = {
  DEFAULT: 0 as PlanetStatus,
  DESTROYED: 1 as PlanetStatus,
} as const;

/**
 * Mapping from PlanetStatus to pretty-printed names.
 */
export const PlanetStatusNames = {
  [PlanetStatus.DEFAULT]: "Default",
  [PlanetStatus.DESTROYED]: "Destroyed",
} as const;

/**
 * Abstract type representing a planet type.
 */
export type PlanetType = Abstract<number, "PlanetType">;

/**
 * Enumeration of the planet types. (PLANET = 0, SILVER_BANK = 4)
 */
export const PlanetType = {
  UNKNOWN: 0 as PlanetType,
  PLANET: 1 as PlanetType,
  SILVER_MINE: 2 as PlanetType,
  RUINS: 3 as PlanetType,
  TRADING_POST: 4 as PlanetType,
  SILVER_BANK: 5 as PlanetType,
} as const;

/**
 * Mapping from PlanetType to pretty-printed names.
 */
export const PlanetTypeNames = {
  [PlanetType.UNKNOWN]: "UNKNOWN",
  [PlanetType.PLANET]: "Planet",
  [PlanetType.SILVER_MINE]: "Asteroid Field",
  [PlanetType.RUINS]: "Foundry",
  [PlanetType.TRADING_POST]: "Spacetime Rip",
  [PlanetType.SILVER_BANK]: "Quasar",
} as const;
/**
 * Abstract type representing a planet flag type.
 */
export type PlanetFlagType = Abstract<number, "PlanetFlagType">;

/**
 * Enumeration of the planet flag types.
 */
export const PlanetFlagType = {
  EXPLORED: 0 as PlanetFlagType,
  OFFENSIVE_ARTIFACT: 1 as PlanetFlagType,
  DEFENSIVE_ARTIFACT: 2 as PlanetFlagType,
  PRODUCTIVE_ARTIFACT: 3 as PlanetFlagType,
  DESTROYED: 4 as PlanetFlagType,
} as const;

/**
 * Mapping from PlanetFlagType to pretty-printed names.
 */
export const PlanetFlagTypeNames = {
  [PlanetFlagType.EXPLORED]: "Explored",
  [PlanetFlagType.OFFENSIVE_ARTIFACT]: "Offensive Artifact",
  [PlanetFlagType.DEFENSIVE_ARTIFACT]: "Defensive Artifact",
  [PlanetFlagType.PRODUCTIVE_ARTIFACT]: "Productive Artifact",
  [PlanetFlagType.DESTROYED]: "Destroyed",
} as const;

/**
 * A list of five flags, indicating whether the planet has an attached comet
 * doubling each of five stats: (in order) [energyCap, energyGrowth, range,
 * speed, defense]
 */
export type PlanetBonus = [
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
];

/**
 * Abstract type representing an effect type.
 */
export type EffectType = Abstract<number, "EffectType">;

/**
 * Enumeration of the effect types.
 */
export const EffectType = {
  UNKNOWN: 0 as EffectType,
  STAT: 1 as EffectType,
  BEFORE_MOVE: 2 as EffectType,
  AFTER_MOVE: 3 as EffectType,
  BEFORE_ARRIVAL: 4 as EffectType,
  AFTER_ARRIVAL: 5 as EffectType,
} as const;

/**
 * Mapping from EffectType to pretty-printed names.
 */
export const EffectTypeNames = {
  [EffectType.UNKNOWN]: "Unknown",
  [EffectType.STAT]: "Stat",
  [EffectType.BEFORE_MOVE]: "Before Move",
  [EffectType.AFTER_MOVE]: "After Move",
  [EffectType.BEFORE_ARRIVAL]: "Before Arrival",
  [EffectType.AFTER_ARRIVAL]: "After Arrival",
} as const;

export type Effect = {
  artifactIndex: number;
  effectType: EffectType;
  id: number;
};

/**
 * Represents a Dark Forest planet object (planets, asteroid fields, quasars,
 * spacetime rips, and foundries). Note that some `Planet` fields (1) store
 * client-specific data that the blockchain is not aware of, such as
 * `unconfirmedDepartures` (tracks pending moves originating at this planet that
 * have been submitted to the blockchain from a client), or (2) store derived
 * data that is calculated separately client-side, such as `silverSpent` and
 * `bonus`. So this object does not cleanly map to any single object in the
 * DarkForest contract (or even any collection of objects).
 */
export type Planet = Readonly<{
  locationId: LocationId; //planetHash

  // planet properties
  biome: Biome;
  perlin: number;
  planetLevel: PlanetLevel;
  planetType: PlanetType;
  spaceType: SpaceType;

  owner: EthAddress; // should never be null; all unowned planets should have 0 address
  // hatLevel: number;
  // hatType: number;

  isHomePlanet: boolean; // NOTE: default is false
  destroyed: boolean;
  frozen: boolean;
  loadingServerState: boolean;
  isInContract: boolean;
  syncedWithContract: boolean;
  // needsServerRefresh: boolean;

  energy: number;
  energyCap: number;
  energyGrowth: number;
  energyGroDoublers: number;

  defense: number;
  range: number;
  speed: number;

  silverCap: number;
  silverGrowth: number;
  silver: number;
  silverSpent: number;
  silverGroDoublers: number;

  // spaceJunk: number;

  lastUpdated: number;
  upgradeState: UpgradeState;
  hasTriedFindingArtifact: boolean;
  prospectedBlockNumber?: number;
  heldArtifactIds: ArtifactId[];
  // adminProtect: boolean;
  // canShow: boolean;
  // localPhotoidUpgrade?: Upgrade;

  transactions?: TransactionCollection;
  // unconfirmedAddEmoji: boolean;
  // unconfirmedClearEmoji: boolean;

  emoji?: string;
  emojiBobAnimation?: DFAnimation;
  emojiZoopAnimation?: DFAnimation;
  emojiZoopOutAnimation?: DFStatefulAnimation<string>;

  // burnOperator?: EthAddress; //only record burn/pink operator
  // burnStartTimestamp?: number;
  // pinkOperator?: EthAddress;
  // kardashevOperator?: EthAddress;
  // kardashevTimestamp?: number;

  // messages?: PlanetMessage<unknown>[];

  bonus: PlanetBonus;
  // pausers: number;
  // invader?: EthAddress;
  // capturer?: EthAddress;
  // invadeStartBlock?: number;
  // universeZone: number;
  // distSquare: number;

  effects?: Effect[];
  flags?: bigint;
}>;

/**
 * A planet whose coordinates are known to the client.
 */
export type LocatablePlanet = Planet & {
  location: WorldLocation;
  biome: Biome;
};

/**
 * A structure with default stats of planets in nebula at corresponding levels. For
 * example, silverCap[4] refers to the default silver capacity of a level 4
 * planet in nebula with no modifiers.
 */
export interface PlanetDefaults {
  populationCap: number[];
  populationGrowth: number[];
  range: number[];
  speed: number[];
  defense: number[];
  silverGrowth: number[];
  silverCap: number[];
  barbarianPercentage: number[];
}

export class DFAnimation {
  private readonly _update: () => number;
  private _value: number;

  public constructor(update: () => number) {
    this._update = update;
    this._value = 0;
  }

  public update() {
    this._value = this._update();
  }

  public value() {
    return this._value;
  }
}

export class DFStatefulAnimation<T> extends DFAnimation {
  private readonly _state: T;

  public constructor(state: T, update: () => number) {
    super(update);
    this._state = state;
  }

  public state(): T {
    return this._state;
  }
}
