import {
  BLOCK_EXPLORER_URL,
  CONTRACT_PRECISION,
  EMPTY_ADDRESS,
  MIN_PLANET_LEVEL,
  PLANET_CLAIM_MIN_LEVEL,
} from "@df/constants";
import type { Monomitter, Subscription } from "@df/events";
import { monomitter } from "@df/events";
import {
  getRange,
  isActivated,
  isLocatable,
  isSpaceShip,
  timeUntilNextBroadcastAvailable,
} from "@df/gamelogic";
import { fakeHash, mimcHash, perlin } from "@df/hashing";
import type { EthConnection } from "@df/network";
import {
  createContract,
  ThrottledConcurrentQueue,
  verifySignature,
  weiToEth,
} from "@df/network";
import { getPlanetName } from "@df/procedural";
import {
  artifactIdToDecStr,
  isUnconfirmedActivateArtifactTx,
  isUnconfirmedBlueTx,
  isUnconfirmedBurnTx,
  isUnconfirmedBuyArtifactTx,
  isUnconfirmedBuyHatTx,
  isUnconfirmedBuyPlanetTx,
  isUnconfirmedBuySpaceshipTx,
  isUnconfirmedCapturePlanetTx,
  isUnconfirmedChangeArtifactImageTypeTx,
  isUnconfirmedClaimTx,
  isUnconfirmedDeactivateArtifactTx,
  isUnconfirmedDepositArtifactTx,
  isUnconfirmedDonateTx,
  isUnconfirmedFindArtifactTx,
  isUnconfirmedInitTx,
  isUnconfirmedInvadePlanetTx,
  isUnconfirmedKardashevTx,
  isUnconfirmedMoveTx,
  isUnconfirmedPinkTx,
  isUnconfirmedProspectPlanetTx,
  isUnconfirmedRefreshPlanetTx,
  isUnconfirmedRevealTx,
  isUnconfirmedUpgradeTx,
  isUnconfirmedWithdrawArtifactTx,
  isUnconfirmedWithdrawSilverTx,
  locationIdFromBigInt,
  locationIdToDecStr,
} from "@df/serde";
import type {
  Artifact,
  ArtifactId,
  Biome,
  BurnedCoords,
  BurnedLocation,
  CaptureZone,
  Chunk,
  ClaimedCoords,
  ClaimedLocation,
  Diagnostics,
  EthAddress,
  KardashevCoords,
  KardashevLocation,
  Link,
  LocatablePlanet,
  LocationId,
  NetworkHealthSummary,
  PinkZone,
  Planet,
  PlanetLevel,
  Player,
  QueuedArrival,
  Radii,
  Rectangle,
  RevealedCoords,
  RevealedLocation,
  SignedMessage,
  Transaction,
  TxIntent,
  UnconfirmedActivateArtifact,
  UnconfirmedBlue,
  UnconfirmedBurn,
  UnconfirmedBuyArtifact,
  UnconfirmedBuyHat,
  UnconfirmedBuyPlanet,
  UnconfirmedBuySpaceship,
  UnconfirmedCapturePlanet,
  UnconfirmedChangeArtifactImageType,
  UnconfirmedClaim,
  UnconfirmedDeactivateArtifact,
  UnconfirmedDepositArtifact,
  UnconfirmedDonate,
  UnconfirmedFindArtifact,
  UnconfirmedInit,
  UnconfirmedInvadePlanet,
  UnconfirmedKardashev,
  UnconfirmedMove,
  UnconfirmedPink,
  UnconfirmedPlanetTransfer,
  UnconfirmedProspectPlanet,
  UnconfirmedRefreshPlanet,
  UnconfirmedReveal,
  UnconfirmedUpgrade,
  UnconfirmedWithdrawArtifact,
  UnconfirmedWithdrawSilver,
  Upgrade,
  VoyageId,
  WorldCoords,
  WorldLocation,
} from "@df/types";
import {
  ArtifactRarity,
  ArtifactType,
  HatType,
  PlanetMessageType,
  PlanetType,
  Setting,
  SpaceType,
} from "@df/types";
import type { BigInteger } from "big-integer";
import bigInt from "big-integer";
import delay from "delay";
import type { Contract, ContractInterface, providers } from "ethers";
import { BigNumber } from "ethers";
import { EventEmitter } from "events";

import type {
  ContractConstants,
  MoveArgs,
} from "../../_types/darkforest/api/ContractsAPITypes";
import {
  ContractsAPIEvent,
  ZKArgIdx,
} from "../../_types/darkforest/api/ContractsAPITypes";
import type { AddressTwitterMap } from "../../_types/darkforest/api/UtilityServerAPITypes";
import type {
  BurnCountdownInfo,
  ClaimCountdownInfo,
  HashConfig,
  KardashevCountdownInfo,
  RevealCountdownInfo,
} from "../../_types/global/GlobalTypes";
import NotificationManager from "../../Frontend/Game/NotificationManager";
import { MIN_CHUNK_SIZE } from "../../Frontend/Utils/constants";
import type { Diff } from "../../Frontend/Utils/EmitterUtils";
import {
  generateDiffEmitter,
  getDisposableEmitter,
} from "../../Frontend/Utils/EmitterUtils";
import {
  getBooleanSetting,
  getNumberSetting,
  pollSetting,
  setBooleanSetting,
  setSetting,
  settingChanged$,
} from "../../Frontend/Utils/SettingsHooks";
import { TerminalTextStyle } from "../../Frontend/Utils/TerminalTypes";
import UIEmitter from "../../Frontend/Utils/UIEmitter";
import type { TerminalHandle } from "../../Frontend/Views/Terminal";
import MinerManager, {
  HomePlanetMinerChunkStore,
  MinerManagerEvent,
} from "../Miner/MinerManager";
import type { MiningPattern } from "../Miner/MiningPatterns";
import {
  SpiralPattern,
  SwissCheesePattern,
  TowardsCenterPattern,
  TowardsCenterPatternV2,
} from "../Miner/MiningPatterns";
import {
  addMessage,
  deleteMessages,
  getMessagesOnPlanets,
} from "../Network/MessageAPI";
import {
  disconnectTwitter,
  getAllTwitters,
  verifyTwitterHandle,
} from "../Network/UtilityServerAPI";
import type { SerializedPlugin } from "../Plugins/SerializedPlugin";
import PersistentChunkStore from "../Storage/PersistentChunkStore";
import { easeInAnimation, emojiEaseOutAnimation } from "../Utils/Animation";
import SnarkArgsHelper from "../Utils/SnarkArgsHelper";
import { hexifyBigIntNestedArray } from "../Utils/Utils";
import { getEmojiMessage } from "./ArrivalUtils";
import type { CaptureZonesGeneratedEvent } from "./CaptureZoneGenerator";
import { CaptureZoneGenerator } from "./CaptureZoneGenerator";
import type { ContractsAPI } from "./ContractsAPI";
import { makeContractsAPI } from "./ContractsAPI";
import { GameObjects } from "./GameObjects";
import { InitialGameStateDownloader } from "./InitialGameStateDownloader";

