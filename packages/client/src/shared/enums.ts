import { EthAddress, LocationId } from "./identifier";

export enum ResourceType {
  Energy = "Energy",
  Silver = "Silver",
}

export enum PlanetType {
  Planet = "Planet",
  AsteroidField = "AsteroidField",
  Ruins = "Ruins",
  TradingPost = "TradingPost",
  Quasar = "Quasar",
}
export const PlanetTypeNames = {
  [PlanetType.Planet]: "Planet",
  [PlanetType.AsteroidField]: "Asteroid Field",
  [PlanetType.Ruins]: "Foundry",
  [PlanetType.TradingPost]: "Spacetime Rip",
  [PlanetType.Quasar]: "Quasar",
} as const;

export type PlanetBonus = [boolean, boolean, boolean, boolean, boolean, boolean];

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

export type Planet = {
  locationId: LocationId;
  perlin: number;
  //  spaceType: SpaceType;
  owner: EthAddress; // should never be null; all unowned planets should have 0 address
  hatLevel: number;
  hatType: number;

  // planetLevel: PlanetLevel;
  planetType: PlanetType;
  isHomePlanet: boolean;

  energyCap: number;
  energyGrowth: number;

  silverCap: number;
  silverGrowth: number;

  range: number;
  defense: number;
  speed: number;

  energy: number;
  silver: number;

  spaceJunk: number;

  lastUpdated: number;
  //upgradeState: UpgradeState;
  hasTriedFindingArtifact: boolean;
  // heldArtifactIds: ArtifactId[];
  adminProtect: boolean;
  destroyed: boolean;
  frozen: boolean;
  canShow: boolean;
  prospectedBlockNumber?: number;
  //localPhotoidUpgrade?: Upgrade;

  //transactions?: TransactionCollection;
  unconfirmedAddEmoji: boolean;
  unconfirmedClearEmoji: boolean;
  loadingServerState: boolean;
  needsServerRefresh: boolean;
  lastLoadedServerState?: number;

  //emojiBobAnimation?: DFAnimation;
  // emojiZoopAnimation?: DFAnimation;
  //emojiZoopOutAnimation?: DFStatefulAnimation<string>;

  silverSpent: number;

  isInContract: boolean;
  syncedWithContract: boolean;
  coordsRevealed: boolean;
  revealer?: EthAddress;
  claimer?: EthAddress;
  burnOperator?: EthAddress; //only record burn/pink operator
  burnStartTimestamp?: number;
  pinkOperator?: EthAddress;
  kardashevOperator?: EthAddress;
  kardashevTimestamp?: number;

  // messages?: PlanetMessage<unknown>[];

  bonus: PlanetBonus;
  pausers: number;
  energyGroDoublers: number;
  silverGroDoublers: number;
  invader?: EthAddress;
  capturer?: EthAddress;
  invadeStartBlock?: number;
};

/**
 * A planet whose coordinates are known to the client.
 */
// export type LocatablePlanet = Planet & {
//   location: WorldLocation;
//   biome: Biome;
// };