export enum GameManagerEvent {
  PlanetUpdate = "PlanetUpdate",
  DiscoveredNewChunk = "DiscoveredNewChunk",
  InitializedPlayer = "InitializedPlayer",
  InitializedPlayerError = "InitializedPlayerError",
  ArtifactUpdate = "ArtifactUpdate",
  Moved = "Moved",
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class GameManager extends EventEmitter {
  /**
   * This variable contains the internal state of objects that live in the game world.
   */
  private readonly entityStore: GameObjects;

  /**
   * Kind of hacky, but we store a reference to the terminal that the player sees when the initially
   * load into the game. This is the same exact terminal that appears inside the collapsable right
   * bar of the game.
   */
  private readonly terminal: React.MutableRefObject<TerminalHandle | undefined>;

  /**
   * The ethereum address of the player who is currently logged in. We support 'no account',
   * represented by `undefined` in the case when you want to simply load the game state from the
   * contract and view it without be able to make any moves.
   */
  private readonly account: EthAddress | undefined;

  /**
   * Map from ethereum addresses to player objects. This isn't stored in {@link GameObjects},
   * because it's not techincally an entity that exists in the world. A player just controls planets
   * and artifacts that do exist in the world.
   *
   * @todo move this into a new `Players` class.
   */
  private readonly players: Map<string, Player>;

  /**
   * Allows us to make contract calls, and execute transactions. Be careful about how you use this
   * guy. You don't want to cause your client to send an excessive amount of traffic to whatever
   * node you're connected to.
   *
   * Interacting with the blockchain isn't free, and we need to be mindful about about the way our
   * application interacts with the blockchain. The current rate limiting strategy consists of three
   * points:
   *
   * - data that needs to be fetched often should be fetched in bulk.
   * - rate limit smart contract calls (reads from the blockchain), implemented by
   *   {@link ContractCaller} and transactions (writes to the blockchain on behalf of the player),
   *   implemented by {@link TxExecutor} via two separately tuned {@link ThrottledConcurrentQueue}s.
   */
  private readonly contractsAPI: ContractsAPI;

  /**
   * An object that syncs any newly added or deleted chunks to the player's IndexedDB.
   *
   * @todo it also persists other game data to IndexedDB. This class needs to be renamed `GameSaver`
   * or something like that.
   */
  private readonly persistentChunkStore: PersistentChunkStore;

  /**
   * Responsible for generating snark proofs.
   */
  private readonly snarkHelper: SnarkArgsHelper;

  /**
   * In debug builds of the game, we can connect to a set of contracts deployed to a local
   * blockchain, which are tweaked to not verify planet hashes, meaning we can use a faster hash
   * function with similar properties to mimc. This allows us to mine the map faster in debug mode.
   *
   * @todo move this into a separate `GameConfiguration` class.
   */
  private readonly useMockHash: boolean;

  /**
   * Game parameters set by the contract. Stuff like perlin keys, which are important for mining the
   * correct universe, or the time multiplier, which allows us to tune how quickly voyages go.
   *
   * @todo move this into a separate `GameConfiguration` class.
   */
  private readonly contractConstants: ContractConstants;

  private paused: boolean;

  private halfPrice: boolean;

  /**
   * @todo change this to the correct timestamp each round.
   */
  private readonly endTimeSeconds: number = 1715526000;
  //1948939200; // new Date("2031-10-05T04:00:00.000Z").getTime() / 1000

  /**
   * An interface to the blockchain that is a little bit lower-level than {@link ContractsAPI}. It
   * allows us to do basic operations such as wait for a transaction to complete, check the player's
   * address and balance, etc.
   */
  private readonly ethConnection: EthConnection;

  /**
   * Each round we change the hash configuration of the game. The hash configuration is download
   * from the blockchain, and essentially acts as a salt, permuting the universe into a unique
   * configuration for each new round.
   *
   * @todo deduplicate this and `useMockHash` somehow.
   */
  private readonly hashConfig: HashConfig;

  /**
   * The aforementioned hash function. In debug mode where `DISABLE_ZK_CHECKS` is on, we use a
   * faster hash function. Othewise, in production mode, use MiMC hash (https://byt3bit.github.io/primesym/).
   */
  private readonly planetHashMimc: (...inputs: number[]) => BigInteger;

  /**
   * Whenever we refresh the players twitter accounts or scores, we publish an event here.
   */
  public readonly playersUpdated$: Monomitter<void>;

  /**
   * Handle to an interval that periodically uploads diagnostic information from this client.
   */
  // private diagnosticsInterval: ReturnType<typeof setInterval>;

  /**
   * Handle to an interval that periodically refreshes some information about the player from the
   * blockchain.
   *
   * @todo move this into a new `PlayerState` class.
   */
  private playerInterval: ReturnType<typeof setInterval>;

  /**
   * Handle to an interval that periodically refreshes the scoreboard from our webserver.
   */
  private scoreboardInterval: ReturnType<typeof setInterval>;

  /**
   * Handle to an interval that periodically refreshes the network's health from our webserver.
   */
  // private networkHealthInterval: ReturnType<typeof setInterval>;

  /**
   * Handle to an interval that periodically refreshes pinkZones.
   */
  private pinkZoneInterval: ReturnType<typeof setInterval>;

  /**
   * Handle to an interval that periodically refreshes blueZones.
   */
  private blueZoneInterval: ReturnType<typeof setInterval>;

  /**
   * Manages the process of mining new space territory.
   */
  private minerManager?: MinerManager;

  /**
   * Continuously updated value representing the total hashes per second that the game is currently
   * mining the universe at.
   *
   * @todo keep this in {@link MinerManager}
   */
  private hashRate: number;

  /**
   * The spawn location of the current player.
   *
   * @todo, make this smarter somehow. It's really annoying to have to import world coordinates, and
   * get them wrong or something. Maybe we need to mark a planet, once it's been initialized
   * contract-side, as the homeworld of the user who initialized on it. That way, when you import a
   * new account into the game, and you import map data that contains your home planet, the client
   * would be able to automatically detect which planet is the player's home planet.
   *
   * @todo move this into a new `PlayerState` class.
   */
  private homeLocation: WorldLocation | undefined;

  /**
   * Sometimes the universe gets bigger... Sometimes it doesn't.
   *
   * @todo move this into a new `GameConfiguration` class.
   */
  private worldRadius: number;

  /**
   * Emits whenever we load the network health summary from the webserver, which is derived from
   * diagnostics that the client sends up to the webserver as well.
   */
  public networkHealth$: Monomitter<NetworkHealthSummary>;

  public paused$: Monomitter<boolean>;

  public halfPrice$: Monomitter<boolean>;

  /**
   * Diagnostic information about the game.
   */
  private diagnostics: Diagnostics;

  /**
   * Subscription to act on setting changes
   */
  private settingsSubscription: Subscription | undefined;

  /**
   * Setting to allow players to start game without plugins that were running during the previous
   * run of the game client. By default, the game launches plugins that were running that were
   * running when the game was last closed.
   */
  private safeMode: boolean;

  public get planetRarity(): number {
    return this.contractConstants.PLANET_RARITY;
  }

  /**
   * Generates capture zones.
   */
  private captureZoneGenerator: CaptureZoneGenerator | undefined;

  private constructor(
    terminal: React.MutableRefObject<TerminalHandle | undefined>,
    account: EthAddress | undefined,
    players: Map<string, Player>,
    touchedPlanets: Map<LocationId, Planet>,
    allTouchedPlanetIds: Set<LocationId>,
    revealedCoords: Map<LocationId, RevealedCoords>,
    claimedCoords: Map<LocationId, ClaimedCoords>,
    burnedCoords: Map<LocationId, BurnedCoords>,
    kardashevCoords: Map<LocationId, KardashevCoords>,
    worldRadius: number,
    unprocessedArrivals: Map<VoyageId, QueuedArrival>,
    unprocessedPlanetArrivalIds: Map<LocationId, VoyageId[]>,
    contractsAPI: ContractsAPI,
    contractConstants: ContractConstants,
    persistentChunkStore: PersistentChunkStore,
    snarkHelper: SnarkArgsHelper,
    homeLocation: WorldLocation | undefined,
    useMockHash: boolean,
    artifacts: Map<ArtifactId, Artifact>,
    ethConnection: EthConnection,
    paused: boolean,
    halfPrice: boolean,
  ) {
    super();

    this.diagnostics = {
      rpcUrl: "unknown",
      totalPlanets: 0,
      visiblePlanets: 0,
      visibleChunks: 0,
      fps: 0,
      chunkUpdates: 0,
      callsInQueue: 0,
      totalCalls: 0,
      totalTransactions: 0,
      transactionsInQueue: 0,
      totalChunks: 0,
      width: 0,
      height: 0,
    };
    this.terminal = terminal;
    this.account = account;
    this.players = players;
    this.worldRadius = worldRadius;
    this.networkHealth$ = monomitter(true);
    this.paused$ = monomitter(true);
    this.halfPrice$ = monomitter(true);
    this.playersUpdated$ = monomitter();

    if (contractConstants.CAPTURE_ZONES_ENABLED) {
      this.captureZoneGenerator = new CaptureZoneGenerator(
        this,
        contractConstants.GAME_START_BLOCK,
        contractConstants.CAPTURE_ZONE_CHANGE_BLOCK_INTERVAL,
      );
    }

    this.hashConfig = {
      planetHashKey: contractConstants.PLANETHASH_KEY,
      spaceTypeKey: contractConstants.SPACETYPE_KEY,
      biomebaseKey: contractConstants.BIOMEBASE_KEY,
      perlinLengthScale: contractConstants.PERLIN_LENGTH_SCALE,
      perlinMirrorX: contractConstants.PERLIN_MIRROR_X,
      perlinMirrorY: contractConstants.PERLIN_MIRROR_Y,
      planetRarity: contractConstants.PLANET_RARITY,
    };
    this.planetHashMimc = useMockHash
      ? fakeHash(this.hashConfig.planetRarity)
      : mimcHash(this.hashConfig.planetHashKey);

    this.contractConstants = contractConstants;
    this.homeLocation = homeLocation;

    const revealedLocations = new Map<LocationId, RevealedLocation>();
    for (const [locationId, coords] of revealedCoords) {
      const planet = touchedPlanets.get(locationId);
      if (planet) {
        const location: WorldLocation = {
          hash: locationId,
          coords,
          perlin: planet.perlin,
          biomebase: this.biomebasePerlin(coords, true),
        };
        revealedLocations.set(locationId, {
          ...location,
          revealer: coords.revealer,
        });
      }
    }

    const claimedLocations = new Map<LocationId, ClaimedLocation>();

    for (const [locationId, coords] of claimedCoords) {
      const planet = touchedPlanets.get(locationId);

      if (planet) {
        const location: WorldLocation = {
          hash: locationId,
          coords,
          perlin: planet.perlin,
          biomebase: this.biomebasePerlin(coords, true),
        };

        const revealedLocation = { ...location, revealer: coords.claimer };

        revealedLocations.set(locationId, revealedLocation);
        const claimedLocation = { ...location, claimer: coords.claimer };
        claimedLocations.set(locationId, claimedLocation);
      }
    }

    const burnedLocations = new Map<LocationId, BurnedLocation>();

    for (const [locationId, coords] of burnedCoords) {
      const planet = touchedPlanets.get(locationId);

      if (planet) {
        const location: WorldLocation = {
          hash: locationId,
          coords,
          perlin: planet.perlin,
          biomebase: this.biomebasePerlin(coords, true),
        };

        const revealedLocation = { ...location, revealer: coords.operator };
        revealedLocations.set(locationId, revealedLocation);
        const burnedLocation = {
          ...location,
          operator: coords.operator,
          radius:
            this.getContractConstants().BURN_PLANET_LEVEL_EFFECT_RADIUS[
              planet.planetLevel
            ],
        };
        burnedLocations.set(locationId, burnedLocation);
      }
    }

    const kardashevLocations = new Map<LocationId, KardashevLocation>();
    for (const [locationId, coords] of kardashevCoords) {
      const planet = touchedPlanets.get(locationId);
      if (planet) {
        const location: WorldLocation = {
          hash: locationId,
          coords,
          perlin: planet.perlin,
          biomebase: this.biomebasePerlin(coords, true),
        };
        const revealedLocation = { ...location, revealer: coords.operator };
        revealedLocations.set(locationId, revealedLocation);

        const kardashevLocation = {
          ...location,
          operator: coords.operator,
          radius:
            this.getContractConstants().KARDASHEV_EFFECT_RADIUS[
              planet.planetLevel
            ],
        };
        kardashevLocations.set(locationId, kardashevLocation);
      }
    }

    this.entityStore = new GameObjects(
      account,
      touchedPlanets,
      allTouchedPlanetIds,
      revealedLocations,
      claimedLocations,
      burnedLocations,
      kardashevLocations,
      artifacts,
      persistentChunkStore.allChunks(),
      unprocessedArrivals,
      unprocessedPlanetArrivalIds,
      contractConstants,
      worldRadius,
    );

    this.contractsAPI = contractsAPI;
    this.persistentChunkStore = persistentChunkStore;
    this.snarkHelper = snarkHelper;
    this.useMockHash = useMockHash;
    this.paused = paused;
    this.halfPrice = halfPrice;

    this.ethConnection = ethConnection;
    // NOTE: event
    // this.diagnosticsInterval = setInterval(this.uploadDiagnostics.bind(this), 10_000);
    this.scoreboardInterval = setInterval(
      this.refreshScoreboard.bind(this),
      10_000,
    );

    //NOTE: network health
    // this.networkHealthInterval = setInterval(this.refreshNetworkHealth.bind(this), 10_000);
    this.pinkZoneInterval = setInterval(
      this.hardRefreshPinkZones.bind(this),
      10_000,
    );
    this.blueZoneInterval = setInterval(
      this.hardRefreshBlueZones.bind(this),
      10_000,
    );
    this.playerInterval = setInterval(() => {
      if (this.account) {
        this.hardRefreshPlayer(this.account);
        this.hardRefreshPlayerSpaceships(this.account);
      }
    }, 10_000);

    this.hashRate = 0;

    this.settingsSubscription = settingChanged$.subscribe(
      (setting: Setting) => {
        if (setting === Setting.MiningCores) {
          if (this.minerManager) {
            const config = {
              contractAddress: this.getContractAddress(),
              account: this.account,
            };
            const cores = getNumberSetting(config, Setting.MiningCores);
            this.minerManager.setCores(cores);
          }
        }
      },
    );

    this.refreshScoreboard();
    // NOTE: network health
    // this.refreshNetworkHealth();
    this.hardRefreshPinkZones();
    this.hardRefreshBlueZones();
    this.getSpaceships();

    this.safeMode = false;
  }

  // private async uploadDiagnostics() {
  //   // eventLogger.logEvent(EventType.Diagnostics, this.diagnostics);
  // }

  // private async refreshNetworkHealth() {
  //   try {
  //     this.networkHealth$.publish(await loadNetworkHealth());
  //   } catch (e) {
  //     // @todo - what do we do if we can't connect to the webserver
  //     console.error(e);
  //   }
  // }

  private async refreshScoreboard() {
    if (process.env.LEADER_BOARD_URL) {
      // try {
      //   const leaderboard = await loadLeaderboard();
      //   for (const entry of leaderboard.entries) {
      //     const player = this.players.get(entry.ethAddress);
      //     if (player) {
      //       // current player's score is updated via `this.playerInterval`
      //       if (player.address !== this.account && entry.score !== undefined) {
      //         player.score = entry.score;
      //       }
      //     }
      //   }
      //   this.playersUpdated$.publish();
      // } catch (e) {
      //   // @todo - what do we do if we can't connect to the webserver? in general this should be a
      //   // valid state of affairs because arenas is a thing.
      // }
    } else {
      try {
        //myTodo: use claimedLocations
        // const claimedLocations = this.getClaimedLocations();
        // const cntMap = new Map<string, number>();
        // for (const claimedLocation of claimedLocations) {
        //   const claimer = claimedLocation.claimer;
        //   const score = claimedLocation.score;
        //   const player = this.players.get(claimer);
        //   if (player === undefined) continue;
        //   let cnt = cntMap.get(claimer);
        //   if (cnt === undefined) cnt = 0;
        //   if (cnt === 0) player.score = score;
        // }

        const knownScoringPlanets = [];
        for (const planet of this.getAllPlanets()) {
          if (!isLocatable(planet)) continue;
          if (planet.destroyed || planet.frozen) continue;
          if (planet.planetLevel < 3) continue;
          if (!planet?.location?.coords) continue;
          if (planet.claimer === EMPTY_ADDRESS) continue;
          if (planet.claimer === undefined) continue;
          knownScoringPlanets.push({
            locationId: planet.locationId,
            claimer: planet.claimer,
            score: Math.floor(
              this.getDistCoords(planet.location.coords, { x: 0, y: 0 }),
            ),
          });
        }

        // console.log('knownScoringPlanets');
        // console.log(knownScoringPlanets);

        const cntMap = new Map<string, number>();
        const haveScorePlayersMap = new Map<string, boolean>();

        for (const planet of knownScoringPlanets) {
          const claimer = planet.claimer;
          if (claimer === undefined) continue;
          const player = this.players.get(claimer);
          if (player === undefined) continue;

          const cnt = cntMap.get(claimer);
          let cntNextValue = undefined;

          if (cnt === undefined || cnt === 0) {
            cntNextValue = 1;
          } else {
            cntNextValue = cnt + 1;
          }
          cntMap.set(claimer, cntNextValue);

          if (player.score === undefined || cntNextValue === 1) {
            player.score = planet.score;
            haveScorePlayersMap.set(claimer, true);
          } else {
            player.score = Math.min(player.score, planet.score);
            haveScorePlayersMap.set(claimer, true);
          }
        }
        for (const playerItem of this.getAllPlayers()) {
          const result = haveScorePlayersMap.get(playerItem.address);

          const player = this.players.get(playerItem.address);
          if (player === undefined) continue;

          if (result === false || result === undefined) {
            player.score = undefined;
          }
        }

        this.playersUpdated$.publish();
      } catch (e) {
        // @todo - what do we do if we can't connect to the webserver? in general this should be a
        // valid state of affairs because arenas is a thing.
      }
    }
  }

  public getEthConnection() {
    return this.ethConnection;
  }

  public destroy(): void {
    // removes singletons of ContractsAPI, LocalStorageManager, MinerManager
    if (this.minerManager) {
      this.minerManager.removeAllListeners(
        MinerManagerEvent.DiscoveredNewChunk,
      );
      this.minerManager.destroy();
    }
    this.contractsAPI.destroy();
    this.persistentChunkStore.destroy();
    clearInterval(this.playerInterval);
    // NOTE: event
    // clearInterval(this.diagnosticsInterval);
    clearInterval(this.scoreboardInterval);
    // NOTE: network health
    // clearInterval(this.networkHealthInterval);
    clearInterval(this.pinkZoneInterval);
    clearInterval(this.blueZoneInterval);
    this.settingsSubscription?.unsubscribe();
  }

  static async create({
    connection,
    terminal,
    contractAddress,
    spectate = false,
  }: {
    connection: EthConnection;
    terminal: React.MutableRefObject<TerminalHandle | undefined>;
    contractAddress: EthAddress;
    spectate: boolean;
  }): Promise<GameManager> {
    if (!terminal.current) {
      throw new Error("you must pass in a handle to a terminal");
    }

    const account = spectate
      ? <EthAddress>"0x0000000000000000000000000000000000000001"
      : connection.getAddress();

    if (!account) {
      throw new Error("no account on eth connection");
    }

    const gameStateDownloader = new InitialGameStateDownloader(
      terminal.current,
    );
    const contractsAPI = await makeContractsAPI({
      connection,
      contractAddress,
    });

    terminal.current?.println("Loading game data from disk...");

    const persistentChunkStore = await PersistentChunkStore.create({
      account,
      contractAddress,
    });

    terminal.current?.println("Downloading data from Ethereum blockchain...");
    terminal.current?.println(
      "(the contract is very big. this may take a while)",
    );
    terminal.current?.newline();

    const initialState = await gameStateDownloader.download(
      contractsAPI,
      persistentChunkStore,
    );

    const possibleHomes = await persistentChunkStore.getHomeLocations();

    terminal.current?.println("");
    terminal.current?.println("Building Index...");

    await persistentChunkStore.saveTouchedPlanetIds(
      initialState.allTouchedPlanetIds,
    );
    await persistentChunkStore.saveRevealedCoords(
      initialState.allRevealedCoords,
    );
    await persistentChunkStore.saveClaimedCoords(initialState.allClaimedCoords);

    const knownArtifacts: Map<ArtifactId, Artifact> = new Map();

    for (let i = 0; i < initialState.loadedPlanets.length; i++) {
      const planet = initialState.touchedAndLocatedPlanets.get(
        initialState.loadedPlanets[i],
      );

      if (!planet) {
        continue;
      }

      planet.heldArtifactIds = initialState.heldArtifacts[i].map((a) => a.id);

      for (const heldArtifact of initialState.heldArtifacts[i]) {
        knownArtifacts.set(heldArtifact.id, heldArtifact);
      }
    }

    for (const myArtifact of initialState.myArtifacts) {
      knownArtifacts.set(myArtifact.id, myArtifact);
    }

    for (const artifact of initialState.artifactsOnVoyages) {
      knownArtifacts.set(artifact.id, artifact);
    }

    // figure out what's my home planet
    let homeLocation: WorldLocation | undefined = undefined;
    for (const loc of possibleHomes) {
      if (initialState.allTouchedPlanetIds.includes(loc.hash)) {
        homeLocation = loc;
        await persistentChunkStore.confirmHomeLocation(loc);
        break;
      }
    }

    const hashConfig: HashConfig = {
      planetHashKey: initialState.contractConstants.PLANETHASH_KEY,
      spaceTypeKey: initialState.contractConstants.SPACETYPE_KEY,
      biomebaseKey: initialState.contractConstants.BIOMEBASE_KEY,
      perlinLengthScale: initialState.contractConstants.PERLIN_LENGTH_SCALE,
      perlinMirrorX: initialState.contractConstants.PERLIN_MIRROR_X,
      perlinMirrorY: initialState.contractConstants.PERLIN_MIRROR_Y,
      planetRarity: initialState.contractConstants.PLANET_RARITY,
    };

    const useMockHash = initialState.contractConstants.DISABLE_ZK_CHECKS;
    const snarkHelper = SnarkArgsHelper.create(
      hashConfig,
      terminal,
      useMockHash,
    );

    const gameManager = new GameManager(
      terminal,
      account,
      initialState.players,
      initialState.touchedAndLocatedPlanets,
      new Set(Array.from(initialState.allTouchedPlanetIds)),
      initialState.revealedCoordsMap,
      initialState.claimedCoordsMap
        ? initialState.claimedCoordsMap
        : new Map<LocationId, ClaimedCoords>(),
      initialState.burnedCoordsMap
        ? initialState.burnedCoordsMap
        : new Map<LocationId, BurnedCoords>(),

      initialState.kardashevCoordsMap
        ? initialState.kardashevCoordsMap
        : new Map<LocationId, KardashevCoords>(),

      initialState.worldRadius,
      initialState.arrivals,
      initialState.planetVoyageIdMap,
      contractsAPI,
      initialState.contractConstants,
      persistentChunkStore,
      snarkHelper,
      homeLocation,
      useMockHash,
      knownArtifacts,
      connection,
      initialState.paused,
      initialState.halfPrice,
    );

    gameManager.setPlayerTwitters(initialState.twitters);

    const config = {
      contractAddress,
      account: gameManager.getAccount(),
    };
    pollSetting(config, Setting.AutoApproveNonPurchaseTransactions);

    persistentChunkStore.setDiagnosticUpdater(gameManager);
    contractsAPI.setDiagnosticUpdater(gameManager);

    // important that this happens AFTER we load the game state from the blockchain. Otherwise our
    // 'loading game state' contract calls will be competing with events from the blockchain that
    // are happening now, which makes no sense.
    contractsAPI.setupEventListeners();

    // get twitter handles
    gameManager.refreshTwitters();

    gameManager.listenForNewBlock();

    // set up listeners: whenever ContractsAPI reports some game state update, do some logic
    gameManager.contractsAPI
      .on(ContractsAPIEvent.ArtifactUpdate, async (artifactId: ArtifactId) => {
        await gameManager.hardRefreshArtifact(artifactId);
        gameManager.emit(GameManagerEvent.ArtifactUpdate, artifactId);
      })
      .on(
        ContractsAPIEvent.PlanetTransferred,
        async (planetId: LocationId, newOwner: EthAddress) => {
          await gameManager.hardRefreshPlanet(planetId);
          const planetAfter = gameManager.getPlanetWithId(planetId);

          if (planetAfter && newOwner === gameManager.account) {
            NotificationManager.getInstance().receivedPlanet(planetAfter);
          }
        },
      )
      .on(ContractsAPIEvent.PlayerUpdate, async (playerId: EthAddress) => {
        await gameManager.hardRefreshPlayer(playerId);
      })
      .on(ContractsAPIEvent.PauseStateChanged, async (paused: boolean) => {
        gameManager.paused = paused;
        gameManager.paused$.publish(paused);
      })
      .on(ContractsAPIEvent.HalfPriceChanged, async (halfPrice: boolean) => {
        gameManager.halfPrice = halfPrice;
        gameManager.halfPrice$.publish(halfPrice);
      })
      .on(ContractsAPIEvent.PlanetUpdate, async (planetId: LocationId) => {
        // don't reload planets that you don't have in your map. once a planet
        // is in your map it will be loaded from the contract.
        const localPlanet = gameManager.entityStore.getPlanetWithId(planetId);
        if (localPlanet && isLocatable(localPlanet)) {
          await gameManager.hardRefreshPlanet(planetId);
          gameManager.emit(GameManagerEvent.PlanetUpdate);
        }
      })
      .on(
        ContractsAPIEvent.ArrivalQueued,
        async (_arrivalId: VoyageId, fromId: LocationId, toId: LocationId) => {
          // only reload planets if the toPlanet is in the map
          const localToPlanet = gameManager.entityStore.getPlanetWithId(toId);
          if (localToPlanet && isLocatable(localToPlanet)) {
            await gameManager.bulkHardRefreshPlanets([fromId, toId]);
            gameManager.emit(GameManagerEvent.PlanetUpdate);
          }
        },
      )
      .on(
        ContractsAPIEvent.LocationRevealed,
        async (planetId: LocationId, _revealer: EthAddress) => {
          // TODO: hook notifs or emit event to UI if you want
          await gameManager.hardRefreshPlanet(planetId);
          gameManager.emit(GameManagerEvent.PlanetUpdate);
        },
      )
      .on(
        ContractsAPIEvent.LocationClaimed,
        async (planetId: LocationId, _revealer: EthAddress) => {
          // TODO: hook notifs or emit event to UI if you want

          // console.log('[testInfo]: ContractsAPIEvent.LocationClaimed');
          await gameManager.hardRefreshPlanet(planetId);
          gameManager.emit(GameManagerEvent.PlanetUpdate);
        },
      )

      .on(ContractsAPIEvent.TxQueued, (tx: Transaction) => {
        gameManager.entityStore.onTxIntent(tx);
      })
      .on(ContractsAPIEvent.TxSubmitted, (tx: Transaction) => {
        gameManager.persistentChunkStore.onEthTxSubmit(tx);
        gameManager.onTxSubmit(tx);
      })
      .on(ContractsAPIEvent.TxConfirmed, async (tx: Transaction) => {
        if (!tx.hash) return; // this should never happen
        gameManager.persistentChunkStore.onEthTxComplete(tx.hash);

        if (isUnconfirmedRevealTx(tx)) {
          await gameManager.hardRefreshPlanet(tx.intent.locationId);
        } else if (isUnconfirmedBurnTx(tx)) {
          await gameManager.hardRefreshPlanet(tx.intent.locationId);
          await gameManager.hardRefreshPinkZones();
        } else if (isUnconfirmedPinkTx(tx)) {
          await gameManager.hardRefreshPlanet(tx.intent.locationId);
        } else if (isUnconfirmedKardashevTx(tx)) {
          await gameManager.hardRefreshPlanet(tx.intent.locationId);
          await gameManager.hardRefreshBlueZones();
        } else if (isUnconfirmedBlueTx(tx)) {
          const centerPlanetId = gameManager.getBlueZoneCenterPlanetId(
            tx.intent.locationId,
          );
          if (centerPlanetId) {
            await gameManager.bulkHardRefreshPlanets([
              tx.intent.locationId,
              centerPlanetId,
            ]);
          } else {
            // notice: this should never happen
            await gameManager.bulkHardRefreshPlanets([tx.intent.locationId]);
          }

          gameManager.emit(GameManagerEvent.PlanetUpdate);
        } else if (isUnconfirmedInitTx(tx)) {
          terminal.current?.println("Loading Home Planet from Blockchain...");
          const retries = 5;
          for (let i = 0; i < retries; i++) {
            const planet = await gameManager.contractsAPI.getPlanetById(
              tx.intent.locationId,
            );
            if (planet) {
              break;
            } else if (i === retries - 1) {
              console.error("couldn't load player's home planet");
            } else {
              await delay(2000);
            }
          }
          await gameManager.hardRefreshPlanet(tx.intent.locationId);
          // mining manager should be initialized already via joinGame, but just in case...
          gameManager.initMiningManager(tx.intent.location.coords, 4);
        } else if (isUnconfirmedMoveTx(tx)) {
          const promises = [
            gameManager.bulkHardRefreshPlanets([tx.intent.from, tx.intent.to]),
          ];
          if (tx.intent.artifact) {
            promises.push(gameManager.hardRefreshArtifact(tx.intent.artifact));
          }
          await Promise.all(promises);
        } else if (isUnconfirmedUpgradeTx(tx)) {
          await gameManager.hardRefreshPlanet(tx.intent.locationId);
        } else if (isUnconfirmedRefreshPlanetTx(tx)) {
          await gameManager.hardRefreshPlanet(tx.intent.locationId);
        } else if (isUnconfirmedBuyHatTx(tx)) {
          await gameManager.hardRefreshPlanet(tx.intent.locationId);
        } else if (isUnconfirmedBuyPlanetTx(tx)) {
          //todo
          await gameManager.hardRefreshPlanet(tx.intent.locationId);
        } else if (isUnconfirmedBuySpaceshipTx(tx)) {
          await gameManager.hardRefreshPlanet(tx.intent.locationId);
        } else if (isUnconfirmedFindArtifactTx(tx)) {
          await gameManager.hardRefreshPlanet(tx.intent.planetId);
        } else if (isUnconfirmedDepositArtifactTx(tx)) {
          await Promise.all([
            gameManager.hardRefreshPlanet(tx.intent.locationId),
            gameManager.hardRefreshArtifact(tx.intent.artifactId),
          ]);
        } else if (isUnconfirmedWithdrawArtifactTx(tx)) {
          await Promise.all([
            await gameManager.hardRefreshPlanet(tx.intent.locationId),
            await gameManager.hardRefreshArtifact(tx.intent.artifactId),
          ]);
        } else if (isUnconfirmedProspectPlanetTx(tx)) {
          await gameManager.softRefreshPlanet(tx.intent.planetId);
        } else if (isUnconfirmedActivateArtifactTx(tx)) {
          let refreshFlag = true;
          const fromPlanet = await gameManager.getPlanetWithId(
            tx.intent.locationId,
          );
          const artifact = await gameManager.getArtifactWithId(
            tx.intent.artifactId,
          );

          if (artifact?.artifactType === ArtifactType.FireLink) {
            if (fromPlanet && fromPlanet.locationId && tx.intent.linkTo) {
              const toPlanet = await gameManager.getPlanetWithId(
                tx.intent.linkTo,
              );
              if (toPlanet) {
                const activeArtifactOnToPlanet =
                  await gameManager.getActiveArtifact(toPlanet);
                if (
                  activeArtifactOnToPlanet &&
                  activeArtifactOnToPlanet.artifactType ===
                    ArtifactType.IceLink &&
                  activeArtifactOnToPlanet.linkTo
                ) {
                  const toLinkPlanet = await gameManager.getPlanetWithId(
                    activeArtifactOnToPlanet.linkTo,
                  );
                  if (toLinkPlanet) {
                    await Promise.all([
                      gameManager.bulkHardRefreshPlanets([
                        fromPlanet.locationId,
                        toPlanet.locationId,
                        toLinkPlanet.locationId,
                      ]),
                      gameManager.hardRefreshArtifact(tx.intent.artifactId),
                    ]);
                    refreshFlag = false;
                  }
                }
              }
            }
          }

          if (refreshFlag) {
            if (tx.intent.linkTo) {
              await Promise.all([
                gameManager.bulkHardRefreshPlanets([
                  tx.intent.locationId,
                  tx.intent.linkTo,
                ]),
                gameManager.hardRefreshArtifact(tx.intent.artifactId),
              ]);
            } else {
              await Promise.all([
                gameManager.hardRefreshPlanet(tx.intent.locationId),
                gameManager.hardRefreshArtifact(tx.intent.artifactId),
              ]);
            }
          }
        } else if (isUnconfirmedDeactivateArtifactTx(tx)) {
          // console.log(tx);
          if (tx.intent.linkTo) {
            await Promise.all([
              gameManager.bulkHardRefreshPlanets([
                tx.intent.locationId,
                tx.intent.linkTo,
              ]),
              gameManager.hardRefreshArtifact(tx.intent.artifactId),
            ]);
          } else {
            await Promise.all([
              gameManager.hardRefreshPlanet(tx.intent.locationId),
              gameManager.hardRefreshArtifact(tx.intent.artifactId),
            ]);
          }
        } else if (isUnconfirmedChangeArtifactImageTypeTx(tx)) {
          await Promise.all([
            await gameManager.hardRefreshPlanet(tx.intent.locationId),
            await gameManager.hardRefreshArtifact(tx.intent.artifactId),
          ]);
        } else if (isUnconfirmedBuyArtifactTx(tx)) {
          await Promise.all([
            gameManager.hardRefreshPlanet(tx.intent.locationId),
            gameManager.hardRefreshArtifact(tx.intent.artifactId),
          ]);
        } else if (isUnconfirmedWithdrawSilverTx(tx)) {
          await gameManager.softRefreshPlanet(tx.intent.locationId);
        } else if (isUnconfirmedCapturePlanetTx(tx)) {
          await Promise.all([
            gameManager.hardRefreshPlayer(gameManager.getAccount()),
            gameManager.hardRefreshPlanet(tx.intent.locationId),
          ]);
        } else if (isUnconfirmedInvadePlanetTx(tx)) {
          await Promise.all([
            gameManager.hardRefreshPlayer(gameManager.getAccount()),
            gameManager.hardRefreshPlanet(tx.intent.locationId),
          ]);
        } else if (isUnconfirmedClaimTx(tx)) {
          gameManager.entityStore.updatePlanet(
            tx.intent.locationId,
            (p) => (p.claimer = gameManager.getAccount()),
          );
        }
        gameManager.entityStore.clearUnconfirmedTxIntent(tx);
        gameManager.onTxConfirmed(tx);
      })
      .on(ContractsAPIEvent.TxErrored, async (tx: Transaction) => {
        gameManager.entityStore.clearUnconfirmedTxIntent(tx);
        if (tx.hash) {
          gameManager.persistentChunkStore.onEthTxComplete(tx.hash);
        }
        gameManager.onTxReverted(tx);
      })
      .on(ContractsAPIEvent.TxCancelled, async (tx: Transaction) => {
        gameManager.onTxCancelled(tx);
      })
      .on(ContractsAPIEvent.RadiusUpdated, async () => {
        const newRadius = await gameManager.contractsAPI.getWorldRadius();
        gameManager.setRadius(newRadius);
      });

    const unconfirmedTxs =
      await persistentChunkStore.getUnconfirmedSubmittedEthTxs();
    const confirmationQueue = new ThrottledConcurrentQueue({
      invocationIntervalMs: 1000,
      maxInvocationsPerIntervalMs: 10,
      maxConcurrency: 1,
    });

    for (const unconfirmedTx of unconfirmedTxs) {
      confirmationQueue.add(async () => {
        const tx =
          gameManager.contractsAPI.txExecutor.waitForTransaction(unconfirmedTx);
        gameManager.contractsAPI.emitTransactionEvents(tx);
        return tx.confirmedPromise;
      });
    }

    // we only want to initialize the mining manager if the player has already joined the game
    // if they haven't, we'll do this once the player has joined the game
    if (!!homeLocation && initialState.players.has(account as string)) {
      gameManager.initMiningManager(homeLocation.coords);
    }

    return gameManager;
  }

  private async hardRefreshPlayer(address?: EthAddress): Promise<void> {
    if (!address) return;
    const playerFromBlockchain = await this.contractsAPI.getPlayerById(address);
    if (!playerFromBlockchain) return;

    const localPlayer = this.getPlayer(address);

    if (localPlayer?.twitter) {
      playerFromBlockchain.twitter = localPlayer.twitter;
    }

    this.players.set(address, playerFromBlockchain);
    this.playersUpdated$.publish();
  }

  private async hardRefreshPlayerSpaceships(
    address?: EthAddress,
    show?: boolean,
  ): Promise<void> {
    if (!address) return;
    const spaceships = await this.contractsAPI.getPlayerSpaceships(address);
    if (show) console.log(spaceships.length);
    for (let i = 0; i < spaceships.length; i++) {
      if (show) {
        console.log("--- spaceship ", i, " ---");
        console.log("ship id:", spaceships[i].id);
        console.log("onPlanet: ", spaceships[i].onPlanetId);
      }

      await this.hardRefreshArtifact(spaceships[i].id);
      const voyageId = spaceships[i].onVoyageId;

      if (voyageId !== undefined) {
        const arrival = await this.contractsAPI.getArrival(Number(voyageId));
        if (show) console.log("voyageId:", voyageId);
        // console.log(arrival);
        if (arrival) {
          const fromPlanet = arrival.fromPlanet;
          const toPlanet = arrival.toPlanet;
          if (show) {
            console.log("Source Planet :", fromPlanet);
            console.log("Target Planet :", toPlanet);
          }
          await Promise.all([
            this.hardRefreshPlanet(fromPlanet),
            this.hardRefreshPlanet(toPlanet),
          ]);
          if (show) console.log("[OK] finish hard refresh from & to planets");
        }
      }
    }
  }

  public async getArrival(arrivalId: number): Promise<void> {
    const arrival = await this.contractsAPI.getArrival(arrivalId);
    console.log(arrival);
  }

  public async getArrivalsForPlanet(planetId: LocationId): Promise<void> {
    const events = await this.contractsAPI.getArrivalsForPlanet(planetId);
    console.log(events);
  }

  // Dirty hack for only refreshing properties on a planet and nothing else
  public async softRefreshPlanet(planetId: LocationId): Promise<void> {
    const planet = await this.contractsAPI.getPlanetById(planetId);
    if (!planet) return;
    this.entityStore.replacePlanetFromContractData(planet);
  }

  public async hardRefreshPlanet(planetId: LocationId): Promise<void> {
    const planet = await this.contractsAPI.getPlanetById(planetId);
    if (!planet) return;
    const arrivals = await this.contractsAPI.getArrivalsForPlanet(planetId);

    const artifactsOnPlanets =
      await this.contractsAPI.bulkGetArtifactsOnPlanets([planetId]);
    const artifactsOnPlanet = artifactsOnPlanets[0];

    const revealedCoords =
      await this.contractsAPI.getRevealedCoordsByIdIfExists(planetId);
    const claimedCoords =
      await this.contractsAPI.getClaimedCoordsByIdIfExists(planetId);
    const burnedCoords =
      await this.contractsAPI.getBurnedCoordsByIdIfExists(planetId);
    const kardashevCoords =
      await this.contractsAPI.getKardashevCoordsByIdIfExists(planetId);

    let revealedLocation: RevealedLocation | undefined;
    let claimedLocation: ClaimedLocation | undefined;
    let burnedLocation: BurnedLocation | undefined;
    let kardashevLocation: KardashevLocation | undefined;
    if (claimedCoords) {
      claimedLocation = {
        ...this.locationFromCoords(claimedCoords),
        claimer: claimedCoords.claimer,
      };
      this.getGameObjects().setClaimedLocation(claimedLocation);

      //to show planet in map
      revealedLocation = {
        ...this.locationFromCoords(claimedCoords),
        revealer: claimedCoords.claimer,
      };
    } else if (revealedCoords) {
      revealedLocation = {
        ...this.locationFromCoords(revealedCoords),
        revealer: revealedCoords.revealer,
      };
    } else if (burnedCoords) {
      burnedLocation = {
        ...this.locationFromCoords(burnedCoords),
        operator: burnedCoords.operator,
        radius:
          this.getContractConstants().BURN_PLANET_LEVEL_EFFECT_RADIUS[
            planet.planetLevel
          ],
      };

      //to show planet in map
      revealedLocation = {
        ...this.locationFromCoords(burnedCoords),
        revealer: burnedCoords.operator,
      };
      this.getGameObjects().setBurnedLocation(burnedLocation);
    } else if (kardashevCoords) {
      kardashevLocation = {
        ...this.locationFromCoords(kardashevCoords),
        operator: kardashevCoords.operator,
        radius:
          this.getContractConstants().KARDASHEV_EFFECT_RADIUS[
            planet.planetLevel
          ],
      };

      //to show planet in map
      revealedLocation = {
        ...this.locationFromCoords(kardashevCoords),
        revealer: kardashevCoords.operator,
      };
      this.getGameObjects().setKardashevLocation(kardashevLocation);
    }

    this.entityStore.replacePlanetFromContractData(
      planet,
      arrivals,
      artifactsOnPlanet.map((a) => a.id),
      revealedLocation,
      claimedCoords?.claimer,
      burnedCoords?.operator,
      kardashevCoords?.operator,
    );

    // it's important that we reload the artifacts that are on the planet after the move
    // completes because this move could have been a photoid canon move. one of the side
    // effects of this type of move is that the active photoid canon deactivates upon a move
    // meaning we need to reload its data from the blockchain.
    artifactsOnPlanet.forEach((a) =>
      this.entityStore.replaceArtifactFromContractData(a),
    );
  }

  private async bulkHardRefreshPlanets(planetIds: LocationId[]): Promise<void> {
    const planetVoyageMap: Map<LocationId, QueuedArrival[]> = new Map();

    const allVoyages = await this.contractsAPI.getAllArrivals(planetIds);
    const planetsToUpdateMap =
      await this.contractsAPI.bulkGetPlanets(planetIds);
    const artifactsOnPlanets =
      await this.contractsAPI.bulkGetArtifactsOnPlanets(planetIds);
    planetsToUpdateMap.forEach((planet, locId) => {
      if (planetsToUpdateMap.has(locId)) {
        planetVoyageMap.set(locId, []);
      }
    });

    for (const voyage of allVoyages) {
      const voyagesForToPlanet = planetVoyageMap.get(voyage.toPlanet);
      if (voyagesForToPlanet) {
        voyagesForToPlanet.push(voyage);
        planetVoyageMap.set(voyage.toPlanet, voyagesForToPlanet);
      }
    }

    for (let i = 0; i < planetIds.length; i++) {
      const planetId = planetIds[i];
      const planet = planetsToUpdateMap.get(planetId);

      // This shouldn't really happen, but we are better off being safe - opposed to throwing
      if (!planet) {
        continue;
      }

      const voyagesForPlanet = planetVoyageMap.get(planet.locationId);
      if (voyagesForPlanet) {
        this.entityStore.replacePlanetFromContractData(
          planet,
          voyagesForPlanet,
          artifactsOnPlanets[i].map((a) => a.id),
        );
      }
    }

    for (const artifacts of artifactsOnPlanets) {
      this.entityStore.replaceArtifactsFromContractData(artifacts);
    }
  }

  public async hardRefreshArtifact(artifactId: ArtifactId): Promise<void> {
    const artifact = await this.contractsAPI.getArtifactById(artifactId);
    if (!artifact) return;
    this.entityStore.replaceArtifactFromContractData(artifact);
  }

  //mytodo: test more
  public async hardRefreshPinkZones(): Promise<void> {
    const loadedBurnedCoords =
      await this.contractsAPI.getBurnedPlanetsCoords(0);

    for (const item of loadedBurnedCoords) {
      const locationId = item.hash;
      const planet = this.getPlanetWithId(locationId);
      if (planet === undefined) continue;

      const burnedLocation = {
        ...this.locationFromCoords(item),
        operator: item.operator,
        radius:
          this.getContractConstants().BURN_PLANET_LEVEL_EFFECT_RADIUS[
            planet.planetLevel
          ],
      };

      this.getGameObjects().setBurnedLocation(burnedLocation);
    }
  }

  //mytodo: test more
  public async hardRefreshBlueZones(): Promise<void> {
    const loadedKardashevCoords =
      await this.contractsAPI.getKardashevPlanetsCoords(0);

    for (const item of loadedKardashevCoords) {
      const locationId = item.hash;
      const planet = this.getPlanetWithId(locationId);
      if (planet === undefined) continue;

      const kardashevLocation = {
        ...this.locationFromCoords(item),
        operator: item.operator,
        radius:
          this.getContractConstants().KARDASHEV_EFFECT_RADIUS[
            planet.planetLevel
          ],
      };

      this.getGameObjects().setKardashevLocation(kardashevLocation);
    }
  }

  private onTxSubmit(tx: Transaction): void {
    this.terminal.current?.print(
      `${tx.intent.methodName} transaction (`,
      TerminalTextStyle.Blue,
    );
    this.terminal.current?.printLink(
      `${tx.hash?.slice(0, 6) ?? ""}`,
      () => {
        window.open(`${BLOCK_EXPLORER_URL}/tx/${tx.hash ?? ""}`);
      },
      TerminalTextStyle.White,
    );
    this.terminal.current?.println(`) submitted`, TerminalTextStyle.Blue);
  }

  private onTxConfirmed(tx: Transaction) {
    this.terminal.current?.print(
      `${tx.intent.methodName} transaction (`,
      TerminalTextStyle.Green,
    );
    this.terminal.current?.printLink(
      `${tx.hash?.slice(0, 6) ?? ""}`,
      () => {
        window.open(`${BLOCK_EXPLORER_URL}/tx/${tx.hash ?? ""}`);
      },
      TerminalTextStyle.White,
    );
    this.terminal.current?.println(`) confirmed`, TerminalTextStyle.Green);
  }

  private onTxReverted(tx: Transaction) {
    this.terminal.current?.print(
      `${tx.intent.methodName} transaction (`,
      TerminalTextStyle.Red,
    );
    this.terminal.current?.printLink(
      `${tx.hash?.slice(0, 6) ?? ""}`,
      () => {
        window.open(`${BLOCK_EXPLORER_URL}/tx/${tx.hash ?? ""}`);
      },
      TerminalTextStyle.White,
    );

    this.terminal.current?.println(`) reverted`, TerminalTextStyle.Red);
  }

  private onTxCancelled(tx: Transaction) {
    this.entityStore.clearUnconfirmedTxIntent(tx);
    this.terminal.current?.print(
      `${tx.intent.methodName} transaction (`,
      TerminalTextStyle.Red,
    );
    this.terminal.current?.printLink(
      `${tx.hash?.slice(0, 6) ?? ""}`,
      () => {
        window.open(`${BLOCK_EXPLORER_URL}/tx/${tx.hash ?? ""}`);
      },
      TerminalTextStyle.White,
    );

    this.terminal.current?.println(`) cancelled`, TerminalTextStyle.Red);
  }

  /**
   * Gets the address of the player logged into this game manager.
   */
  public getAccount(): EthAddress | undefined {
    return this.account;
  }

  /**
   * Get the thing that handles contract interaction.
   */
  public getContractAPI(): ContractsAPI {
    return this.contractsAPI;
  }

  /**
   * Gets the address of the `DarkForest` contract, which is the 'backend' of the game.
   */
  public getContractAddress(): EthAddress {
    return this.contractsAPI.getContractAddress();
  }

  /**
   * Gets the twitter handle of the given ethereum account which is associated
   * with Dark Forest.
   */
  public getTwitter(address: EthAddress | undefined): string | undefined {
    let myAddress;
    if (!address) myAddress = this.getAccount();
    else myAddress = address;

    if (!myAddress) {
      return undefined;
    }
    const twitter = this.players.get(myAddress)?.twitter;
    return twitter;
  }

  /**
   * The game ends at a particular time in the future - get this time measured
   * in seconds from the epoch.
   */
  public getEndTimeSeconds(): number {
    return this.endTimeSeconds;
  }

  /**
   * Dark Forest tokens can only be minted up to a certain time - get this time measured in seconds from epoch.
   */
  public getTokenMintEndTimeSeconds(): number {
    return this.contractConstants.TOKEN_MINT_END_TIMESTAMP;
  }

  /**
   * Dark Forest planets can only be claimed to a certain time - get this time measured in seconds from epoch.
   */
  public getClaimEndTimeSeconds(): number {
    return this.contractConstants.CLAIM_END_TIMESTAMP;
  }

  /**
   * Gets the rarity of planets in the universe
   */
  public getPlanetRarity(): number {
    return this.contractConstants.PLANET_RARITY;
  }

  /**
   * returns timestamp (seconds) that planet will reach percent% of energycap
   * time may be in the past
   */
  public getEnergyCurveAtPercent(planet: Planet, percent: number): number {
    return this.entityStore.getEnergyCurveAtPercent(planet, percent);
  }

  /**
   * returns timestamp (seconds) that planet will reach percent% of silcap if
   * doesn't produce silver, returns undefined if already over percent% of silcap,
   */
  public getSilverCurveAtPercent(
    planet: Planet,
    percent: number,
  ): number | undefined {
    return this.entityStore.getSilverCurveAtPercent(planet, percent);
  }

  /**
   * Returns the upgrade that would be applied to a planet given a particular
   * upgrade branch (defense, range, speed) and level of upgrade.
   */
  public getUpgrade(branch: number, level: number): Upgrade {
    return this.contractConstants.upgrades[branch][level];
  }

  /**
   * Gets a list of all the players in the game (not just the ones you've
   * encounterd)
   */
  public getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  /**
   * Gets either the given player, or if no address was provided, gets the player that is logged
   * this client.
   */
  public getPlayer(address?: EthAddress): Player | undefined {
    address = address || this.account;

    if (!address) {
      return undefined;
    }

    return this.players.get(address);
  }

  /**
   * Gets all the map chunks that this client is aware of. Chunks may have come from
   * mining, or from importing map data.
   */
  public getExploredChunks(): Iterable<Chunk> {
    return this.persistentChunkStore.allChunks();
  }

  /**
   * Gets the ids of all the planets that are both within the given bounding box (defined by its bottom
   * left coordinate, width, and height) in the world and of a level that was passed in via the
   * `planetLevels` parameter.
   */
  public getPlanetsInWorldRectangle(
    worldX: number,
    worldY: number,
    worldWidth: number,
    worldHeight: number,
    levels: number[],
    planetLevelToRadii: Map<number, Radii>,
    updateIfStale = true,
  ): LocatablePlanet[] {
    return this.entityStore.getPlanetsInWorldRectangle(
      worldX,
      worldY,
      worldWidth,
      worldHeight,
      levels,
      planetLevelToRadii,
      updateIfStale,
    );
  }

  /**
   * Returns whether or not the current round has ended.
   */
  public isRoundOver(): boolean {
    return Date.now() / 1000 > this.getTokenMintEndTimeSeconds();
  }

  /**
   * Gets the radius of the playable area of the universe.
   */
  public getWorldRadius(): number {
    return this.worldRadius;
  }

  /**
   * Gets the total amount of silver that lives on a planet that somebody owns.
   */
  public getWorldSilver(): number {
    return this.getAllOwnedPlanets().reduce(
      (totalSoFar: number, nextPlanet: Planet) =>
        totalSoFar + nextPlanet.silver,
      0,
    );
  }

  /**
   * Gets the total amount of energy that lives on a planet that somebody owns.
   */
  public getUniverseTotalEnergy(): number {
    return this.getAllOwnedPlanets().reduce(
      (totalSoFar: number, nextPlanet: Planet) =>
        totalSoFar + nextPlanet.energy,
      0,
    );
  }

  /**
   * Gets the total amount of silver that lives on planets that the given player owns.
   */
  public getSilverOfPlayer(player: EthAddress): number {
    return this.getAllOwnedPlanets()
      .filter((planet) => planet.owner === player)
      .reduce(
        (totalSoFar: number, nextPlanet: Planet) =>
          totalSoFar + nextPlanet.silver,
        0,
      );
  }

  /**
   * Gets the total amount of energy that lives on planets that the given player owns.
   */
  public getEnergyOfPlayer(player: EthAddress): number {
    return this.getAllOwnedPlanets()
      .filter((planet) => planet.owner === player)
      .reduce(
        (totalSoFar: number, nextPlanet: Planet) =>
          totalSoFar + nextPlanet.energy,
        0,
      );
  }

  public getPlayerScore(addr: EthAddress): number | undefined {
    const player = this.players.get(addr);
    if (!player) return undefined;
    if (player.lastClaimTimestamp === 0) return undefined;
    return player?.score;
  }

  public getPlayerSpaceJunk(addr: EthAddress): number | undefined {
    const player = this.players.get(addr);
    return player?.spaceJunk;
  }

  public getPlayerSpaceJunkLimit(addr: EthAddress): number | undefined {
    const player = this.players.get(addr);
    return player?.spaceJunkLimit;
  }

  public getPlayerActivateArtifactAmount(addr: EthAddress): number | undefined {
    const player = this.players.get(addr);
    return player?.activateArtifactAmount;
  }

  public getPlayerBuyArtifactAmount(addr: EthAddress): number | undefined {
    const player = this.players.get(addr);
    return player?.buyArtifactAmount;
  }

  public getPlayerSilver(addr: EthAddress): number | undefined {
    const player = this.players.get(addr);
    return player?.silver;
  }
  public getDefaultSpaceJunkForPlanetLevel(level: number) {
    return this.contractConstants.PLANET_LEVEL_JUNK[level];
  }

  private initMiningManager(homeCoords: WorldCoords, cores?: number): void {
    if (this.minerManager) return;

    const myPattern: MiningPattern = new SpiralPattern(
      homeCoords,
      MIN_CHUNK_SIZE,
    );

    this.minerManager = MinerManager.create(
      this.persistentChunkStore,
      myPattern,
      this.worldRadius,
      this.planetRarity,
      this.hashConfig,
      this.useMockHash,
    );

    const config = {
      contractAddress: this.getContractAddress(),
      account: this.account,
    };

    this.minerManager.setCores(
      cores || getNumberSetting(config, Setting.MiningCores),
    );

    this.minerManager.on(
      MinerManagerEvent.DiscoveredNewChunk,
      (chunk: Chunk, miningTimeMillis: number) => {
        this.addNewChunk(chunk);
        this.hashRate =
          chunk.chunkFootprint.sideLength ** 2 / (miningTimeMillis / 1000);
        this.emit(GameManagerEvent.DiscoveredNewChunk, chunk);
      },
    );

    const isMining = getBooleanSetting(config, Setting.IsMining);
    if (isMining) {
      this.minerManager.startExplore();
    }
  }

  /**
   * Sets the mining pattern of the miner. This kills the old miner and starts this one.
   */
  setMiningPattern(pattern: MiningPattern): void {
    if (this.minerManager) {
      this.minerManager.setMiningPattern(pattern);
    }
  }

  /**
   * Gets the mining pattern that the miner is currently using.
   */
  getMiningPattern(): MiningPattern | undefined {
    if (this.minerManager) return this.minerManager.getMiningPattern();
    else return undefined;
  }

  /**
   * Set the amount of cores to mine the universe with. More cores equals faster!
   */
  setMinerCores(nCores: number): void {
    const config = {
      contractAddress: this.getContractAddress(),
      account: this.account,
    };
    setSetting(config, Setting.MiningCores, nCores + "");
  }

  /**
   * Whether or not the miner is currently exploring space.
   */
  isMining(): boolean {
    return this.minerManager?.isMining() || false;
  }

  /**
   * Changes the amount of move snark proofs that are cached.
   */
  setSnarkCacheSize(size: number): void {
    this.snarkHelper.setSnarkCacheSize(size);
  }

  /**
   * Gets the rectangle bounding the chunk that the miner is currently in the process
   * of hashing.
   */
  getCurrentlyExploringChunk(): Rectangle | undefined {
    if (this.minerManager) {
      return this.minerManager.getCurrentlyExploringChunk();
    }
    return undefined;
  }

  /**
   * Whether or not this client has successfully found and landed on a home planet.
   */
  hasJoinedGame(): boolean {
    return this.players.has(this.account as string);
  }

  /**
   * Returns info about the next time you can broadcast coordinates
   */
  getNextRevealCountdownInfo(): RevealCountdownInfo {
    if (!this.account) {
      throw new Error("no account set");
    }
    const myLastRevealTimestamp = this.players.get(
      this.account,
    )?.lastRevealTimestamp;
    return {
      myLastRevealTimestamp: myLastRevealTimestamp || undefined,
      currentlyRevealing: this.entityStore.transactions.hasTransaction(
        isUnconfirmedRevealTx,
      ),
      revealCooldownTime: this.contractConstants.LOCATION_REVEAL_COOLDOWN,
    };
  }

  /**
   * Returns info about the next time you can claim a Planet
   */
  getNextClaimCountdownInfo(): ClaimCountdownInfo {
    if (!this.account) {
      throw new Error("no account set");
    }
    const myLastClaimTimestamp = this.players.get(
      this.account,
    )?.lastClaimTimestamp;
    return {
      myLastClaimTimestamp: myLastClaimTimestamp || undefined,
      currentlyClaiming:
        !!this.entityStore.transactions.hasTransaction(isUnconfirmedClaimTx),
      claimCooldownTime: this.contractConstants.CLAIM_PLANET_COOLDOWN,
    };
  }

  /**
   * Returns info about the next time you can burn a Planet
   */
  getNextBurnCountdownInfo(): BurnCountdownInfo {
    if (!this.account) {
      throw new Error("no account set");
    }
    const myLastBurnTimestamp = this.players.get(
      this.account,
    )?.lastBurnTimestamp;
    return {
      myLastBurnTimestamp: myLastBurnTimestamp || undefined,
      currentlyBurning:
        !!this.entityStore.transactions.hasTransaction(isUnconfirmedBurnTx),
      burnCooldownTime: this.contractConstants.BURN_PLANET_COOLDOWN,
    };
  }

  /**
   * Returns info about the next time you can burn a Planet
   */
  getNextKardashevCountdownInfo(): KardashevCountdownInfo {
    if (!this.account) {
      throw new Error("no account set");
    }
    const myLastKardashevTimestamp = this.players.get(
      this.account,
    )?.lastKardashevTimestamp;
    return {
      myLastKardashevTimestamp: myLastKardashevTimestamp || undefined,
      currentlyKardasheving: !!this.entityStore.transactions.hasTransaction(
        isUnconfirmedKardashevTx,
      ),
      kardashevCooldownTime: this.contractConstants.KARDASHEV_PLANET_COOLDOWN,
    };
  }

  /**
   * gets both deposited artifacts that are on planets i own as well as artifacts i own
   */
  getMyArtifacts(): Artifact[] {
    if (!this.account) return [];
    const ownedByMe = this.entityStore.getArtifactsOwnedBy(this.account);
    const onPlanetsOwnedByMe = this.entityStore
      .getArtifactsOnPlanetsOwnedBy(this.account)
      // filter out space ships because they always show up
      // in the `ownedByMe` array.
      .filter((a) => !isSpaceShip(a.artifactType));

    return [...ownedByMe, ...onPlanetsOwnedByMe];
  }

  /**
   * Gets the planet that is located at the given coordinates. Returns undefined if not a valid
   * location or if no planet exists at location. If the planet needs to be updated (because
   * some time has passed since we last updated the planet), then updates that planet first.
   */
  getPlanetWithCoords(coords: WorldCoords): LocatablePlanet | undefined {
    return this.entityStore.getPlanetWithCoords(coords);
  }

  /**
   * Gets the planet with the given hash. Returns undefined if the planet is neither in the contract
   * nor has been discovered locally. If the planet needs to be updated (because some time has
   * passed since we last updated the planet), then updates that planet first.
   */
  getPlanetWithId(planetId: LocationId | undefined): Planet | undefined {
    return planetId && this.entityStore.getPlanetWithId(planetId);
  }

  /**
   * Gets a list of planets in the client's memory with the given ids. If a planet with the given id
   * doesn't exist, no entry for that planet will be returned in the result.
   */
  getPlanetsWithIds(planetId: LocationId[]): Planet[] {
    return planetId
      .map((id) => this.getPlanetWithId(id))
      .filter((p) => !!p) as Planet[];
  }

  getStalePlanetWithId(planetId: LocationId): Planet | undefined {
    return this.entityStore.getPlanetWithId(planetId, false);
  }

  /**
   * Get the score of the currently logged-in account.
   */
  getMyScore(): number | undefined {
    if (!this.account) {
      return undefined;
    }
    const player = this.players.get(this.account);
    return player?.score;
  }

  /**
   * Gets the artifact with the given id. Null if no artifact with id exists.
   */
  getArtifactWithId(artifactId?: ArtifactId): Artifact | undefined {
    return this.entityStore.getArtifactById(artifactId);
  }

  /**
   * Gets the artifacts with the given ids, including ones we know exist but haven't been loaded,
   * represented by `undefined`.
   */
  getArtifactsWithIds(
    artifactIds: ArtifactId[] = [],
  ): Array<Artifact | undefined> {
    return artifactIds.map((id) => this.getArtifactWithId(id));
  }

  /**
   * Gets the level of the given planet. Returns undefined if the planet does not exist. Does
   * NOT update the planet if the planet is stale, which means this function is fast.
   */
  getPlanetLevel(planetId: LocationId): PlanetLevel | undefined {
    return this.entityStore.getPlanetLevel(planetId);
  }

  /**
   * Gets the location of the given planet. Returns undefined if the planet does not exist, or if
   * we do not know the location of this planet NOT update the planet if the planet is stale,
   * which means this function is fast.
   */
  getLocationOfPlanet(planetId: LocationId): WorldLocation | undefined {
    return this.entityStore.getLocationOfPlanet(planetId);
  }

  /**
   * Gets all voyages that have not completed.
   */
  getAllVoyages(): QueuedArrival[] {
    return this.entityStore.getAllVoyages();
  }

  /**
   * Gets all planets. This means all planets that are in the contract, and also all
   * planets that have been mined locally. Does not update planets if they are stale.
   * NOT PERFORMANT - for scripting only.
   */
  getAllPlanets(): Iterable<Planet> {
    return this.entityStore.getAllPlanets();
  }

  /**
   * Gets a list of planets that have an owner.
   */
  getAllOwnedPlanets(): Planet[] {
    return this.entityStore.getAllOwnedPlanets();
  }

  /**
   * Gets a list of the planets that the player logged into this `GameManager` owns.
   */
  getMyPlanets(): Planet[] {
    return this.getAllOwnedPlanets().filter(
      (planet) => planet.owner === this.account,
    );
  }

  /**
   * Gets a map of all location IDs whose coords have been publically revealed
   */
  getRevealedLocations(): Map<LocationId, RevealedLocation> {
    return this.entityStore.getRevealedLocations();
  }

  /**
   * Gets a map of all location IDs which have been claimed.
   */
  getClaimedLocations(): Map<LocationId, ClaimedLocation> {
    return this.entityStore.getClaimedLocations();
  }

  /**
   * Gets a map of all location IDs which have been claimed.
   */
  getBurnedLocations(): Map<LocationId, BurnedLocation> {
    return this.entityStore.getBurnedLocations();
  }

  getKardashevLocations(): Map<LocationId, BurnedLocation> {
    return this.entityStore.getKardashevLocations();
  }

  /**
   * Each coordinate lives in a particular type of space, determined by a smooth random
   * function called 'perlin noise.
   */
  spaceTypeFromPerlin(perlin: number, distFromOrigin: number): SpaceType {
    return this.entityStore.spaceTypeFromPerlin(perlin, distFromOrigin);
  }

  /**
   * Gets the amount of hashes per second that the miner manager is calculating.
   */
  getHashesPerSec(): number {
    return this.hashRate;
  }

  /**
   * Signs the given twitter handle with the private key of the current user. Used to
   * verify that the person who owns the Dark Forest account was the one that attempted
   * to link a twitter to their account.
   */
  async getSignedTwitter(twitter: string): Promise<string> {
    return this.ethConnection.signMessage(twitter);
  }

  /**
   * Gets the private key of the burner wallet used by this account.
   */
  getPrivateKey(): string | undefined {
    return this.ethConnection.getPrivateKey();
  }

  /**
   * Gets the balance of the account measured in Eth (i.e. in full units of the chain).
   */
  getMyBalanceEth(): number {
    if (!this.account) return 0;
    return weiToEth(this.getMyBalance());
  }

  /**
   * Gets the balance of the account
   */
  getMyBalance(): BigNumber {
    return this.ethConnection.getMyBalance() || BigNumber.from("0");
  }

  /**
   * Returns the monomitter which publishes events whenever the player's balance changes.
   */
  getMyBalance$(): Monomitter<BigNumber> {
    return this.ethConnection.myBalance$;
  }

  /**
   * Gets all moves that this client has queued to be uploaded to the contract, but
   * have not been successfully confirmed yet.
   */
  getUnconfirmedMoves(): Transaction<UnconfirmedMove>[] {
    return this.entityStore.transactions.getTransactions(isUnconfirmedMoveTx);
  }

  /**
   * Gets all upgrades that this client has queued to be uploaded to the contract, but
   * have not been successfully confirmed yet.
   */
  getUnconfirmedUpgrades(): Transaction<UnconfirmedUpgrade>[] {
    return this.entityStore.transactions.getTransactions(
      isUnconfirmedUpgradeTx,
    );
  }

  getUnconfirmedRefreshPlanets(): Transaction<UnconfirmedRefreshPlanet>[] {
    return this.entityStore.transactions.getTransactions(
      isUnconfirmedRefreshPlanetTx,
    );
  }

  getUnconfirmedLinkActivations(): Transaction<UnconfirmedActivateArtifact>[] {
    return this.entityStore.transactions
      .getTransactions(isUnconfirmedActivateArtifactTx)
      .filter((tx) => tx.intent.linkTo !== undefined);
  }

  /**
   * Gets the location of your home planet.
   */
  getHomeCoords(): WorldCoords | undefined {
    if (!this.homeLocation) return undefined;
    return {
      x: this.homeLocation.coords.x,
      y: this.homeLocation.coords.y,
    };
  }

  /**
   * Gets the hash of the location of your home planet.
   */
  getHomeHash(): LocationId | undefined {
    return this.homeLocation?.hash;
  }

  /**
   * Gets the HASH CONFIG
   */
  getHashConfig(): HashConfig {
    return { ...this.hashConfig };
  }

  /**
   * Whether or not the given rectangle has been mined.
   */
  hasMinedChunk(chunkLocation: Rectangle): boolean {
    return this.persistentChunkStore.hasMinedChunk(chunkLocation);
  }

  getChunk(chunkFootprint: Rectangle): Chunk | undefined {
    return this.persistentChunkStore.getChunkByFootprint(chunkFootprint);
  }

  getChunkStore(): PersistentChunkStore {
    return this.persistentChunkStore;
  }

  /**
   * The perlin value at each coordinate determines the space type. There are four space
   * types, which means there are four ranges on the number line that correspond to
   * each space type. This function returns the boundary values between each of these
   * four ranges: `PERLIN_THRESHOLD_1`, `PERLIN_THRESHOLD_2`, `PERLIN_THRESHOLD_3`.
   */
  getPerlinThresholds(): [number, number, number] {
    return [
      this.contractConstants.PERLIN_THRESHOLD_1,
      this.contractConstants.PERLIN_THRESHOLD_2,
      this.contractConstants.PERLIN_THRESHOLD_3,
    ];
  }

  /**
   * Starts the miner.
   */
  startExplore(): void {
    if (this.minerManager) {
      const config = {
        contractAddress: this.getContractAddress(),
        account: this.account,
      };
      setBooleanSetting(config, Setting.IsMining, true);
      this.minerManager.startExplore();
    }
  }

  /**
   * Stops the miner.
   */
  stopExplore(): void {
    if (this.minerManager) {
      const config = {
        contractAddress: this.getContractAddress(),
        account: this.account,
      };
      setBooleanSetting(config, Setting.IsMining, false);
      this.hashRate = 0;
      this.minerManager.stopExplore();
    }
  }

  private setRadius(worldRadius: number) {
    this.worldRadius = worldRadius;

    if (this.minerManager) {
      this.minerManager.setRadius(this.worldRadius);
    }
  }

  private async refreshTwitters(): Promise<void> {
    const addressTwitters = await getAllTwitters();
    this.setPlayerTwitters(addressTwitters);
  }

  private setPlayerTwitters(twitters: AddressTwitterMap): void {
    for (const [address, player] of this.players.entries()) {
      const newPlayerTwitter = twitters[address];
      player.twitter = newPlayerTwitter;
    }
    this.playersUpdated$.publish();
  }

  /**
   * Once you have posted the verification tweet - complete the twitter-account-linking
   * process by telling the Dark Forest webserver to look at that tweet.
   */
  async submitVerifyTwitter(twitter: string): Promise<boolean> {
    if (!this.account) return Promise.resolve(false);
    const success = await verifyTwitterHandle(
      await this.ethConnection.signMessageObject({ twitter }),
    );
    await this.refreshTwitters();
    return success;
  }

  private checkGameHasEnded(): boolean {
    if (Date.now() / 1000 > this.endTimeSeconds) {
      this.terminal.current?.println("[ERROR] Game has ended.");
      return true;
    }
    return false;
  }

  /**
   * Gets the timestamp (ms) of the next time that we can broadcast the coordinates of a planet.
   */
  public getNextBroadcastAvailableTimestamp() {
    return Date.now() + this.timeUntilNextBroadcastAvailable();
  }

  /**
   * Gets the amount of time (ms) until the next time the current player can broadcast a planet.
   */
  public timeUntilNextBroadcastAvailable() {
    if (!this.account) {
      throw new Error("no account set");
    }

    const myLastRevealTimestamp = this.players.get(
      this.account,
    )?.lastRevealTimestamp;

    return timeUntilNextBroadcastAvailable(
      myLastRevealTimestamp,
      this.contractConstants.LOCATION_REVEAL_COOLDOWN,
    );
  }

  /**
   * Gets the timestamp (ms) of the next time that we can claim a planet.
   */
  public getNextClaimAvailableTimestamp() {
    // both the variables in the next line are denominated in seconds
    return Date.now() + this.timeUntilNextClaimAvailable();
  }

  /**
   * Gets the amount of time (ms) until the next time the current player can claim a planet.
   */
  public timeUntilNextClaimAvailable() {
    if (!this.account) {
      throw new Error("no account set");
    }

    const myLastClaimTimestamp = this.players.get(
      this.account,
    )?.lastClaimTimestamp;

    // Calculation formula is the same
    return timeUntilNextBroadcastAvailable(
      myLastClaimTimestamp,
      this.contractConstants.CLAIM_PLANET_COOLDOWN,
    );
  }

  /**
   * Gets the timestamp (ms) of the next time that we can burn a planet.
   */
  public getNextBurnAvailableTimestamp() {
    return Date.now() + this.timeUntilNextBurnAvailable();
  }

  /**
   * Gets the amount of time (ms) until the next time the current player can burn a planet.
   */
  public timeUntilNextBurnAvailable() {
    if (!this.account) {
      throw new Error("no account set");
    }

    const myLastBurnTimestamp = this.players.get(
      this.account,
    )?.lastBurnTimestamp;

    // Calculation formula is the same
    return timeUntilNextBroadcastAvailable(
      myLastBurnTimestamp,
      this.contractConstants.BURN_PLANET_COOLDOWN,
    );
  }

  /**
   * Gets the timestamp (ms) of the next time that we can pink a planet.
   */
  public getNextPinkAvailableTimestamp(planetId: LocationId) {
    if (!this.account) {
      throw new Error("no account set");
    }
    const planet = this.getPlanetWithId(planetId);
    if (!isLocatable(planet)) return 0;
    const myPinkZones = this.getMyPinkZones();
    let result = -1;
    for (const pinkZone of myPinkZones) {
      const burnPlanetId = pinkZone.locationId;
      const coords = pinkZone.coords;
      const radius = pinkZone.radius;
      const burnPlanet = this.getPlanetWithId(burnPlanetId);
      if (!burnPlanet) continue;
      if (!burnPlanet.burnStartTimestamp) continue;

      const dis = this.getDistCoords(coords, planet.location.coords);

      if (dis <= radius) {
        if (result === -1) result = burnPlanet.burnStartTimestamp;
        else result = result = Math.min(result, burnPlanet.burnStartTimestamp);
      }
    }

    if (result === 1) return 0;
    else return (result + this.contractConstants.PINK_PLANET_COOLDOWN) * 1000;
  }

  /**
   * Gets the center planet for blueLocation
   */
  public getBlueZoneCenterPlanetId(planetId: LocationId) {
    let centerPlanetId = undefined;
    let dis = undefined;
    if (!this.account) {
      throw new Error("no account set");
    }
    const planet = this.getPlanetWithId(planetId);
    if (!isLocatable(planet)) return undefined;
    const myBlueZones = this.getMyBlueZones();

    for (const blueZone of myBlueZones) {
      const blueZoneCenterPlanetId = blueZone.locationId;
      const coords = blueZone.coords;

      const centerPlanet = this.getPlanetWithId(blueZoneCenterPlanetId);
      if (!centerPlanet) continue;
      if (!centerPlanet.kardashevTimestamp) continue;
      const distanceToZone = this.getDistCoords(coords, planet.location.coords);
      if (
        distanceToZone <=
        this.contractConstants.KARDASHEV_EFFECT_RADIUS[centerPlanet.planetLevel]
      ) {
        if (centerPlanetId === undefined || dis === undefined) {
          centerPlanetId = centerPlanet.locationId;
          dis = distanceToZone;
        } else if (distanceToZone < dis) {
          centerPlanetId = centerPlanet.locationId;
          dis = distanceToZone;
        } else if (distanceToZone === dis) {
          const tmp = this.getPlanetWithId(centerPlanetId);
          if (!tmp) continue;
          if (!tmp.kardashevTimestamp) continue;
          if (!centerPlanet.kardashevTimestamp) continue;
          if (tmp.kardashevTimestamp > centerPlanet.kardashevTimestamp) {
            centerPlanetId = centerPlanet.locationId;
            dis = distanceToZone;
          }
        }
      }
    }
    return centerPlanetId;
  }

  public getNextKardashevAvailableTimestamp() {
    return Date.now() + this.timeUntilNextKardashevAvailable();
  }

  /**
   * Gets the amount of time (ms) until the next time the current player can kardashv a planet.
   */
  public timeUntilNextKardashevAvailable() {
    if (!this.account) {
      throw new Error("no account set");
    }

    const myLastKardashevTimestamp = this.players.get(
      this.account,
    )?.lastKardashevTimestamp;

    // Calculation formula is the same
    return timeUntilNextBroadcastAvailable(
      myLastKardashevTimestamp,
      this.contractConstants.KARDASHEV_PLANET_COOLDOWN,
    );
  }

  public getNextBlueAvailableTimestamp(planetId: LocationId) {
    if (!this.account) {
      throw new Error("no account set");
    }
    const planet = this.getPlanetWithId(planetId);
    if (!isLocatable(planet)) return 0;

    const centerPlanetId = this.getBlueZoneCenterPlanetId(planetId);
    if (centerPlanetId === undefined) return 0;
    const centerPlanet = this.getPlanetWithId(centerPlanetId);
    if (!centerPlanet) return 0;
    if (!centerPlanet.kardashevTimestamp) return 0;
    return (
      (centerPlanet.kardashevTimestamp +
        this.contractConstants.BLUE_PLANET_COOLDOWN) *
      1000
    );
  }
  /**
  /**
   * Gets the timestamp (ms) of the next time that we can activate artifact.
   */
  public getNextActivateArtifactAvailableTimestamp() {
    return Date.now() + this.timeUntilNextActivateArtifactAvailable();
  }

  /**
   * Gets the amount of time (ms) until the next time the current player can activate artifact.
   */
  public timeUntilNextActivateArtifactAvailable() {
    if (!this.account) {
      throw new Error("no account set");
    }

    const myLastActivateArtifactTimestamp = this.players.get(
      this.account,
    )?.lastActivateArtifactTimestamp;

    // Calculation formula is the same
    return timeUntilNextBroadcastAvailable(
      myLastActivateArtifactTimestamp,
      this.contractConstants.ACTIVATE_ARTIFACT_COOLDOWN,
    );
  }

  /**
   * Gets the timestamp (ms) of the next time that we can activate artifact.
   */
  public getNextBuyArtifactAvailableTimestamp() {
    return Date.now() + this.timeUntilNextBuyArtifactAvailable();
  }

  /**
   * Gets the amount of time (ms) until the next time the current player can activate artifact.
   */
  public timeUntilNextBuyArtifactAvailable() {
    if (!this.account) {
      throw new Error("no account set");
    }

    const myLastBuyArtifactTimestamp = this.players.get(
      this.account,
    )?.lastBuyArtifactTimestamp;

    // Calculation formula is the same
    return timeUntilNextBroadcastAvailable(
      myLastBuyArtifactTimestamp,
      this.contractConstants.BUY_ARTIFACT_COOLDOWN,
    );
  }

  public getCaptureZones(): Set<CaptureZone> {
    return this.captureZoneGenerator?.getZones() || new Set();
  }

  public getPinkZones(): Set<PinkZone> {
    const pinkZones = new Set<PinkZone>();
    const burnedLocations = this.getBurnedLocations();
    const allBurnedLocationsValues = Array.from(burnedLocations.values());

    for (const item of allBurnedLocationsValues) {
      const planet = this.getPlanetWithId(item.hash);
      if (planet === undefined) continue;
      const locationId = planet.locationId;
      const coords = { x: item.coords.x, y: item.coords.y };
      const operator = item.operator;
      const radius =
        this.getContractConstants().BURN_PLANET_LEVEL_EFFECT_RADIUS[
          planet.planetLevel
        ];

      pinkZones.add({
        locationId: locationId,
        coords: coords,
        operator: operator,
        radius: radius,
      });
    }

    return pinkZones || new Set();
  }

  public getMyPinkZones(): Set<PinkZone> {
    const pinkZones = new Set<PinkZone>();
    const burnedLocations = this.getBurnedLocations();
    const allBurnedLocationsValues = Array.from(burnedLocations.values());

    for (const item of allBurnedLocationsValues) {
      const planet = this.getPlanetWithId(item.hash);
      if (planet === undefined) continue;
      if (planet.burnOperator !== this.account) continue;
      const locationId = planet.locationId;
      const coords = { x: item.coords.x, y: item.coords.y };
      const operator = item.operator;
      const radius =
        this.getContractConstants().BURN_PLANET_LEVEL_EFFECT_RADIUS[
          planet.planetLevel
        ];

      pinkZones.add({
        locationId: locationId,
        coords: coords,
        operator: operator,
        radius: radius,
      });
    }

    return pinkZones || new Set();
  }

  public getBlueZones(): Set<PinkZone> {
    const blueZones = new Set<PinkZone>();
    const kardashevLocations = this.getKardashevLocations();
    const allKardashevLocationsValues = Array.from(kardashevLocations.values());

    for (const item of allKardashevLocationsValues) {
      const planet = this.getPlanetWithId(item.hash);
      if (planet === undefined) continue;
      const locationId = planet.locationId;
      const coords = { x: item.coords.x, y: item.coords.y };
      const operator = item.operator;
      const radius =
        this.getContractConstants().KARDASHEV_EFFECT_RADIUS[planet.planetLevel];

      blueZones.add({
        locationId: locationId,
        coords: coords,
        operator: operator,
        radius: radius,
      });
    }

    return blueZones || new Set();
  }

  public getMyBlueZones(): Set<PinkZone> {
    const blueZones = new Set<PinkZone>();
    const kardashevLocations = this.getKardashevLocations();
    const allKardashevLocationsValues = Array.from(kardashevLocations.values());

    for (const item of allKardashevLocationsValues) {
      const planet = this.getPlanetWithId(item.hash);
      if (planet === undefined) continue;
      if (planet.kardashevOperator !== this.account) continue;
      const locationId = planet.locationId;
      const coords = { x: item.coords.x, y: item.coords.y };
      const operator = item.operator;
      const radius =
        this.getContractConstants().BURN_PLANET_LEVEL_EFFECT_RADIUS[
          planet.planetLevel
        ];

      blueZones.add({
        locationId: locationId,
        coords: coords,
        operator: operator,
        radius: radius,
      });
    }

    return blueZones || new Set();
  }

  /**
   * Reveals a planet's location on-chain.
   */
  public async revealLocation(
    planetId: LocationId,
  ): Promise<Transaction<UnconfirmedReveal>> {
    try {
      if (!this.account) {
        throw new Error("no account set");
      }

      const planet = this.entityStore.getPlanetWithId(planetId);

      if (!planet) {
        throw new Error("you can't reveal a planet you haven't discovered");
      }

      if (!isLocatable(planet)) {
        throw new Error(
          "you can't reveal a planet whose coordinates you don't know",
        );
      }

      if (planet.coordsRevealed) {
        throw new Error("this planet's location is already revealed");
      }

      if (planet.transactions?.hasTransaction(isUnconfirmedRevealTx)) {
        throw new Error("you're already revealing this planet's location");
      }

      if (this.entityStore.transactions.hasTransaction(isUnconfirmedRevealTx)) {
        throw new Error("you're already broadcasting coordinates");
      }

      const myLastRevealTimestamp = this.players.get(
        this.account,
      )?.lastRevealTimestamp;
      if (
        myLastRevealTimestamp &&
        Date.now() < this.getNextBroadcastAvailableTimestamp()
      ) {
        throw new Error("still on cooldown for broadcasting");
      }

      // this is shitty. used for the popup window
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-revealLocationId`,
        planetId,
      );

      const getArgs = async () => {
        const revealArgs = await this.snarkHelper.getRevealArgs(
          planet.location.coords.x,
          planet.location.coords.y,
        );

        this.terminal.current?.println(
          "REVEAL: calculated SNARK with args:",
          TerminalTextStyle.Sub,
        );
        this.terminal.current?.println(
          JSON.stringify(hexifyBigIntNestedArray(revealArgs.slice(0, 3))),
          TerminalTextStyle.Sub,
        );
        this.terminal.current?.newline();

        return revealArgs;
      };

      const txIntent: UnconfirmedReveal = {
        methodName: "revealLocation",
        contract: this.contractsAPI.contract,
        locationId: planetId,
        location: planet.location,
        args: getArgs(),
      };

      console.log(txIntent);

      // Always await the submitTransaction so we can catch rejections
      const tx = await this.contractsAPI.submitTransaction(txIntent);

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "revealLocation",
        (e as Error).message,
      );
      throw e;
    }
  }

  /**
   * claimLocation reveals a planet's location on-chain.
   */
  public async claimLocation(
    planetId: LocationId,
  ): Promise<Transaction<UnconfirmedClaim>> {
    try {
      if (!this.account) {
        throw new Error("no account set");
      }

      if (this.checkGameHasEnded()) {
        throw new Error("game has ended");
      }

      const planet = this.entityStore.getPlanetWithId(planetId);

      if (!planet) {
        throw new Error("you can't claim a planet you haven't discovered");
      }

      if (planet.owner !== this.account) {
        throw new Error("you can't claim a planet you down't own");
      }

      if (planet.claimer === this.account) {
        throw new Error("you've already claimed this planet");
      }

      if (!isLocatable(planet)) {
        throw new Error(
          "you can't reveal a planet whose coordinates you don't know",
        );
      }

      if (planet.transactions?.hasTransaction(isUnconfirmedClaimTx)) {
        throw new Error("you're already claiming this planet's location");
      }

      if (planet.planetLevel < PLANET_CLAIM_MIN_LEVEL) {
        throw new Error(
          `you can't claim a planet whose level is less than ${PLANET_CLAIM_MIN_LEVEL}`,
        );
      }

      if (this.entityStore.transactions.hasTransaction(isUnconfirmedClaimTx)) {
        throw new Error("you're already broadcasting coordinates");
      }

      const myLastClaimTimestamp = this.players.get(
        this.account,
      )?.lastClaimTimestamp;
      if (
        myLastClaimTimestamp &&
        Date.now() < this.getNextClaimAvailableTimestamp()
      ) {
        throw new Error("still on cooldown for claiming");
      }

      // this is shitty. used for the popup window
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-claimLocationId`,
        planetId,
      );

      const getArgs = async () => {
        const revealArgs = await this.snarkHelper.getRevealArgs(
          planet.location.coords.x,
          planet.location.coords.y,
        );
        this.terminal.current?.println(
          "REVEAL: calculated SNARK with args:",
          TerminalTextStyle.Sub,
        );
        this.terminal.current?.println(
          JSON.stringify(hexifyBigIntNestedArray(revealArgs.slice(0, 3))),
          TerminalTextStyle.Sub,
        );
        this.terminal.current?.newline();

        return revealArgs;
      };

      const txIntent: UnconfirmedClaim = {
        methodName: "claimLocation",
        locationId: planetId,
        location: planet.location,
        contract: this.contractsAPI.contract,
        args: getArgs(),
      };

      // Always await the submitTransaction so we can catch rejections
      const tx = await this.contractsAPI.submitTransaction(txIntent);

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "claimLocation",
        (e as Error).message,
      );
      throw e;
    }
  }

  /**
   * burnLocation reveals a planet's location on-chain.
   */

  public async burnLocation(
    planetId: LocationId,
  ): Promise<Transaction<UnconfirmedBurn>> {
    try {
      if (!this.account) {
        throw new Error("no account set");
      }

      if (this.checkGameHasEnded()) {
        throw new Error("game has ended");
      }

      const planet = this.entityStore.getPlanetWithId(planetId);

      if (!planet) {
        throw new Error("you can't burn a planet you haven't discovered");
      }

      if (!isLocatable(planet)) {
        throw new Error(
          "you can't reveal a planet whose coordinates you don't know",
        );
      }

      if (planet.destroyed || planet.frozen) {
        throw new Error("you can't burn destroyed/frozen planets");
      }

      if (planet.planetLevel <= 2) {
        throw new Error("require planetLevel>=3");
      }

      if (planet.owner !== this.account) {
        throw new Error("you don't own this planet");
      }

      if (
        planet.burnOperator !== undefined &&
        planet.burnOperator !== EMPTY_ADDRESS
      ) {
        throw new Error("someone already burn this planet");
      }

      if (planet.transactions?.hasTransaction(isUnconfirmedBurnTx)) {
        throw new Error("you're already burning this planet's location");
      }

      if (this.entityStore.transactions.hasTransaction(isUnconfirmedBurnTx)) {
        throw new Error("you're already burning this planet's location");
      }

      const myLastBurnTimestamp = this.players.get(
        this.account,
      )?.lastBurnTimestamp;

      if (
        myLastBurnTimestamp &&
        Date.now() < this.getNextBurnAvailableTimestamp()
      ) {
        throw new Error("still on cooldown for burning");
      }

      const playerSilver = this.players.get(this.account)?.silver;
      if (
        playerSilver &&
        playerSilver <
          this.contractConstants.BURN_PLANET_REQUIRE_SILVER_AMOUNTS[
            planet.planetLevel
          ]
      ) {
        throw new Error("player silver is not enough");
      }

      const activeArtifact = this.getActiveArtifact(planet);
      if (
        !activeArtifact ||
        activeArtifact.artifactType !== ArtifactType.Bomb
      ) {
        throw new Error("no active bomb on this planet");
      }

      // this is shitty. used for the popup window
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-burnLocationId`,
        planetId,
      );

      const getArgs = async () => {
        const revealArgs = await this.snarkHelper.getRevealArgs(
          planet.location.coords.x,
          planet.location.coords.y,
        );
        this.terminal.current?.println(
          "REVEAL: calculated SNARK with args:",
          TerminalTextStyle.Sub,
        );
        this.terminal.current?.println(
          JSON.stringify(hexifyBigIntNestedArray(revealArgs.slice(0, 3))),
          TerminalTextStyle.Sub,
        );
        this.terminal.current?.newline();

        return revealArgs;
      };

      const txIntent: UnconfirmedBurn = {
        methodName: "burnLocation",
        locationId: planetId,
        location: planet.location,
        contract: this.contractsAPI.contract,
        args: getArgs(),
      };

      // Always await the submitTransaction so we can catch rejections
      const tx = await this.contractsAPI.submitTransaction(txIntent);

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "burnLocation",
        (e as Error).message,
      );
      throw e;
    }
  }

  public checkPlanetCanPink(planetId: LocationId): boolean {
    if (!this.account) return false;
    const planet = this.getPlanetWithId(planetId);
    if (!planet) return false;
    if (!isLocatable(planet)) return false;
    const myPinkZones = this.getMyPinkZones();
    for (const pinkZone of myPinkZones) {
      const coords = pinkZone.coords;
      const radius = pinkZone.radius;

      const dis = this.getDistCoords(coords, planet.location.coords);

      if (dis <= radius) return true;
    }
    return false;
  }

  /**
   * return isCurrentlyPinking
   */
  public isCurrentlyPinking(): boolean {
    return !!this.entityStore.transactions.hasTransaction(isUnconfirmedPinkTx);
  }
  /**
   * pinkLocation reveals a planet's location on-chain.
   */

  public async pinkLocation(
    planetId: LocationId,
  ): Promise<Transaction<UnconfirmedPink>> {
    try {
      if (!this.account) {
        throw new Error("no account set");
      }

      if (this.checkGameHasEnded()) {
        throw new Error("game has ended");
      }

      const planet = this.entityStore.getPlanetWithId(planetId);

      if (!planet) {
        throw new Error("you can't pink a planet you haven't discovered");
      }

      if (!isLocatable(planet)) {
        throw new Error(
          "you can't pink a planet whose coordinates you don't know",
        );
      }

      if (planet.destroyed || planet.frozen) {
        throw new Error("you can't pink destroyed/frozen planets");
      }

      // if (planet.operator !== undefined && planet.operator !== EMPTY_ADDRESS) {
      //   throw new Error('someone already burn this planet');
      // }

      if (planet.transactions?.hasTransaction(isUnconfirmedPinkTx)) {
        throw new Error("you're already pinking this planet's location 1");
      }

      if (this.entityStore.transactions.hasTransaction(isUnconfirmedPinkTx)) {
        throw new Error("you're already pinking this planet's location 2");
      }

      // const myLastBurnTimestamp = this.players.get(this.account)?.lastBurnTimestamp;

      // if (myLastBurnTimestamp && Date.now() < this.getNextBurnAvailableTimestamp()) {
      //   throw new Error('still on cooldown for burning');
      // }
      if (!this.checkPlanetCanPink(planet.locationId)) {
        throw new Error("this planet don't in your pink zones");
      }

      // this is shitty. used for the popup window
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-pinkLocationId`,
        planetId,
      );

      const getArgs = async () => {
        const revealArgs = await this.snarkHelper.getRevealArgs(
          planet.location.coords.x,
          planet.location.coords.y,
        );
        this.terminal.current?.println(
          "REVEAL: calculated SNARK with args:",
          TerminalTextStyle.Sub,
        );
        this.terminal.current?.println(
          JSON.stringify(hexifyBigIntNestedArray(revealArgs.slice(0, 3))),
          TerminalTextStyle.Sub,
        );
        this.terminal.current?.newline();

        return revealArgs;
      };

      const txIntent: UnconfirmedPink = {
        methodName: "pinkLocation",
        locationId: planetId,
        location: planet.location,
        contract: this.contractsAPI.contract,
        args: getArgs(),
      };

      // Always await the submitTransaction so we can catch rejections
      const tx = await this.contractsAPI.submitTransaction(txIntent);

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "pinkLocation",
        (e as Error).message,
      );
      throw e;
    }
  }

  public async kardashev(
    planetId: LocationId,
  ): Promise<Transaction<UnconfirmedKardashev>> {
    try {
      if (!this.account) {
        throw new Error("no account set");
      }

      if (this.checkGameHasEnded()) {
        throw new Error("game has ended");
      }

      const planet = this.entityStore.getPlanetWithId(planetId);

      if (!planet) {
        throw new Error("you can't kardashev a planet you haven't discovered");
      }

      if (!isLocatable(planet)) {
        throw new Error(
          "you can't reveal a planet whose coordinates you don't know",
        );
      }

      if (planet.destroyed || planet.frozen) {
        throw new Error("you can't kardashev destroyed/frozen planets");
      }

      if (planet.planetLevel <= 2) {
        throw new Error("require planet level>=3");
      }

      if (
        planet.kardashevOperator !== undefined &&
        planet.kardashevOperator !== EMPTY_ADDRESS
      ) {
        throw new Error("someone already kardashev this planet");
      }

      if (planet.transactions?.hasTransaction(isUnconfirmedKardashevTx)) {
        throw new Error("you're already kardasheving this planet's location");
      }

      if (
        this.entityStore.transactions.hasTransaction(isUnconfirmedKardashevTx)
      ) {
        throw new Error("you're already kardasheving coordinates");
      }

      const myLastKardashevTimestamp = this.players.get(
        this.account,
      )?.lastKardashevTimestamp;

      if (
        myLastKardashevTimestamp &&
        Date.now() < this.getNextKardashevAvailableTimestamp()
      ) {
        throw new Error("still on cooldown for kardasheving");
      }

      const playerSilver = this.players.get(this.account)?.silver;
      if (
        playerSilver &&
        playerSilver <
          this.contractConstants.KARDASHEV_REQUIRE_SILVER_AMOUNTS[
            planet.planetLevel
          ]
      ) {
        throw new Error("player silver is not enough");
      }

      const activeArtifact = this.getActiveArtifact(planet);
      if (
        !activeArtifact ||
        activeArtifact.artifactType !== ArtifactType.Kardashev
      ) {
        throw new Error("no active kardashev on this planet");
      }

      if (
        Date.now() - 1000 * activeArtifact.lastActivated <=
        1000 * this.contractConstants.KARDASHEV_PLANET_COOLDOWN
      ) {
        throw new Error("still on cooldown for kardasheving");
      }

      // this is shitty. used for the popup window
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-kardashevLocationId`,
        planetId,
      );

      const getArgs = async () => {
        const revealArgs = await this.snarkHelper.getRevealArgs(
          planet.location.coords.x,
          planet.location.coords.y,
        );
        this.terminal.current?.println(
          "REVEAL: calculated SNARK with args:",
          TerminalTextStyle.Sub,
        );
        this.terminal.current?.println(
          JSON.stringify(hexifyBigIntNestedArray(revealArgs.slice(0, 3))),
          TerminalTextStyle.Sub,
        );
        this.terminal.current?.newline();

        return revealArgs;
      };

      const txIntent: UnconfirmedKardashev = {
        methodName: "kardashev",
        locationId: planetId,
        location: planet.location,
        contract: this.contractsAPI.contract,
        args: getArgs(),
      };

      // Always await the submitTransaction so we can catch rejections
      const tx = await this.contractsAPI.submitTransaction(txIntent);

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "kardashev",
        (e as Error).message,
      );
      throw e;
    }
  }

  public checkPlanetCanBlue(planetId: LocationId): boolean {
    if (!this.account) return false;
    const planet = this.getPlanetWithId(planetId);
    if (!planet) return false;
    if (!isLocatable(planet)) return false;
    const centerPlanetId = this.getBlueZoneCenterPlanetId(planetId);

    if (!centerPlanetId) return false;
    if (centerPlanetId === planetId) return false;
    return true;
  }

  /**
   * return isCurrentlyBlueing
   */
  public isCurrentlyBlueing(): boolean {
    return !!this.entityStore.transactions.hasTransaction(isUnconfirmedBlueTx);
  }

  /**
   * blueLocation reveals a planet's location on-chain.
   */

  public async blueLocation(
    planetId: LocationId,
  ): Promise<Transaction<UnconfirmedBlue>> {
    try {
      if (!this.account) {
        throw new Error("no account set");
      }

      if (this.checkGameHasEnded()) {
        throw new Error("game has ended");
      }

      const planet = this.entityStore.getPlanetWithId(planetId);

      if (!planet) {
        throw new Error("you can't blue a planet you haven't discovered");
      }

      if (!isLocatable(planet)) {
        throw new Error(
          "you can't blue a planet whose coordinates you don't know",
        );
      }

      if (planet.destroyed || planet.frozen) {
        throw new Error("you can't blue destroyed/frozen planets");
      }

      if (planet.planetLevel < 3) {
        throw new Error("planet level requires >= 3");
      }

      const centerPlanetId = this.getBlueZoneCenterPlanetId(planetId);
      if (centerPlanetId === undefined) {
        throw new Error("this planet is not in your blue zones");
      }

      const centerPlanet = this.getPlanetWithId(centerPlanetId);

      if (
        centerPlanet === undefined ||
        centerPlanet.kardashevTimestamp === undefined
      ) {
        throw new Error("can't blue this planet");
      }

      if (centerPlanetId === planetId) {
        throw new Error("can't blue center planet");
      }

      const timeCheckPassed =
        this.getNextBlueAvailableTimestamp(planetId) <= Date.now();

      if (!timeCheckPassed) {
        throw new Error("still in cooldown time");
      }

      if (
        centerPlanet.owner !== planet.owner ||
        centerPlanet.owner !== this.account
      ) {
        throw new Error("center planet need to be yours");
      }

      if (planet.transactions?.hasTransaction(isUnconfirmedBlueTx)) {
        throw new Error("you're already blueing this planet's location 1");
      }

      if (this.entityStore.transactions.hasTransaction(isUnconfirmedBlueTx)) {
        throw new Error("you're already blueing this planet's location 2");
      }

      // this is shitty. used for the popup window
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-blueLocationId`,
        planetId,
      );

      const getArgs = async () => {
        const revealArgs = await this.snarkHelper.getRevealArgs(
          planet.location.coords.x,
          planet.location.coords.y,
        );
        this.terminal.current?.println(
          "REVEAL: calculated SNARK with args:",
          TerminalTextStyle.Sub,
        );
        this.terminal.current?.println(
          JSON.stringify(hexifyBigIntNestedArray(revealArgs.slice(0, 3))),
          TerminalTextStyle.Sub,
        );
        this.terminal.current?.newline();

        return revealArgs;
      };

      const txIntent: UnconfirmedBlue = {
        methodName: "blueLocation",
        locationId: planetId,
        location: planet.location,
        contract: this.contractsAPI.contract,
        args: getArgs(),
      };

      // Always await the submitTransaction so we can catch rejections
      const tx = await this.contractsAPI.submitTransaction(txIntent);

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "blueLocation",
        (e as Error).message,
      );
      throw e;
    }
  }

  public async invadePlanet(locationId: LocationId) {
    try {
      if (!this.captureZoneGenerator) {
        throw new Error("Capture zones are not enabled in this game");
      }

      const planet = this.entityStore.getPlanetWithId(locationId);

      if (!planet || !isLocatable(planet)) {
        throw new Error("you can't invade a planet you haven't discovered");
      }

      if (planet.destroyed || planet.frozen) {
        throw new Error("you can't invade destroyed/frozen planets");
      }

      if (planet.invader !== EMPTY_ADDRESS) {
        throw new Error(
          "you can't invade planets that have already been invaded",
        );
      }

      if (planet.owner !== this.account) {
        throw new Error("you can only invade planets you own");
      }

      if (!this.captureZoneGenerator.isInZone(planet.locationId)) {
        throw new Error(
          "you can't invade planets that are not in a capture zone",
        );
      }

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-invadePlanet`,
        locationId,
      );

      const getArgs = async () => {
        const revealArgs = await this.snarkHelper.getRevealArgs(
          planet.location.coords.x,
          planet.location.coords.y,
        );

        this.terminal.current?.println(
          "REVEAL: calculated SNARK with args:",
          TerminalTextStyle.Sub,
        );
        this.terminal.current?.println(
          JSON.stringify(hexifyBigIntNestedArray(revealArgs.slice(0, 3))),
          TerminalTextStyle.Sub,
        );
        this.terminal.current?.newline();

        return revealArgs;
      };

      const txIntent: UnconfirmedInvadePlanet = {
        methodName: "invadePlanet",
        contract: this.contractsAPI.contract,
        locationId,
        args: getArgs(),
      };

      const tx = await this.contractsAPI.submitTransaction(txIntent);
      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "invadePlanet",
        (e as Error).message,
      );
      throw e;
    }
  }

  public async capturePlanet(locationId: LocationId) {
    try {
      const planet = this.entityStore.getPlanetWithId(locationId);

      if (!planet) {
        throw new Error("planet is not loaded");
      }

      if (planet.destroyed || planet.frozen) {
        throw new Error("you can't capture destroyed/frozen planets");
      }

      if (planet.capturer !== EMPTY_ADDRESS) {
        throw new Error(
          "you can't capture planets that have already been captured",
        );
      }

      if (planet.owner !== this.account) {
        throw new Error("you can only capture planets you own");
      }

      if (planet.energy < planet.energyCap * 0.8) {
        throw new Error("the planet needs >80% energy before capturing");
      }

      if (
        !planet.invadeStartBlock ||
        this.ethConnection.getCurrentBlockNumber() <
          planet.invadeStartBlock +
            this.contractConstants.CAPTURE_ZONE_HOLD_BLOCKS_REQUIRED
      ) {
        throw new Error(
          `you need to hold a planet for ${this.contractConstants.CAPTURE_ZONE_HOLD_BLOCKS_REQUIRED} blocks before capturing`,
        );
      }

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-capturePlanet`,
        locationId,
      );

      const txIntent: UnconfirmedCapturePlanet = {
        methodName: "capturePlanet",
        contract: this.contractsAPI.contract,
        locationId,
        args: Promise.resolve([locationIdToDecStr(locationId)]),
      };

      const tx = await this.contractsAPI.submitTransaction(txIntent);
      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "capturePlanet",
        (e as Error).message,
      );
      throw e;
    }
  }

  /**
   * Attempts to join the game. Should not be called once you've already joined.
   */
  public async joinGame(
    beforeRetry: (e: Error) => Promise<boolean>,
    _selectedCoords: { x: number; y: number },
    spectate: boolean,
  ): Promise<void> {
    if (spectate) {
      this.initMiningManager({ x: 0, y: 0 });
      this.emit(GameManagerEvent.InitializedPlayer);
    }
    try {
      // if (this.checkGameHasEnded()) {
      //   throw new Error('game has ended');
      // }

      const planet = await this.findRandomHomePlanet(_selectedCoords);
      this.homeLocation = planet.location;
      this.terminal.current?.println("");
      this.terminal.current?.println(
        `Found Suitable Home Planet: ${getPlanetName(planet)}, coordinates: (${
          planet.location.coords.x
        }, ${planet.location.coords.y})`,
        TerminalTextStyle.Pink,
      );
      this.terminal.current?.newline();

      await this.persistentChunkStore.addHomeLocation(planet.location);

      let txIntentCompleted = false;
      const getArgs = async () => {
        const args = await this.snarkHelper.getInitArgs(
          planet.location.coords.x,
          planet.location.coords.y,
          Math.floor(
            Math.sqrt(
              planet.location.coords.x ** 2 + planet.location.coords.y ** 2,
            ),
          ) + 1,
        );

        this.terminal.current?.println(
          "INIT: calculated SNARK with args:",
          TerminalTextStyle.Sub,
        );
        this.terminal.current?.println(
          JSON.stringify(
            hexifyBigIntNestedArray(args.slice(0, 3) as unknown as string[]),
          ),
          TerminalTextStyle.Text,
        );
        this.terminal.current?.newline();

        txIntentCompleted = true;
        return args;
        // return [...args, distFromOriginSquare];
      };

      const txIntent: UnconfirmedInit = {
        methodName: "initializePlayer",
        contract: this.contractsAPI.contract,
        locationId: planet.location.hash,
        location: planet.location,
        args: getArgs(),
      };

      this.terminal.current?.println(
        "INIT: proving that planet exists",
        TerminalTextStyle.Sub,
      );

      this.initMiningManager(planet.location.coords); // get an early start

      // if player initialization causes an error, give the caller an opportunity
      // to resolve that error. if the asynchronous `beforeRetry` function returns
      // true, retry initializing the player. if it returns false, or if the
      // `beforeRetry` is undefined, then don't retry and throw an exception.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          const entryFee = await this.contractsAPI.getEntryFee();
          console.log("entry fee: ", entryFee.toString());
          localStorage.setItem(
            `${this.getAccount()?.toLowerCase()}-entryFee`,
            entryFee.toString(),
          );

          const tx = await this.contractsAPI.submitTransaction(txIntent, {
            value: entryFee.toString(),
          });
          await tx.confirmedPromise;
          break;
        } catch (e) {
          if (beforeRetry) {
            // make sure the tx intent has completed so all the message are printed together.
            while (!txIntentCompleted) {
              await sleep(100);
            }

            if (await beforeRetry(e)) {
              continue;
            }
          } else {
            throw e;
          }
        }
      }

      await this.getSpaceships();
      await this.hardRefreshPlanet(planet.locationId);

      this.emit(GameManagerEvent.InitializedPlayer);
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "initializePlayer",
        (e as Error).message,
      );
      throw e;
    }
  }
  // mytodo: some player can't get spaceships, the homeLocation.hash is not right
  private async getSpaceships() {
    if (!this.account) return;
    if (
      !Object.values(this.contractConstants.SPACESHIPS).some((a) => a === true)
    ) {
      console.log("all spaceships disabled, not calling the tx");
      return;
    }

    const player = await this.contractsAPI.getPlayerById(this.account);
    if (!player) return;
    if (player?.claimedShips) return;

    if (this.getGameObjects().isGettingSpaceships()) return;

    const homePlanetLocationId = "0x" + player.homePlanetId;

    console.log("fix: getSpaceships");
    console.log("  homeLocation.hash :", "0x" + this.homeLocation?.hash);
    console.log("player.homePlanetId :", homePlanetLocationId);

    const tx = await this.contractsAPI.submitTransaction({
      methodName: "giveSpaceShips",
      contract: this.contractsAPI.contract,
      args: Promise.resolve([homePlanetLocationId]),
    });
    await tx.confirmedPromise;
    this.hardRefreshPlanet(player.homePlanetId);
  }
  // private async getSpaceships() {
  //   if (!this.account || !this.homeLocation?.hash) return;
  //   if (!Object.values(this.contractConstants.SPACESHIPS).some((a) => a === true)) {
  //     console.log('all spaceships disabled, not calling the tx');
  //     return;
  //   }

  //   const player = await this.contractsAPI.getPlayerById(this.account);
  //   if (player?.claimedShips) return;

  //   if (this.getGameObjects().isGettingSpaceships()) return;

  //   console.log('function: getSpaceships');
  //   console.log('0x' + this.homeLocation?.hash);

  //   const tx = await this.contractsAPI.submitTransaction({
  //     methodName: 'giveSpaceShips',
  //     contract: this.contractsAPI.contract,
  //     args: Promise.resolve(['0x' + this.homeLocation?.hash]),
  //   });
  //   await tx.confirmedPromise;
  //   this.hardRefreshPlanet(this.homeLocation?.hash);
  // }

  // this is slow, do not call in i.e. render/draw loop
  /**
   *
   * computes the WorldLocation object corresponding to a set of coordinates
   * very slow since it actually calculates the hash; do not use in render loop
   */
  private locationFromCoords(coords: WorldCoords): WorldLocation {
    return {
      coords,
      hash: locationIdFromBigInt(this.planetHashMimc(coords.x, coords.y)),
      perlin: this.spaceTypePerlin(coords, true),
      biomebase: this.biomebasePerlin(coords, true),
    };
  }

  /**
   * Initializes a new player's game to start at the given home planet. Must have already
   * initialized the player on the contract.
   */
  async addAccount(coords: WorldCoords): Promise<boolean> {
    const loc: WorldLocation = this.locationFromCoords(coords);
    await this.persistentChunkStore.addHomeLocation(loc);
    this.initMiningManager(coords);
    this.homeLocation = loc;
    return true;
  }

  private async findRandomHomePlanet(_selectedCoords: {
    x: number;
    y: number;
  }): Promise<LocatablePlanet> {
    this.terminal.current?.newline();
    this.terminal.current?.println(`Initializing Home Planet Search...`);
    this.terminal.current?.println(
      "This may take up to 120s, and will consume a lot of CPU.",
    );

    // let other things happen in the bg.
    await sleep(10);

    return new Promise<LocatablePlanet>((resolve, reject) => {
      const initPerlinMin = this.contractConstants.INIT_PERLIN_MIN;
      const initPerlinMax = this.contractConstants.INIT_PERLIN_MAX;
      let minedChunksCount = 0;

      const x: number = _selectedCoords.x;
      const y: number = _selectedCoords.y;
      const d: number = Math.sqrt(x ** 2 + y ** 2);
      // const p: number = this.spaceTypePerlin({ x, y }, false);

      // if this.contractConstants.SPAWN_RIM_AREA is non-zero, then players must spawn in that
      // area, distributed evenly in the inner perimeter of the world
      // let spawnInnerRadius = Math.sqrt(
      //   Math.max(Math.PI * this.worldRadius ** 2 - this.contractConstants.SPAWN_RIM_AREA, 0) /
      //     Math.PI
      // );

      // if (this.contractConstants.SPAWN_RIM_AREA === 0) {
      //   spawnInnerRadius = 0;
      // }

      const requireRadiusMin = this.contractConstants.MAX_LEVEL_DIST[1];
      // const requireRadiusMax = this.contractConstants.MAX_LEVEL_DIST[0];
      const checkCoords = () => {
        console.log(d);
        console.log("[" + requireRadiusMin + ",+)");
        return d >= requireRadiusMin;
      };

      //NOTE: check coords
      console.log(checkCoords());

      // do {
      //   // sample from square
      //   x = Math.random() * this.worldRadius * 2 - this.worldRadius;
      //   y = Math.random() * this.worldRadius * 2 - this.worldRadius;
      //   d = Math.sqrt(x ** 2 + y ** 2);
      //   p = this.spaceTypePerlin({ x, y }, false);
      // } while (
      //   p >= initPerlinMax || // keep searching if above or equal to the max
      //   p < initPerlinMin || // keep searching if below the minimum
      //   d >= this.worldRadius || // can't be out of bound
      //   d <= spawnInnerRadius // can't be inside spawn area ring
      // );

      // when setting up a new account in development mode, you can tell
      // the game where to start searching for planets using this query
      // string parameter. for example:
      //
      // ?searchCenter=2866,5627
      //

      const pattern: MiningPattern = new SpiralPattern(
        { x, y },
        MIN_CHUNK_SIZE,
      );

      const chunkStore = new HomePlanetMinerChunkStore(
        initPerlinMin,
        initPerlinMax,
        this.hashConfig,
      );
      const homePlanetFinder = MinerManager.create(
        chunkStore,
        pattern,
        this.worldRadius,
        this.planetRarity,
        this.hashConfig,
        this.useMockHash,
      );

      this.terminal.current?.println(``);
      this.terminal.current?.println(`Chunked explorer: start!`);
      this.terminal.current?.println(
        `Each chunk contains ${MIN_CHUNK_SIZE}x${MIN_CHUNK_SIZE} coordinates.`,
      );
      const percentSpawn = (1 / this.contractConstants.PLANET_RARITY) * 100;
      const printProgress = 4;
      this.terminal.current?.print(`Each coordinate has a`);
      this.terminal.current?.print(` ${percentSpawn}%`, TerminalTextStyle.Text);
      this.terminal.current?.print(` chance of spawning a planet.`);
      this.terminal.current?.println("");

      this.terminal.current?.newline();
      this.terminal.current?.println(
        "It may take a long time to wait here. You can choose to wait for a while or refresh the web page.",
        TerminalTextStyle.Pink,
      );
      this.terminal.current?.newline();

      this.terminal.current?.println(
        `Hashing first ${MIN_CHUNK_SIZE ** 2 * printProgress} potential home planets...`,
      );

      let done = false;
      let index = 1;
      const values = [".", "..", "...", "....", ".....", "......"];
      let lastChunkSize: number | undefined;
      let chunkSize: number | undefined;
      const printProgressFn = () => {
        if (done) {
          return;
        }

        if (chunkSize) {
          if (lastChunkSize) {
            this.terminal.current?.removeLast(2);
          }
          if (lastChunkSize && lastChunkSize !== chunkSize) {
            this.terminal.current?.println(
              `Hashed ${lastChunkSize * MIN_CHUNK_SIZE ** 2} potential home planets${
                values[index - 1]
              }`,
            );
            index = 1;
          }

          this.terminal.current?.println(
            `Hashed ${chunkSize * MIN_CHUNK_SIZE ** 2} potential home planets${values[index - 1]}`,
          );
          index = (index % 6) + 1;
          lastChunkSize = chunkSize;
        }
        setTimeout(printProgressFn, 180);
      };
      printProgressFn();

      homePlanetFinder.on(
        MinerManagerEvent.DiscoveredNewChunk,
        (chunk: Chunk) => {
          chunkStore.addChunk(chunk);
          minedChunksCount++;

          if (minedChunksCount % printProgress === 0) {
            chunkSize = minedChunksCount;
          }
          for (const homePlanetLocation of chunk.planetLocations) {
            const planetPerlin = homePlanetLocation.perlin;
            const planetX = homePlanetLocation.coords.x;
            const planetY = homePlanetLocation.coords.y;
            const distFromOrigin = Math.sqrt(planetX ** 2 + planetY ** 2);

            //###############
            //  NEW MAP ALGO
            //###############
            const planetLevel = this.entityStore.planetLevelFromHexPerlin(
              homePlanetLocation.hash,
              homePlanetLocation.perlin,
              distFromOrigin,
            );
            const planetType = this.entityStore.planetTypeFromHexPerlin(
              homePlanetLocation.hash,
              homePlanetLocation.perlin,
              distFromOrigin,
            );

            const spaceType = this.spaceTypeFromPerlin(
              planetPerlin,
              Math.floor(distFromOrigin),
            );

            const planet = this.getPlanetWithId(homePlanetLocation.hash);

            if (
              spaceType === SpaceType.NEBULA && //only NEBULA
              planetPerlin < initPerlinMax &&
              planetPerlin >= initPerlinMin &&
              distFromOrigin < this.worldRadius &&
              // distFromOrigin >= spawnInnerRadius &&
              distFromOrigin >= requireRadiusMin &&
              // distFromOrigin < requireRadiusMax &&
              planetLevel === MIN_PLANET_LEVEL &&
              planetType === PlanetType.PLANET &&
              (!planet || !planet.isInContract) // init will fail if planet has been initialized in contract already
            ) {
              // valid home planet
              homePlanetFinder.stopExplore();
              homePlanetFinder.destroy();

              const homePlanet =
                this.getGameObjects().getPlanetWithLocation(homePlanetLocation);

              if (!homePlanet) {
                reject(
                  new Error(
                    "Unable to create default planet for your home planet's location.",
                  ),
                );
              } else {
                // tell the printProgressFn to stop
                done = true;
                // can cast to `LocatablePlanet` because we know its location, as we just mined it.
                resolve(homePlanet as LocatablePlanet);
              }

              break;
            }
          }
        },
      );
      homePlanetFinder.startExplore();
    });
  }

  public async prospectPlanet(
    planetId: LocationId,
    bypassChecks = false,
  ): Promise<Transaction<UnconfirmedProspectPlanet>> {
    const planet = this.entityStore.getPlanetWithId(planetId);

    try {
      if (!planet || !isLocatable(planet)) {
        throw new Error("you can't prospect a planet you haven't discovered");
      }

      if (!bypassChecks) {
        if (this.checkGameHasEnded()) throw new Error("game ended");

        if (!planet) {
          throw new Error("you can't prospect a planet you haven't discovered");
        }

        if (planet.owner !== this.getAccount()) {
          throw new Error("you can't prospect a planet you don't own");
        }

        if (!isLocatable(planet)) {
          throw new Error("you don't know this planet's location");
        }

        if (planet.prospectedBlockNumber !== undefined) {
          throw new Error("someone already prospected this planet");
        }

        if (
          planet.transactions?.hasTransaction(isUnconfirmedProspectPlanetTx)
        ) {
          throw new Error("you're already looking bro...");
        }

        if (planet.planetType !== PlanetType.RUINS) {
          throw new Error("this planet doesn't have an artifact on it.");
        }
      }

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-prospectPlanet`,
        planetId,
      );

      const txIntent: UnconfirmedProspectPlanet = {
        methodName: "prospectPlanet",
        contract: this.contractsAPI.contract,
        planetId: planetId,
        args: Promise.resolve([locationIdToDecStr(planetId)]),
      };

      const tx = await this.contractsAPI.submitTransaction(txIntent);

      tx.confirmedPromise.then(() =>
        NotificationManager.getInstance().artifactProspected(
          planet as LocatablePlanet,
        ),
      );

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "prospectPlanet",
        (e as Error).message,
      );
      throw e;
    }
  }

  /**
   * Calls the contract to find an artifact on the given planet.
   */
  public async findArtifact(
    planetId: LocationId,
    bypassChecks = false,
  ): Promise<Transaction<UnconfirmedFindArtifact>> {
    const planet = this.entityStore.getPlanetWithId(planetId);

    try {
      if (!planet) {
        throw new Error(
          "you can't find artifacts on a planet you haven't discovered",
        );
      }

      if (!isLocatable(planet)) {
        throw new Error("you don't know the biome of this planet");
      }

      if (!bypassChecks) {
        if (this.checkGameHasEnded()) {
          throw new Error("game has ended");
        }

        if (planet.owner !== this.getAccount()) {
          throw new Error("you can't find artifacts on planets you don't own");
        }

        if (planet.hasTriedFindingArtifact) {
          throw new Error(
            "someone already tried finding an artifact on this planet",
          );
        }

        if (planet.transactions?.hasTransaction(isUnconfirmedFindArtifactTx)) {
          throw new Error("you're already looking bro...");
        }

        if (planet.planetType !== PlanetType.RUINS) {
          throw new Error("this planet doesn't have an artifact on it.");
        }
      }

      // this is shitty. used for the popup window
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-findArtifactOnPlanet`,
        planetId,
      );

      const txIntent: UnconfirmedFindArtifact = {
        methodName: "findArtifact",
        contract: this.contractsAPI.contract,
        planetId: planet.locationId,
        args: this.snarkHelper.getFindArtifactArgs(
          planet.location.coords.x,
          planet.location.coords.y,
        ),
      };

      const tx =
        await this.contractsAPI.submitTransaction<UnconfirmedFindArtifact>(
          txIntent,
        );

      tx.confirmedPromise
        .then(() => {
          return this.waitForPlanet<Artifact>(
            planet.locationId,
            ({ current }: Diff<Planet>) => {
              return current.heldArtifactIds
                .map(this.getArtifactWithId.bind(this))
                .find(
                  (a: Artifact) => a?.planetDiscoveredOn === planet.locationId,
                ) as Artifact;
            },
          ).then((foundArtifact) => {
            if (!foundArtifact) throw new Error("Artifact not found?");
            const notifManager = NotificationManager.getInstance();

            notifManager.artifactFound(
              planet as LocatablePlanet,
              foundArtifact,
            );
          });
        })
        .catch(console.log);

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "findArtifact",
        (e as Error).message,
      );
      throw e;
    }
  }

  getContractConstants(): ContractConstants {
    return this.contractConstants;
  }

  /**
   * Submits a transaction to the blockchain to deposit an artifact on a given planet.
   * You must own the planet and you must own the artifact directly (can't be locked in contract)
   */
  public async depositArtifact(
    locationId: LocationId,
    artifactId: ArtifactId,
  ): Promise<Transaction<UnconfirmedDepositArtifact>> {
    try {
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-depositPlanet`,
        locationId,
      );
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-depositArtifact`,
        artifactId,
      );

      // if (this.checkGameHasEnded()) {
      //   const error = new Error('game has ended');
      //   this.getNotificationsManager().txInitError('depositArtifact', error.message);
      //   throw error;
      // }

      const txIntent: UnconfirmedDepositArtifact = {
        methodName: "depositArtifact",
        contract: this.contractsAPI.contract,
        locationId,
        artifactId,
        args: Promise.resolve([
          locationIdToDecStr(locationId),
          artifactIdToDecStr(artifactId),
        ]),
      };

      const tx = await this.contractsAPI.submitTransaction(txIntent);

      tx.confirmedPromise.then(() =>
        this.getGameObjects().updateArtifact(
          artifactId,
          (a) => (a.onPlanetId = locationId),
        ),
      );

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "depositArtifact",
        (e as Error).message,
      );
      throw e;
    }
  }

  /**
   * Withdraws the artifact that is locked up on the given planet.
   */
  public async withdrawArtifact(
    locationId: LocationId,
    artifactId: ArtifactId,
    bypassChecks = true,
  ): Promise<Transaction<UnconfirmedWithdrawArtifact>> {
    try {
      if (!bypassChecks) {
        // if (this.checkGameHasEnded()) {
        //   throw new Error('game has ended');
        // }
        const planet = this.entityStore.getPlanetWithId(locationId);
        if (!planet) {
          throw new Error("tried to withdraw from unknown planet");
        }
        if (!artifactId) {
          throw new Error("must supply an artifact id");
        }
      }

      // this is shitty. used for the popup window
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-withdrawPlanet`,
        locationId,
      );
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-withdrawArtifact`,
        artifactId,
      );

      const txIntent: UnconfirmedWithdrawArtifact = {
        methodName: "withdrawArtifact",
        contract: this.contractsAPI.contract,
        args: Promise.resolve([
          locationIdToDecStr(locationId),
          artifactIdToDecStr(artifactId),
        ]),
        locationId,
        artifactId,
      };

      this.terminal.current?.println(
        "WITHDRAW_ARTIFACT: sending withdrawal to blockchain",
        TerminalTextStyle.Sub,
      );
      this.terminal.current?.newline();

      const tx = await this.contractsAPI.submitTransaction(txIntent);

      tx.confirmedPromise.then(() =>
        this.getGameObjects().updateArtifact(
          artifactId,
          (a) => (a.onPlanetId = undefined),
        ),
      );

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "withdrawArtifact",
        (e as Error).message,
      );
      throw e;
    }
  }

  public async activateArtifact(
    locationId: LocationId,
    artifactId: ArtifactId,
    linkTo: LocationId | undefined,
    bypassChecks = false,
  ): Promise<Transaction<UnconfirmedActivateArtifact>> {
    try {
      // if (this.checkGameHasEnded()) {
      //   throw new Error('game has ended');
      // }

      if (!this.account) {
        throw new Error("no account set");
      }

      if (!bypassChecks) {
        const planet = this.entityStore.getPlanetWithId(locationId);
        // if (this.checkGameHasEnded()) {
        //   throw new Error('game has ended');
        // }

        if (!planet) {
          throw new Error("tried to activate on an unknown planet");
        }
        if (!artifactId) {
          throw new Error("must supply an artifact id");
        }
        // const myLastActivateArtifactTimestamp = this.players.get(
        //   this.account
        // )?.lastActivateArtifactTimestamp;

        // if (
        //   myLastActivateArtifactTimestamp &&
        //   Date.now() < this.getNextActivateArtifactAvailableTimestamp()
        // ) {
        //   throw new Error('still on cooldown for activating artifact');
        // }
      }

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-activatePlanet`,
        locationId,
      );
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-activateArtifact`,
        artifactId,
      );

      const txIntent: UnconfirmedActivateArtifact = {
        methodName: "activateArtifact",
        contract: this.contractsAPI.contract,
        args: Promise.resolve([
          locationIdToDecStr(locationId),
          artifactIdToDecStr(artifactId),
          linkTo ? locationIdToDecStr(linkTo) : "0",
        ]),
        locationId,
        artifactId,
        linkTo,
      };

      // Always await the submitTransaction so we can catch rejections
      const tx = await this.contractsAPI.submitTransaction(txIntent);

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "activateArtifact",
        (e as Error).message,
      );
      throw e;
    }
  }

  public async deactivateArtifact(
    locationId: LocationId,
    artifactId: ArtifactId,
    linkTo: LocationId | undefined,
    bypassChecks = false,
  ): Promise<Transaction<UnconfirmedDeactivateArtifact>> {
    try {
      if (!bypassChecks) {
        const planet = this.entityStore.getPlanetWithId(locationId);
        if (!planet) {
          throw new Error("tried to deactivate on an unknown planet");
        }
      }

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-deactivatePlanet`,
        locationId,
      );
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-deactivateArtifact`,
        artifactId,
      );

      const txIntent: UnconfirmedDeactivateArtifact = {
        methodName: "deactivateArtifact",
        contract: this.contractsAPI.contract,
        args: Promise.resolve([locationIdToDecStr(locationId)]),
        locationId,
        artifactId,
        linkTo,
      };

      // Always await the submitTransaction so we can catch rejections
      const tx = await this.contractsAPI.submitTransaction(txIntent);

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "deactivateArtifact",
        (e as Error).message,
      );
      throw e;
    }
  }

  public async changeArtifactImageType(
    locationId: LocationId,
    artifactId: ArtifactId,
    newImageType: number,
    bypassChecks = false,
  ): Promise<Transaction<UnconfirmedChangeArtifactImageType>> {
    try {
      if (!bypassChecks) {
        const planet = this.entityStore.getPlanetWithId(locationId);
        if (!planet) {
          throw new Error(
            "tried to changeArtrtifactImageType on an unknown planet",
          );
        }
      }

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-changeArtifactImageType-locationId`,
        locationId,
      );
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-changeArtifactImageType-artifactId`,
        artifactId,
      );
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-changeArtifactImageType-newImageType`,
        newImageType.toString(),
      );

      const txIntent: UnconfirmedChangeArtifactImageType = {
        methodName: "changeArtifactImageType",
        contract: this.contractsAPI.contract,
        args: Promise.resolve([
          locationIdToDecStr(locationId),
          artifactIdToDecStr(artifactId),
          newImageType,
        ]),
        locationId,
        artifactId,
        newImageType,
      };

      // Always await the submitTransaction so we can catch rejections
      const tx = await this.contractsAPI.submitTransaction(txIntent);

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "deactivateArtifact",
        (e as Error).message,
      );
      throw e;
    }
  }

  public async buyArtifact(
    locationId: LocationId,
    rarity: ArtifactRarity,
    biome: Biome,
    type: ArtifactType,
    bypassChecks = false,
  ): Promise<Transaction<UnconfirmedBuyArtifact>> {
    try {
      if (!bypassChecks) {
        const planet = this.entityStore.getPlanetWithId(locationId);
        if (!planet) {
          throw new Error("tried to buy artifact on an unknown planet");
        }
      }

      const halfPrice = this.getHalfPrice();

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-buyArtifactOnPlanet`,
        locationId,
      );

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-buyArtifactType`,
        Number(type).toString(),
      );

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-buyArtifactRarity`,
        Number(rarity).toString(),
      );

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-halfPrice`,
        halfPrice.toString(),
      );

      // localStorage.setItem(`${this.getAccount()?.toLowerCase()}-buyArtifact`, artifactId);

      // eslint-disable-next-line no-inner-declarations
      function random256Id() {
        const alphabet = "0123456789ABCDEF".split("");
        let result = "0x";
        for (let i = 0; i < 256 / 4; i++) {
          result += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        result = result.toLowerCase();
        return result;
      }

      // eslint-disable-next-line no-inner-declarations
      function isTypeOK() {
        const val = Number(type);
        if (val === Number(ArtifactType.Wormhole)) return true;
        if (val === Number(ArtifactType.PlanetaryShield)) return true;
        if (val === Number(ArtifactType.BloomFilter)) return true;
        if (val === Number(ArtifactType.FireLink)) return true;
        if (val === Number(ArtifactType.StellarShield)) return true;
        if (val === Number(ArtifactType.Avatar)) return true;

        return false;
      }

      // eslint-disable-next-line no-inner-declarations
      function price() {
        return 50;
        const rarityVal = parseInt(rarity.toString());
        const typeVal = parseInt(type.toString());

        if (rarityVal === 0 || rarityVal >= 5) return 0;
        if (isTypeOK() === false) return 0;
        if (
          typeVal === Number(ArtifactType.Wormhole) ||
          typeVal === Number(ArtifactType.PlanetaryShield) ||
          typeVal === Number(ArtifactType.BloomFilter) ||
          typeVal === Number(ArtifactType.FireLink)
        ) {
          return 2 ** (parseInt(rarity.toString()) - 1);
        } else if (typeVal === Number(ArtifactType.Avatar)) {
          return 1;
        } else if (typeVal === Number(ArtifactType.StellarShield)) {
          return 8;
        } else return 0;
      }

      //NOTE: this will not be the true artifactId
      const artifactId: ArtifactId = random256Id() as ArtifactId;

      const args = Promise.resolve([
        {
          tokenId: artifactId,
          discoverer: this.account,
          planetId: locationIdToDecStr(locationId),
          rarity,
          biome,
          artifactType: type,
          owner: this.account,
          controller: "0x0000000000000000000000000000000000000000",
          imageType: 0,
        },
      ]);

      const txIntent: UnconfirmedBuyArtifact = {
        methodName: "buyArtifact",
        contract: this.contractsAPI.contract,
        args: args,
        locationId,
        artifactId,
      };

      // Always await the submitTransaction so we can catch rejections

      const tx = await this.contractsAPI.submitTransaction(txIntent, {
        // NOTE: when change gasLimit, need change the value in TxConfirmPopup.tsx
        gasLimit: 2000000,
        value: halfPrice
          ? bigInt(500_000_000_000_000).toString()
          : bigInt(1_000_000_000_000_000).toString(), //0.001eth
      });

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "buyArtifact",
        (e as Error).message,
      );
      throw e;
    }
  }

  public async withdrawSilver(
    locationId: LocationId,
    amount: number,
    bypassChecks = false,
  ): Promise<Transaction<UnconfirmedWithdrawSilver>> {
    try {
      if (!bypassChecks) {
        if (!this.account) throw new Error("no account");
        // if (this.checkGameHasEnded()) {
        //   throw new Error('game has ended');
        // }
        const planet = this.entityStore.getPlanetWithId(locationId);
        if (!planet) {
          throw new Error("tried to withdraw silver from an unknown planet");
        }
        if (planet.planetType !== PlanetType.TRADING_POST) {
          throw new Error("can only withdraw silver from spacetime rips");
        }
        if (planet.owner !== this.account) {
          throw new Error("can only withdraw silver from a planet you own");
        }
        if (
          planet.transactions?.hasTransaction(isUnconfirmedWithdrawSilverTx)
        ) {
          throw new Error(
            "a withdraw silver action is already in progress for this planet",
          );
        }
        if (amount > planet.silver) {
          throw new Error("not enough silver to withdraw!");
        }

        if (amount * 5 < planet.silverCap) {
          throw new Error("require silverAmount >= silverCap * 0.2");
        }

        if (amount === 0) {
          throw new Error("must withdraw more than 0 silver!");
        }

        if (planet.destroyed || planet.frozen) {
          throw new Error(
            "can't withdraw silver from a destroyed/frozen planet",
          );
        }
      }

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-withdrawSilverPlanet`,
        locationId,
      );

      const txIntent: UnconfirmedWithdrawSilver = {
        methodName: "withdrawSilver",
        contract: this.contractsAPI.contract,
        args: Promise.resolve([
          locationIdToDecStr(locationId),
          amount * CONTRACT_PRECISION,
        ]),
        locationId,
        amount,
      };

      // Always await the submitTransaction so we can catch rejections
      const tx = await this.contractsAPI.submitTransaction(txIntent);

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "withdrawSilver",
        (e as Error).message,
      );
      throw e;
    }
  }

  /**
   * We have two locations which planet state can live: on the server, and on the blockchain. We use
   * the blockchain for the 'physics' of the universe, and the webserver for optional 'add-on'
   * features, which are cryptographically secure, but live off-chain.
   *
   * This function loads the planet states which live on the server. Plays nicely with our
   * notifications system and sets the appropriate loading state values on the planet.
   */
  public async refreshServerPlanetStates(planetIds: LocationId[]) {
    const planets = this.getPlanetsWithIds(planetIds);

    planetIds.forEach((id) =>
      this.getGameObjects().updatePlanet(id, (p) => {
        p.loadingServerState = true;
      }),
    );

    const messages = await getMessagesOnPlanets({ planets: planetIds });

    planets.forEach((planet) => {
      const previousPlanetEmoji = getEmojiMessage(planet);
      planet.messages = messages[planet.locationId];
      const nowPlanetEmoji = getEmojiMessage(planet);

      // an emoji was added
      if (previousPlanetEmoji === undefined && nowPlanetEmoji !== undefined) {
        planet.emojiZoopAnimation = easeInAnimation(2000);
        // an emoji was removed
      } else if (
        nowPlanetEmoji === undefined &&
        previousPlanetEmoji !== undefined
      ) {
        planet.emojiZoopAnimation = undefined;
        planet.emojiZoopOutAnimation = emojiEaseOutAnimation(
          3000,
          previousPlanetEmoji.body.emoji,
        );
      }
    });

    planetIds.forEach((id) =>
      this.getGameObjects().updatePlanet(id, (p) => {
        p.loadingServerState = false;
        p.needsServerRefresh = false;
      }),
    );
  }

  /**
   * If you are the owner of this planet, you can set an 'emoji' to hover above the planet.
   * `emojiStr` must be a string that contains a single emoji, otherwise this function will throw an
   * error.
   *
   * The emoji is stored off-chain in a postgres database. We verify planet ownership via a contract
   * call from the webserver, and by verifying that the request to add (or remove) an emoji from a
   * planet was signed by the owner.
   */
  public async setPlanetEmoji(locationId: LocationId, emojiStr: string) {
    const res = await this.submitPlanetMessage(
      locationId,
      PlanetMessageType.EmojiFlag,
      {
        emoji: emojiStr,
      },
    );
    return res;
  }

  /**
   * If you are the owner of this planet, you can delete the emoji that is hovering above the
   * planet.
   */
  public async clearEmoji(locationId: LocationId) {
    if (this.account === undefined) {
      throw new Error("can't clear emoji: not logged in");
    }

    if (this.getPlanetWithId(locationId)?.unconfirmedClearEmoji) {
      throw new Error(
        `can't clear emoji: alreading clearing emoji from ${locationId}`,
      );
    }

    this.getGameObjects().updatePlanet(locationId, (p) => {
      p.unconfirmedClearEmoji = true;
    });

    const request = await this.ethConnection.signMessageObject({
      locationId,
      ids: this.getPlanetWithId(locationId)?.messages?.map((m) => m.id) || [],
    });

    try {
      await deleteMessages(request);
    } catch (e) {
      throw e as Error;
    } finally {
      this.getGameObjects().updatePlanet(locationId, (p) => {
        p.needsServerRefresh = true;
        p.unconfirmedClearEmoji = false;
      });
    }

    await this.refreshServerPlanetStates([locationId]);
  }

  public async submitDisconnectTwitter(twitter: string) {
    await disconnectTwitter(
      await this.ethConnection.signMessageObject({ twitter }),
    );
    await this.refreshTwitters();
  }

  /**
   * The planet emoji feature is built on top of a more general 'Planet Message' system, which
   * allows players to upload pieces of data called 'Message's to planets that they own. Emojis are
   * just one type of message. Their implementation leaves the door open to more off-chain data.
   */
  private async submitPlanetMessage(
    locationId: LocationId,
    type: PlanetMessageType,
    body: unknown,
  ) {
    if (this.account === undefined) {
      throw new Error("can't submit planet message not logged in");
    }

    if (this.getPlanetWithId(locationId)?.unconfirmedAddEmoji) {
      throw new Error(
        `can't submit planet message: already submitting for planet ${locationId}`,
      );
    }

    this.getGameObjects().updatePlanet(locationId, (p) => {
      p.unconfirmedAddEmoji = true;
    });

    const request = await this.ethConnection.signMessageObject({
      locationId,
      sender: this.account,
      type,
      body,
    });

    try {
      await addMessage(request);
    } catch (e) {
      throw e as Error;
    } finally {
      this.getGameObjects().updatePlanet(locationId, (p) => {
        p.unconfirmedAddEmoji = false;
        p.needsServerRefresh = true;
      });
    }

    await this.refreshServerPlanetStates([locationId]);
  }

  /**
   * Checks that a message signed by {@link GameManager#signMessage} was signed by the address that
   * it claims it was signed by.
   */
  private async verifyMessage(
    message: SignedMessage<unknown>,
  ): Promise<boolean> {
    const preSigned = JSON.stringify(messag(e as Error).message);

    return verifySignature(
      preSigned,
      message.signature as string,
      message.sender,
    );
  }

  /**
   * Submits a transaction to the blockchain to move the given amount of resources from
   * the given planet to the given planet.
   */
  public async move(
    from: LocationId,
    to: LocationId,
    forces: number,
    silver: number,
    artifactMoved?: ArtifactId,
    abandoning = false,
    bypassChecks = false,
  ): Promise<Transaction<UnconfirmedMove>> {
    localStorage.setItem(
      `${this.getAccount()?.toLowerCase()}-fromPlanet`,
      from,
    );
    localStorage.setItem(`${this.getAccount()?.toLowerCase()}-toPlanet`, to);

    try {
      // if (!bypassChecks && this.checkGameHasEnded()) {
      //   throw new Error('game has ended');
      // }

      const arrivalsToOriginPlanet =
        this.entityStore.getArrivalIdsForLocation(from);
      const hasIncomingVoyage =
        arrivalsToOriginPlanet && arrivalsToOriginPlanet.length > 0;
      if (abandoning && hasIncomingVoyage) {
        throw new Error("cannot abandon a planet that has incoming voyages");
      }

      const oldLocation = this.entityStore.getLocationOfPlanet(from);
      const newLocation = this.entityStore.getLocationOfPlanet(to);
      if (!oldLocation) {
        throw new Error("tried to move from planet that does not exist");
      }
      if (!newLocation) {
        throw new Error("tried to move from planet that does not exist");
      }

      const oldX = oldLocation.coords.x;
      const oldY = oldLocation.coords.y;
      const newX = newLocation.coords.x;
      const newY = newLocation.coords.y;
      const xDiff = newX - oldX;
      const yDiff = newY - oldY;

      //###############
      //  NEW MAP ALGO
      //###############
      // const distFromOriginSquare = newX ** 2 + newY ** 2;

      const distMax = Math.ceil(Math.sqrt(xDiff ** 2 + yDiff ** 2));

      // Contract will automatically send full forces/silver on abandon
      const shipsMoved = !abandoning ? forces : 0;
      const silverMoved = !abandoning ? silver : 0;

      if (newX ** 2 + newY ** 2 >= this.worldRadius ** 2) {
        throw new Error("attempted to move out of bounds");
      }

      const oldPlanet = this.entityStore.getPlanetWithLocation(oldLocation);

      if (
        ((!bypassChecks && !this.account) ||
          !oldPlanet ||
          oldPlanet.owner !== this.account) &&
        !isSpaceShip(this.getArtifactWithId(artifactMoved)?.artifactType)
      ) {
        throw new Error("attempted to move from a planet not owned by player");
      }

      const getArgs = async (): Promise<unknown[]> => {
        const snarkArgs = await this.snarkHelper.getMoveArgs(
          oldX,
          oldY,
          newX,
          newY,
          this.worldRadius,
          distMax,
        );

        const args: MoveArgs = [
          snarkArgs[ZKArgIdx.PROOF_A],
          snarkArgs[ZKArgIdx.PROOF_B],
          snarkArgs[ZKArgIdx.PROOF_C],
          snarkArgs[ZKArgIdx.DATA],
          (shipsMoved * CONTRACT_PRECISION).toString(),
          (silverMoved * CONTRACT_PRECISION).toString(),
          "0",
          abandoning ? "1" : "0",
        ] as MoveArgs;

        this.terminal.current?.println(
          "MOVE: calculated SNARK with args:",
          TerminalTextStyle.Sub,
        );
        this.terminal.current?.println(
          JSON.stringify(hexifyBigIntNestedArray(args)),
          TerminalTextStyle.Sub,
        );
        this.terminal.current?.newline();

        if (artifactMoved) {
          args[6] = artifactIdToDecStr(artifactMoved);
        }

        return args;
      };

      const txIntent: UnconfirmedMove = {
        methodName: "move",
        contract: this.contractsAPI.contract,
        args: getArgs(),
        from: oldLocation.hash, //以下的东西没屁用
        to: newLocation.hash,
        forces: shipsMoved,
        silver: silverMoved,
        artifact: artifactMoved,
        abandoning,
      };

      if (artifactMoved) {
        const artifact = this.entityStore.getArtifactById(artifactMoved);

        if (!bypassChecks) {
          if (!artifact) {
            throw new Error("couldn't find this artifact");
          }
          if (isActivated(artifact)) {
            throw new Error("can't move an activated artifact");
          }
          if (!oldPlanet?.heldArtifactIds?.includes(artifactMoved)) {
            throw new Error("that artifact isn't on this planet!");
          }
        }
      }

      // Always await the submitTransaction so we can catch rejections
      const tx = await this.contractsAPI.submitTransaction(txIntent);

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError("move", (e as Error).message);
      throw e;
    }
  }

  /**
   * Submits a transaction to the blockchain to upgrade the given planet with the given
   * upgrade branch. You must own the planet, and have enough silver on it to complete
   * the upgrade.
   */
  public async upgrade(
    planetId: LocationId,
    branch: number,
    _bypassChecks = false,
  ): Promise<Transaction<UnconfirmedUpgrade>> {
    try {
      // this is shitty
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-upPlanet`,
        planetId,
      );
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-branch`,
        branch.toString(),
      );

      const txIntent: UnconfirmedUpgrade = {
        methodName: "upgradePlanet",
        contract: this.contractsAPI.contract,
        args: Promise.resolve([
          locationIdToDecStr(planetId),
          branch.toString(),
        ]),
        locationId: planetId,
        upgradeBranch: branch,
      };

      // Always await the submitTransaction so we can catch rejections
      const tx = await this.contractsAPI.submitTransaction(txIntent);

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "upgradePlanet",
        (e as Error).message,
      );
      throw e;
    }
  }

  /**
   * Submits a transaction to the blockchain to refreshPlanet.
   */
  public async refreshPlanet(
    planetId: LocationId,
    _bypassChecks = false,
  ): Promise<Transaction<UnconfirmedRefreshPlanet>> {
    try {
      // this is shitty
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-refreshPlanet`,
        planetId,
      );

      const txIntent: UnconfirmedRefreshPlanet = {
        methodName: "refreshPlanet",
        contract: this.contractsAPI.contract,
        args: Promise.resolve([locationIdToDecStr(planetId)]),
        locationId: planetId,
      };

      // Always await the submitTransaction so we can catch rejections
      const tx = await this.contractsAPI.submitTransaction(txIntent);

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "refreshPlanet",
        (e as Error).message,
      );
      throw e;
    }
  }

  /**
   * Submits a transaction to the blockchain to buy a hat for the given planet. You must own the
   * planet. Warning costs real token. Hats are permanently locked to a planet. They are purely
   * cosmetic and a great way to BM your opponents or just look your best. Just like in the real
   * world, more money means more hat.
   */
  public async buySkin(
    planetId: LocationId,
    hatType: number,
    _bypassChecks = false,
  ): Promise<Transaction<UnconfirmedBuyHat>> {
    const planetLoc = this.entityStore.getLocationOfPlanet(planetId);
    const planet = this.entityStore.getPlanetWithLocation(planetLoc);
    const halfPrice = this.getHalfPrice();

    try {
      if (!planetLoc) {
        console.error("planet not found");
        throw new Error("[TX ERROR] Planet not found");
      }
      if (!planet) {
        console.error("planet not found");
        throw new Error("[TX ERROR] Planet not found");
      }

      if (hatType === HatType.Unknown) {
        console.error("hatTpye === 0");
        throw new Error("[TX ERROR] hatType Error");
      }

      // price requirements
      const balanceEth = this.getMyBalanceEth();
      let hatCostEth = planet.hatLevel === 0 ? 0.002 : 0;
      if (halfPrice) hatCostEth *= 0.5;

      if (balanceEth < hatCostEth) {
        throw new Error("you don't have enough ETH");
      }

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-hatPlanet`,
        planetId,
      );
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-hatLevel`,
        planet.hatLevel.toString(),
      );

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-hatType`,
        planet.hatType.toString(),
      );

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-halfPrice`,
        halfPrice.toString(),
      );

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-hatCostEth`,
        hatCostEth.toString(),
      );

      const txIntent: UnconfirmedBuyHat = {
        methodName: "buySkin",
        contract: this.contractsAPI.contract,
        args: Promise.resolve([locationIdToDecStr(planetId), hatType]),
        locationId: planetId,
        hatType: hatType,
      };

      // Always await the submitTransaction so we can catch rejections

      const tx = await this.contractsAPI.submitTransaction(txIntent, {
        value:
          planet.hatLevel === 0
            ? halfPrice
              ? bigInt(1_000_000_000_000_000).toString()
              : bigInt(2_000_000_000_000_000).toString()
            : "0", //0.001eth
      });

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "buySkin",
        (e as Error).message,
      );
      throw e;
    }
  }
  /**
   * Submits a transaction to the blockchain to buy a planet.
   * Warning costs real token.
   */
  public async buyPlanet(
    planetId: LocationId,
  ): Promise<Transaction<UnconfirmedBuyPlanet>> {
    try {
      if (!this.account) {
        throw new Error("no account set");
      }
      // if (this.checkGameHasEnded()) {
      //   throw new Error('game has ended');
      // }

      const planet = this.entityStore.getPlanetWithId(planetId);

      // planet requirements
      if (!planet) {
        throw new Error("you can't buy a planet you haven't discovered");
      }

      if (!isLocatable(planet)) {
        throw new Error(
          "you can't buy a planet whose coordinates you don't know",
        );
      }

      if (planet.destroyed || planet.frozen) {
        throw new Error("you can't buy destroyed/frozen planets");
      }

      if (planet.planetLevel !== 0) {
        throw new Error("only level 0");
      }

      if (planet.owner !== EMPTY_ADDRESS) {
        throw new Error("you can only buy planet without owner");
      }

      const x: number = planet.location.coords.x;
      const y: number = planet.location.coords.y;
      const radius: number = Math.sqrt(x ** 2 + y ** 2);

      const MAX_LEVEL_DIST = this.contractConstants.MAX_LEVEL_DIST;
      if (!(radius > MAX_LEVEL_DIST[1])) {
        throw new Error("Player can only spawn at the edge of universe");
      }
      const spaceType = this.spaceTypeFromPerlin(
        planet.perlin,
        Math.floor(Math.sqrt(x * x + y * y)),
      );

      if (spaceType !== SpaceType.NEBULA) {
        throw new Error("Only NEBULA");
      }

      // const INIT_PERLIN_MIN = this.contractConstants.INIT_PERLIN_MIN;

      // if (planet.perlin >= INIT_PERLIN_MIN) {
      //   throw new Error('Init not allowed in perlin value less than INIT_PERLIN_MIN');
      // }

      //player requirements
      const player = this.players.get(this.account);
      if (!player) {
        throw new Error("no player");
      }
      const MAX_BUY_PLANET_AMOUNT = 6;
      if (player.buyPlanetAmount >= MAX_BUY_PLANET_AMOUNT) {
        throw new Error("buy planet amount limit");
      }

      // price requirements
      const balanceEth = this.getMyBalanceEth();
      const halfPrice = this.getHalfPrice();
      const planetCostEth = halfPrice
        ? 0.5 * 0.003 * 2 ** player.buyPlanetAmount
        : 0.003 * 2 ** player.buyPlanetAmount;
      if (balanceEth < planetCostEth) {
        throw new Error("you don't have enough ETH");
      }

      if (planet.transactions?.hasTransaction(isUnconfirmedBuyPlanetTx)) {
        // transaction requirements
        throw new Error("you're already buying this planet");
      }
      if (
        this.entityStore.transactions.hasTransaction(isUnconfirmedBuyPlanetTx)
      ) {
        throw new Error("you're already buying this planet");
      }

      const getArgs = async () => {
        const args = await this.snarkHelper.getInitArgs(
          planet.location.coords.x,
          planet.location.coords.y,
          Math.floor(
            Math.sqrt(
              planet.location.coords.x ** 2 + planet.location.coords.y ** 2,
            ),
          ) + 1,
        );

        return args;
      };

      const txIntent: UnconfirmedBuyPlanet = {
        methodName: "buyPlanet",
        contract: this.contractsAPI.contract,
        locationId: planet.location.hash,
        location: planet.location,
        args: getArgs(),
      };

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-buyPlanet`,
        planetId,
      );

      // localStorage.setItem(
      //   `${this.getAccount()?.toLowerCase()}-buyPlanetAmountBefore`,
      //   player.buyPlanetAmount.toString()
      // );

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-halfPrice`,
        halfPrice.toString(),
      );

      localStorage.setItem(
        `${this.getAccount()?.toLocaleLowerCase()}-planetCostEth`,
        planetCostEth.toString(),
      );

      const fee_delete = 2 ** player.buyPlanetAmount;

      // 0.003 *(2**(num-1)) eth
      let fee = bigInt(3_000_000_000_000_000).multiply(fee_delete);
      if (halfPrice) fee = bigInt(1_500_000_000_000_000).multiply(fee_delete);

      const tx = await this.contractsAPI.submitTransaction(txIntent, {
        value: fee.toString(),
      });

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "buyPlanet",
        (e as Error).message,
      );
      throw e;
    }
  }

  public async buySpaceship(
    planetId: LocationId,
  ): Promise<Transaction<UnconfirmedBuySpaceship>> {
    try {
      if (!this.account) {
        throw new Error("no account set");
      }
      // if (this.checkGameHasEnded()) {
      //   throw new Error('game has ended');
      // }

      const planet = this.entityStore.getPlanetWithId(planetId);

      // planet requirements
      if (!planet) {
        throw new Error("you should know this planet");
      }

      if (!isLocatable(planet)) {
        throw new Error("planet is not Locatable");
      }

      if (planet.destroyed || planet.frozen) {
        throw new Error("planet destoryed / frozen");
      }

      //player requirements
      const player = this.players.get(this.account);
      if (!player) {
        throw new Error("no player");
      }

      const halfPrice = this.getHalfPrice();
      // price requirements
      const balanceEth = this.getMyBalanceEth();
      const spaceshipCostEth = halfPrice ? 0.0005 : 0.001;
      if (balanceEth < spaceshipCostEth) {
        throw new Error("you don't have enough ETH");
      }

      if (player.buySpaceshipAmount >= 3) {
        throw new Error(" you can only buy 3 spaceships");
      }

      // transaction requirements
      if (planet.transactions?.hasTransaction(isUnconfirmedBuySpaceshipTx)) {
        throw new Error("you're already buying this planet");
      }
      if (
        this.entityStore.transactions.hasTransaction(
          isUnconfirmedBuySpaceshipTx,
        )
      ) {
        throw new Error("you're already buying this planet");
      }

      const spaceshipType = ArtifactType.ShipWhale;

      const txIntent: UnconfirmedBuySpaceship = {
        methodName: "buySpaceship",
        contract: this.contractsAPI.contract,
        locationId: planet.location.hash,
        location: planet.location,
        args: Promise.resolve([locationIdToDecStr(planetId), spaceshipType]),
      };

      let fee = bigInt(1_000_000_000_000_000).toString(); //0.001 eth
      if (halfPrice) fee = bigInt(500_000_000_000_000).toString();

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-buySpaceshipOnPlanetId`,
        planetId,
      );
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-halfPrice`,
        halfPrice.toString(),
      );

      const tx = await this.contractsAPI.submitTransaction(txIntent, {
        value: fee, //0.001 eth
      });

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "buySpaceship",
        (e as Error).message,
      );
      throw e;
    }
  }

  public async donate(amount: number): Promise<Transaction<UnconfirmedDonate>> {
    try {
      if (!this.account) {
        throw new Error("no account set");
      }
      // if (this.checkGameHasEnded()) {
      //   throw new Error('game has ended');
      // }

      //player requirements
      const player = this.players.get(this.account);
      if (!player) {
        throw new Error("no player");
      }

      // price requirements
      const balanceEth = this.getMyBalanceEth();
      const donationCostEth = amount * 0.001;
      if (balanceEth < donationCostEth) {
        throw new Error("you don't have enough ETH");
      }

      // transaction requirements
      if (this.entityStore.transactions.hasTransaction(isUnconfirmedDonateTx)) {
        throw new Error("you're donating");
      }

      const txIntent: UnconfirmedDonate = {
        methodName: "donate",
        contract: this.contractsAPI.contract,
        amount: amount,
        args: Promise.resolve([amount]),
      };

      const fee = bigInt(1_000_000_000_000_000).multiply(amount).toString();

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-donateAmount`,
        amount.toString(),
      );
      const tx = await this.contractsAPI.submitTransaction(txIntent, {
        value: fee,
      });
      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "donate",
        (e as Error).message,
      );
      throw e;
    }
  }

  // TODO: Change this to transferPlanet in a breaking release
  public async transferOwnership(
    planetId: LocationId,
    newOwner: EthAddress,
    bypassChecks = false,
  ): Promise<Transaction<UnconfirmedPlanetTransfer>> {
    try {
      if (!bypassChecks) {
        // if (this.checkGameHasEnded()) {
        //   throw new Error('game has ended');
        // }
        const planetLoc = this.entityStore.getLocationOfPlanet(planetId);
        if (!planetLoc) {
          console.error("planet not found");
          throw new Error("[TX ERROR] Planet not found");
        }
        const planet = this.entityStore.getPlanetWithLocation(planetLoc);
        if (!planet) {
          console.error("planet not found");
          throw new Error("[TX ERROR] Planet not found");
        }
      }

      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-transferPlanet`,
        planetId,
      );
      localStorage.setItem(
        `${this.getAccount()?.toLowerCase()}-transferOwner`,
        newOwner,
      );

      const txIntent: UnconfirmedPlanetTransfer = {
        methodName: "transferPlanet",
        contract: this.contractsAPI.contract,
        args: Promise.resolve([locationIdToDecStr(planetId), newOwner]),
        planetId,
        newOwner,
      };

      // Always await the submitTransaction so we can catch rejections
      const tx = await this.contractsAPI.submitTransaction(txIntent);

      return tx;
    } catch (e) {
      this.getNotificationsManager().txInitError(
        "transferPlanet",
        (e as Error).message,
      );
      throw e;
    }
  }

  // NOTE: get claimRoundEndReward back
  // /**
  //  * Receive XDAI for the claiming player based on their score rank at the end of the round.
  //  */
  // async claimRoundEndReward(bypassChecks = false): Promise<Transaction<UnconfirmedClaimReward>> {
  //   try {
  //     if (!bypassChecks) {
  //       if (!this.checkGameHasEnded()) {
  //         throw new Error('game has not ended');
  //       }
  //     }

  //     const allPlayers = await this.contractsAPI.getPlayers();
  //     const sortedPlayers = Array.from(allPlayers.values()).sort((a, b) => b.score - a.score);
  //     const sortedPlayerAddresses = sortedPlayers.map((p) => p.address);
  //     const sortedScores = sortedPlayers.map((p) => p.score);

  //     const txIntent: UnconfirmedClaimReward = {
  //       methodName: 'claimReward',
  //       contract: this.contractsAPI.contract,
  //       args: Promise.resolve([sortedPlayerAddresses, sortedScores]),
  //       sortedPlayerAddresses,
  //       sortedScores,
  //     };

  //     // Always await the submitTransaction so we can catch rejections
  //     const tx = await this.contractsAPI.submitTransaction(txIntent);

  //     return tx;
  //   } catch (e) {
  //     this.getNotificationsManager().txInitError('claimReward', (e as Error).message);
  //     throw e;
  //   }
  // }

  /**
   * Makes this game manager aware of a new chunk - which includes its location, size,
   * as well as all of the planets contained in that chunk. Causes the client to load
   * all of the information about those planets from the blockchain.
   */
  addNewChunk(chunk: Chunk): GameManager {
    this.persistentChunkStore.addChunk(chunk, true);
    for (const planetLocation of chunk.planetLocations) {
      this.entityStore.addPlanetLocation(planetLocation);

      if (this.entityStore.isPlanetInContract(planetLocation.hash)) {
        this.hardRefreshPlanet(planetLocation.hash); // don't need to await, just start the process of hard refreshing
      }
    }
    return this;
  }

  listenForNewBlock() {
    this.getEthConnection().blockNumber$.subscribe((blockNumber) => {
      if (this.captureZoneGenerator) {
        this.captureZoneGenerator.generate(blockNumber);
      }
    });
  }

  /**
   * To add multiple chunks at once, use this function rather than `addNewChunk`, in order
   * to load all of the associated planet data in an efficient manner.
   */
  async bulkAddNewChunks(chunks: Chunk[]): Promise<void> {
    this.terminal.current?.println(
      "IMPORTING MAP: if you are importing a large map, this may take a while...",
    );
    const planetIdsToUpdate: LocationId[] = [];
    for (const chunk of chunks) {
      this.persistentChunkStore.addChunk(chunk, true);
      for (const planetLocation of chunk.planetLocations) {
        this.entityStore.addPlanetLocation(planetLocation);

        if (this.entityStore.isPlanetInContract(planetLocation.hash)) {
          // Await this so we don't crash the game
          planetIdsToUpdate.push(planetLocation.hash);
        }
      }
    }
    this.terminal.current?.println(
      `downloading data for ${planetIdsToUpdate.length} planets...`,
      TerminalTextStyle.Sub,
    );
    this.bulkHardRefreshPlanets(planetIdsToUpdate);
  }

  // utils - scripting only

  /**
   * Gets the maximuim distance that you can send your energy from the given planet,
   * using the given percentage of that planet's current silver.
   */
  getMaxMoveDist(
    planetId: LocationId,
    sendingPercent: number,
    abandoning: boolean,
  ): number {
    const planet = this.getPlanetWithId(planetId);
    if (!planet) throw new Error("origin planet unknown");
    return getRange(planet, sendingPercent, this.getRangeBuff(abandoning));
  }

  /**
   * Gets the distance between two planets. Throws an exception if you don't
   * know the location of either planet. Takes into account links.
   */
  getDist(fromId: LocationId, toId: LocationId): number {
    const planetFrom = this.entityStore.getPlanetWithId(fromId);
    if (!isLocatable(planetFrom)) {
      throw new Error(
        `origin planet not locatable (fromId: ${fromId}) (locationId: ${planetFrom?.locationId})`,
      );
    }

    const planetTo = this.entityStore.getPlanetWithId(toId);
    if (!isLocatable(planetTo)) {
      throw new Error(
        `origin planet not locatable (toId: ${fromId}) (locationId: ${planetTo?.locationId})`,
      );
    }

    const wormholeFactors = this.getWormholeFactors(planetFrom, planetTo);
    const distance = this.getDistCoords(
      planetFrom.location.coords,
      planetTo.location.coords,
    );
    const distanceFactor = wormholeFactors ? wormholeFactors.distanceFactor : 1;

    return distance / distanceFactor;
  }

  /**
   * Gets the distance between two coordinates in space using manhattan geometry
   *
   * @see https://en.wikipedia.org/wiki/Taxicab_geometry
   */
  getDistCoords(fromCoords: WorldCoords, toCoords: WorldCoords) {
    return Math.sqrt(
      (fromCoords.x - toCoords.x) ** 2 + (fromCoords.y - toCoords.y) ** 2,
    );
  }

  /**
   * Gets all the planets that you can reach with at least 1 energy from
   * the given planet. Does not take into account wormholes.
   */
  getPlanetsInRange(
    planetId: LocationId,
    sendingPercent: number,
    abandoning: boolean,
  ): Planet[] {
    const planet = this.entityStore.getPlanetWithId(planetId);
    if (!planet) throw new Error("planet unknown");
    if (!isLocatable(planet)) throw new Error("planet location unknown");

    // Performance improvements originally suggested by [@modokon](https://github.com/modukon)
    // at https://github.com/darkforest-eth/client/issues/15
    // Improved by using `planetMap` by [@phated](https://github.com/phated)
    const result = [];
    const range = getRange(
      planet,
      sendingPercent,
      this.getRangeBuff(abandoning),
    );
    for (const p of this.getPlanetMap().values()) {
      if (isLocatable(p)) {
        if (
          this.getDistCoords(planet.location.coords, p.location.coords) < range
        ) {
          result.push(p);
        }
      }
    }

    return result;
  }

  /**
   * Gets the amount of energy needed in order for a voyage from the given to the given
   * planet to arrive with your desired amount of energy.
   */
  getEnergyNeededForMove(
    fromId: LocationId,
    toId: LocationId,
    arrivingEnergy: number,
    abandoning = false,
  ): number {
    const from = this.getPlanetWithId(fromId);
    if (!from) throw new Error("origin planet unknown");
    const dist = this.getDist(fromId, toId);
    const range = from.range * this.getRangeBuff(abandoning);
    const rangeSteps = dist / range;

    const arrivingProp = arrivingEnergy / from.energyCap + 0.05;

    return arrivingProp * Math.pow(2, rangeSteps) * from.energyCap;
  }

  /**
   * Gets the amount of energy that would arrive if a voyage with the given parameters
   * was to occur. The toPlanet is optional, in case you want an estimate that doesn't include
   * wormhole speedups.
   */
  getEnergyArrivingForMove(
    fromId: LocationId,
    toId: LocationId | undefined,
    distance: number | undefined,
    sentEnergy: number,
    abandoning: boolean,
  ) {
    const from = this.getPlanetWithId(fromId);
    const to = this.getPlanetWithId(toId);

    if (!from) throw new Error(`unknown planet`);
    if (distance === undefined && toId === undefined)
      throw new Error(`you must provide either a target planet or a distance`);

    const dist = (toId && this.getDist(fromId, toId)) || (distance as number);

    if (to && toId) {
      const wormholeFactors = this.getWormholeFactors(from, to);
      if (wormholeFactors !== undefined) {
        if (to.owner !== from.owner) {
          return 0;
        }
      }
    }

    const range = from.range * this.getRangeBuff(abandoning);
    const scale = (1 / 2) ** (dist / range);
    let ret = scale * sentEnergy - 0.05 * from.energyCap;
    if (ret < 0) ret = 0;

    return ret;
  }

  /**
   * Gets the active artifact on this planet, if one exists.
   */
  getActiveArtifact(planet: Planet): Artifact | undefined {
    const artifacts = this.getArtifactsWithIds(planet.heldArtifactIds);
    const active = artifacts.find((a) => a && isActivated(a));

    return active;
  }

  /**
   * If there's an active artifact on either of these planets which happens to be a wormhole which
   * is active and targetting the other planet, return the wormhole boost which is greater. Values
   * represent a multiplier.
   */
  getWormholeFactors(
    fromPlanet: Planet,
    toPlanet: Planet,
  ): { distanceFactor: number; speedFactor: number } | undefined {
    const fromActiveArtifact = this.getActiveArtifact(fromPlanet);
    const toActiveArtifact = this.getActiveArtifact(toPlanet);

    const fromHasActiveWormhole =
      fromActiveArtifact?.artifactType === ArtifactType.Wormhole &&
      fromActiveArtifact.linkTo === toPlanet.locationId;
    const toHasActiveWormhole =
      toActiveArtifact?.artifactType === ArtifactType.Wormhole &&
      toActiveArtifact.linkTo === fromPlanet.locationId;

    let greaterRarity: ArtifactRarity | undefined = undefined;
    switch (true) {
      // active wormhole on both from and to planets choose the biggest rarity
      case fromHasActiveWormhole && toHasActiveWormhole: {
        greaterRarity = Math.max(
          fromActiveArtifact.rarity,
          toActiveArtifact.rarity,
        ) as ArtifactRarity;
        break;
      }
      // only from planet has active wormhole, use that one

      case fromHasActiveWormhole: {
        greaterRarity = fromActiveArtifact.rarity;
        break;
      }
      // only destination planet has active wormhole, use that one
      case toHasActiveWormhole: {
        greaterRarity = toActiveArtifact.rarity;
        break;
      }
    }

    if (
      greaterRarity === undefined ||
      greaterRarity <= ArtifactRarity.Unknown
    ) {
      return undefined;
    }

    const rangeUpgradesPerRarity = [0, 2, 4, 6, 8, 10];
    const speedUpgradesPerRarity = [0, 10, 20, 30, 40, 50];
    return {
      distanceFactor: rangeUpgradesPerRarity[greaterRarity],
      speedFactor: speedUpgradesPerRarity[greaterRarity],
    };
  }

  /**
   * Gets the amount of time, in seconds that a voyage between from the first to the
   * second planet would take.
   */
  getTimeForMove(
    fromId: LocationId,
    toId: LocationId,
    abandoning = false,
  ): number {
    const from = this.getPlanetWithId(fromId);
    if (!isLocatable(from)) {
      throw new Error(`Could not find planet from (fromId: ${fromId})`);
    }

    const to = this.getPlanetWithId(toId);
    if (!isLocatable(to)) {
      throw new Error(`Could not find planet to (toId: ${to})`);
    }

    // NOTE: The get distance will throw if both the fromId and toId planets are not located.
    const dist = this.getDist(fromId, toId);

    // NOTE: The speed factor will always be 1 when SPACE_JUNK_ENABLED=false
    const speedFactor = this.getSpeedBuff(abandoning);
    const speed = from.speed * speedFactor;

    let deltaTime = dist / (speed / 100);

    // NOTE: We have disabled the change the photoid travel time in seconds here
    // all photoid travel same time
    // if (this.getActiveArtifact(from)?.artifactType === ArtifactType.PhotoidCannon:) {
    //     deltaTime = 600;
    // }

    // Destination planet is a silver bank, we travel twice as fast to these.
    if (to.planetType === PlanetType.SILVER_BANK) {
      deltaTime = deltaTime / 2;
    }

    return deltaTime;
  }

  /**
   * Gets the temperature of a given location.
   */
  getTemperature(coords: WorldCoords): number {
    const p = this.spaceTypePerlin(coords, false);
    return (16 - p) * 16;
  }

  /**
   * Load the serialized versions of all the plugins that this player has.
   */
  public async loadPlugins(): Promise<SerializedPlugin[]> {
    return this.persistentChunkStore.loadPlugins();
  }

  /**
   * Overwrites all the saved plugins to equal the given array of plugins.
   */
  public async savePlugins(savedPlugins: SerializedPlugin[]): Promise<void> {
    await this.persistentChunkStore.savePlugins(savedPlugins);
  }

  /**
   * Whether or not the given planet is capable of minting an artifact.
   */
  public isPlanetMineable(p: Planet): boolean {
    return p.planetType === PlanetType.RUINS;
  }

  /**
   * Returns constructors of classes that may be useful for developing plugins.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getConstructors() {
    return {
      MinerManager,
      SpiralPattern,
      SwissCheesePattern,
      TowardsCenterPattern,
      TowardsCenterPatternV2,
    };
  }

  /**
   * Gets the perlin value at the given location in the world. SpaceType is based
   * on this value.
   */
  public spaceTypePerlin(coords: WorldCoords, floor: boolean): number {
    return perlin(coords, {
      key: this.hashConfig.spaceTypeKey,
      scale: this.hashConfig.perlinLengthScale,
      mirrorX: this.hashConfig.perlinMirrorX,
      mirrorY: this.hashConfig.perlinMirrorY,
      floor,
    });
  }

  /**
   * Gets the biome perlin valie at the given location in the world.
   */
  public biomebasePerlin(coords: WorldCoords, floor: boolean): number {
    return perlin(coords, {
      key: this.hashConfig.biomebaseKey,
      scale: this.hashConfig.perlinLengthScale,
      mirrorX: this.hashConfig.perlinMirrorX,
      mirrorY: this.hashConfig.perlinMirrorY,
      floor,
    });
  }

  public locationBigIntFromCoords(coords: WorldCoords): BigInteger {
    return this.planetHashMimc(coords.x, coords.y);
  }

  /**
   * Helpful for listening to user input events.
   */
  public getUIEventEmitter() {
    return UIEmitter.getInstance();
  }

  public getCaptureZoneGenerator() {
    return this.captureZoneGenerator;
  }

  /**
   * Emits when new capture zones are generated.
   */
  public get captureZoneGeneratedEmitter():
    | Monomitter<CaptureZonesGeneratedEvent>
    | undefined {
    return this.captureZoneGenerator?.generated$;
  }

  public getNotificationsManager() {
    return NotificationManager.getInstance();
  }

  getLinks(): Iterable<Link> {
    return this.entityStore.getLinks();
  }

  /** Return a reference to the planet map */
  public getPlanetMap(): Map<LocationId, Planet> {
    return this.entityStore.getPlanetMap();
  }

  /** Return a reference to the artifact map */
  public getArtifactMap(): Map<ArtifactId, Artifact> {
    return this.entityStore.getArtifactMap();
  }

  /** Return a reference to the map of my planets */
  public getMyPlanetMap(): Map<LocationId, Planet> {
    return this.entityStore.getMyPlanetMap();
  }

  /** Return a reference to the map of my artifacts */
  public getMyArtifactMap(): Map<ArtifactId, Artifact> {
    return this.entityStore.getMyArtifactMap();
  }

  public getPlanetUpdated$(): Monomitter<LocationId> {
    return this.entityStore.planetUpdated$;
  }

  public getArtifactUpdated$(): Monomitter<ArtifactId> {
    return this.entityStore.artifactUpdated$;
  }

  public getMyPlanetsUpdated$(): Monomitter<Map<LocationId, Planet>> {
    return this.entityStore.myPlanetsUpdated$;
  }

  public getMyArtifactsUpdated$(): Monomitter<Map<ArtifactId, Artifact>> {
    return this.entityStore.myArtifactsUpdated$;
  }

  /**
   * Returns an instance of a `Contract` from the ethersjs library. This is the library we use to
   * connect to the blockchain. For documentation about how `Contract` works, see:
   * https://docs.ethers.io/v5/api/contract/contract/
   *
   * Also, registers your contract in the system to make calls against it and to reload it when
   * necessary (such as the RPC endpoint changing).
   */
  public loadContract<T extends Contract>(
    contractAddress: string,
    contractABI: ContractInterface,
  ): Promise<T> {
    return this.ethConnection.loadContract(
      contractAddress,
      async (address, provider, signer) =>
        createContract<T>(address, contractABI, provider, signer),
    );
  }

  public testNotification() {
    NotificationManager.getInstance().reallyLongNotification();
  }

  /**
   * Gets a reference to the game's internal representation of the world state. This includes
   * voyages, planets, artifacts, and active links,
   */
  public getGameObjects(): GameObjects {
    return this.entityStore;
  }

  public forceTick(locationId: LocationId) {
    this.getGameObjects().forceTick(locationId);
  }

  /**
   * Gets some diagnostic information about the game. Returns a copy, you can't modify it.
   */
  public getDiagnostics(): Diagnostics {
    return { ...this.diagnostics };
  }

  /**
   * Updates the diagnostic info of the game using the supplied function. Ideally, each spot in the
   * codebase that would like to record a metric is able to update its specific metric in a
   * convenient manner.
   */
  public updateDiagnostics(updateFn: (d: Diagnostics) => void): void {
    updateFn(this.diagnostics);
  }

  /**
   * Listen for changes to a planet take action,
   * eg.
   * waitForPlanet("yourAsteroidId", ({current}) => current.silverCap / current.silver > 90)
   * .then(() => {
   *  // Send Silver to nearby planet
   * })
   *
   * @param locationId A locationId to watch for updates
   * @param predicate a function that accepts a Diff and should return a truth-y value, value will be passed to promise.resolve()
   * @returns a promise that will resolve with results returned from the predicate function
   */
  public waitForPlanet<T>(
    locationId: LocationId,
    predicate: ({ current, previous }: Diff<Planet>) => T | undefined,
  ): Promise<T> {
    const disposableEmitter = getDisposableEmitter<Planet, LocationId>(
      this.getPlanetMap(),
      locationId,
      this.getPlanetUpdated$(),
    );
    const diffEmitter = generateDiffEmitter(disposableEmitter);
    return new Promise((resolve, reject) => {
      diffEmitter.subscribe(({ current, previous }: Diff<Planet>) => {
        try {
          const predicateResults = predicate({ current, previous });
          if (predicateResults) {
            disposableEmitter.clear();
            diffEmitter.clear();
            resolve(predicateResults);
          }
        } catch (err) {
          disposableEmitter.clear();
          diffEmitter.clear();
          reject(err);
        }
      });
    });
  }

  public getSafeMode() {
    return this.safeMode;
  }

  public setSafeMode(safeMode: boolean) {
    this.safeMode = safeMode;
  }

  public getAddress() {
    return this.ethConnection.getAddress();
  }

  public isAdmin(): boolean {
    return this.getAddress() === this.contractConstants.adminAddress;
  }

  /**
   * Right now the only buffs supported in this way are
   * speed/range buffs from Abandoning a planet.
   *
   * The abandoning argument is used when interacting with
   * this function programmatically.
   */
  public getSpeedBuff(abandoning: boolean): number {
    const { SPACE_JUNK_ENABLED, ABANDON_SPEED_CHANGE_PERCENT } =
      this.contractConstants;
    if (SPACE_JUNK_ENABLED && abandoning) {
      return ABANDON_SPEED_CHANGE_PERCENT / 100;
    }

    return 1;
  }

  public getRangeBuff(abandoning: boolean): number {
    const { SPACE_JUNK_ENABLED, ABANDON_RANGE_CHANGE_PERCENT } =
      this.contractConstants;
    if (SPACE_JUNK_ENABLED && abandoning) {
      return ABANDON_RANGE_CHANGE_PERCENT / 100;
    }

    return 1;
  }

  public getSnarkHelper(): SnarkArgsHelper {
    return this.snarkHelper;
  }

  public async submitTransaction<T extends TxIntent>(
    txIntent: T,
    overrides?: providers.TransactionRequest,
  ): Promise<Transaction<T>> {
    return this.contractsAPI.submitTransaction(txIntent, overrides);
  }

  public getContract() {
    return this.contractsAPI.contract;
  }

  public getPaused(): boolean {
    return this.paused;
  }

  public getPaused$(): Monomitter<boolean> {
    return this.paused$;
  }

  public getHalfPrice(): boolean {
    return this.halfPrice;
  }

  public getHalfPrice$(): Monomitter<boolean> {
    return this.halfPrice$;
  }
}
