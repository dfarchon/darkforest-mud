import { TOKEN_NAME } from "@df/constants";
import type { EthConnection } from "@df/network";
import {
  aggregateBulkGetter,
  ethToWei,
  TxCollection,
  TxExecutor,
} from "@df/network";
import {
  address,
  artifactIdFromEthersBN,
  artifactIdToDecStr,
  // decodeArrival,
  // decodeArtifact,
  // decodeArtifactPointValues,
  // decodeBurnedCoords,
  // decodeClaimedCoords,
  // decodeKardashevCoords,
  // decodePlanet,
  // decodePlanetDefaults,
  // decodePlayer,
  // decodeRevealedCoords,
  // decodeUpgradeBranches,
  locationIdFromEthersBN,
  locationIdToDecStr,
} from "@df/serde";
import type {
  Artifact,
  ArtifactId,
  ArtifactType,
  AutoGasSetting,
  BurnedCoords,
  ClaimedCoords,
  DiagnosticUpdater,
  EthAddress,
  KardashevCoords,
  LocationId,
  Planet,
  Player,
  QueuedArrival,
  RevealedCoords,
  Transaction,
  TransactionId,
  TxIntent,
  VoyageId,
} from "@df/types";
import { Setting } from "@df/types";

import type { Event, providers } from "ethers";
import { BigNumber as EthersBN } from "ethers";
import { EventEmitter } from "events";
import { flatten } from "lodash-es";

import type { ContractConstants } from "../../_types/darkforest/api/ContractsAPITypes";
import {
  ContractEvent,
  ContractsAPIEvent,
  type ContractConfigs,
  type PlanetTypeWeights,
  type PlanetTypeWeightsByLevel,
  type PlanetTypeWeightsBySpaceType,
} from "../../_types/darkforest/api/ContractsAPITypes";
import NotificationManager from "../../Frontend/Game/NotificationManager";
import { openConfirmationWindowForTransaction } from "../../Frontend/Game/Popups";
import { getSetting } from "../../Frontend/Utils/SettingsHooks";
import { loadDiamondContract } from "../Network/Blockchain";
import { setup } from "@mud/setup";
import { SpaceType, type SystemCalls } from "@mud/createSystemCalls";
import type { ClientComponents } from "@mud/createClientComponents";
import type { SetupNetworkResult } from "@mud/setupNetwork";

import { singletonEntity, encodeEntity } from "@latticexyz/store-sync/recs";
import { zeroAddress, type Hex, type HexToRlpErrorType } from "viem";
import { useMUD } from "@mud/MUDContext";
import SpawnPlayer from "@wallet/Components/SpawnPlayerPane";
import { config } from "rxjs";
import type { LocationId } from "@df/types";
import bigInt, { BigInteger } from "big-integer";

import {
  type Entity,
  Has,
  getComponentValue,
  getComponentValueStrict,
  runQuery,
} from "@latticexyz/recs";
import type { Planet } from "@df/types";
import type { LocationId } from "@df/types";
import bigInt from "big-integer";
import { LOCATION_ID_UB } from "@df/constants";

interface ContractsApiConfig {
  connection: EthConnection;
  contractAddress: EthAddress;
  components: ClientComponents;
}

/**
 * Roughly contains methods that map 1:1 with functions that live in the contract. Responsible for
 * reading and writing to and from the blockchain.
 *
 * @todo don't inherit from {@link EventEmitter}. instead use {@link Monomitter}
 */
export class ContractsAPI extends EventEmitter {
  /**
   * Don't allow users to submit txs if balance falls below this amount/
   */
  //todo: this should be change for round 3
  private static readonly MIN_BALANCE = ethToWei(0.00001);

  /**
   * Instrumented {@link ThrottledConcurrentQueue} for blockchain writes.
   */
  public readonly txExecutor: TxExecutor;

  /**
   * Our connection to the blockchain. In charge of low level networking, and also of the burner
   * wallet.
   */
  public readonly ethConnection: EthConnection;

  /**
   * The contract address is saved on the object upon construction
   */
  private contractAddress: EthAddress;

  /**
   * The components, systemCalls and network is from MUD.
   */

  private components: ClientComponents;

  // private systemCalls: SystemCalls;

  // private network: SetupNetworkResult;

  get contract() {
    return this.ethConnection.getContract(this.contractAddress);
  }

  public constructor({
    connection,
    contractAddress,
    components,
  }: ContractsApiConfig) {
    super();
    // this.contractCaller = new ContractCaller();
    this.ethConnection = connection;
    this.contractAddress = contractAddress;
    this.txExecutor = new TxExecutor(
      connection,
      this.getGasFeeForTransaction.bind(this),
      this.beforeQueued.bind(this),
      this.beforeTransaction.bind(this),
      this.afterTransaction.bind(this),
    );
    this.components = components;
    // this.setupEventListeners();
  }

  /**
   * We pass this function into {@link TxExecutor} to calculate what gas fee we should use for the
   * given transaction. The result is either a number, measured in gwei, represented as a string, or
   * a string representing that we want to use an auto gas setting.
   */
  private getGasFeeForTransaction(tx: Transaction): AutoGasSetting | string {
    const config = {
      contractAddress: this.contractAddress,
      account: this.ethConnection.getAddress(),
    };

    if (
      (tx.intent.methodName === "initializePlayer" ||
        tx.intent.methodName === "giveSpaceShips") &&
      tx.intent.contract.address === this.contract.address
    ) {
      const settingValue = getSetting(config, Setting.GasFeeGwei);

      return Number(parseFloat(settingValue) * parseInt("20"))
        .toFixed(16)
        .toString();
    }

    return getSetting(config, Setting.GasFeeGwei);
  }

  /**
   * This function is called by {@link TxExecutor} before a transaction is queued.
   * It gives the client an opportunity to prevent a transaction from being queued based
   * on business logic or user interaction.
   *
   * Reject the promise to prevent the queued transaction from being queued.
   */
  private async beforeQueued(
    id: TransactionId,
    intent: TxIntent,
    overrides?: providers.TransactionRequest,
  ): Promise<void> {
    const address = this.ethConnection.getAddress();
    if (!address) {
      throw new Error("can't send a transaction, no signer");
    }

    const balance = await this.ethConnection.loadBalance(address);

    if (balance.lt(ContractsAPI.MIN_BALANCE)) {
      const notifsManager = NotificationManager.getInstance();
      notifsManager.balanceEmpty();
      throw new Error(`${TOKEN_NAME} balance too low!`);
    }
    const config = {
      contractAddress: this.contractAddress,
      account: this.ethConnection.getAddress(),
    };

    const gasFeeGwei = overrides?.gasPrice
      ? EthersBN.from(overrides?.gasPrice).toNumber()
      : Number(getSetting(config, Setting.GasFeeGwei));

    const gasFeeLimit = Number(
      overrides?.gasLimit || getSetting(config, Setting.GasFeeLimit),
    );

    await openConfirmationWindowForTransaction({
      contractAddress: this.contractAddress,
      connection: this.ethConnection,
      id,
      intent,
      overrides,
      from: address,
      gasFeeGwei,
      gasFeeLimit,
    });
  }

  /**
   * This function is called by {@link TxExecutor} before each transaction. It gives the client an
   * opportunity to prevent a transaction from going through based on business logic or user
   * interaction. To prevent the queued transaction from being submitted, throw an Error.
   */
  private async beforeTransaction(tx: Transaction): Promise<void> {
    this.emit(ContractsAPIEvent.TxProcessing, tx);
  }

  private async afterTransaction(
    _txRequest: Transaction,
    txDiagnosticInfo: unknown,
  ) {
    // NOTE: remove /event
    // eventLogger.logEvent(EventType.Transaction, txDiagnosticInfo);
    console.log("-- afterTransaction --");
    console.log(txDiagnosticInfo);
  }

  public destroy(): void {
    this.removeEventListeners();
  }

  public async setupEventListeners(): Promise<void> {
    const { contract } = this;

    const filter = {
      address: contract.address,
      topics: [
        [
          contract.filters.PlayerInitialized(null, null).topics,
          contract.filters.ArrivalQueued(null, null, null, null, null).topics,
          contract.filters.PlanetUpgraded(null, null, null, null).topics,
          contract.filters.PlanetHatBought(null, null, null).topics,
          contract.filters.PlanetTransferred(null, null, null).topics,
          contract.filters.PlanetInvaded(null, null).topics,
          contract.filters.PlanetCaptured(null, null).topics,
          contract.filters.LocationRevealed(null, null, null, null).topics,
          contract.filters.LocationClaimed(null, null, null).topics,
          //NOTE: prospect planet seems don't change planet state
          contract.filters.PlanetProspected(null, null).topics,
          contract.filters.ArtifactFound(null, null, null).topics,
          contract.filters.ArtifactDeposited(null, null, null).topics,
          contract.filters.ArtifactWithdrawn(null, null, null).topics,
          contract.filters.ArtifactActivated(null, null, null, null).topics,
          contract.filters.ArtifactDeactivated(null, null, null, null).topics,
          contract.filters.PlanetSilverWithdrawn(null, null, null).topics,
          contract.filters.AdminOwnershipChanged(null, null).topics,
          contract.filters.AdminGiveSpaceship(null, null, null).topics,
          contract.filters.PauseStateChanged(null).topics,
          contract.filters.LobbyCreated(null, null).topics,
          contract.filters.LocationBurned(null, null, null, null).topics,
          contract.filters.Kardashev(null, null, null, null).topics,
          contract.filters.LocationBlued(null, null, null).topics,
          contract.filters.PlanetBought(null, null).topics,
          contract.filters.SpaceshipBought(null, null, null).topics,
          contract.filters.HalfPriceChanged(null).topics,
        ].map((topicsOrUndefined) => (topicsOrUndefined || [])[0]),
      ] as Array<string | Array<string>>,
    };

    const eventHandlers = {
      [ContractEvent.PlayerInitialized]: async (
        player: string,
        locRaw: EthersBN,
        _: Event,
      ) => {
        this.emit(ContractsAPIEvent.PlayerUpdate, address(player));
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(locRaw),
        );
        this.emit(ContractsAPIEvent.RadiusUpdated);
      },
      [ContractEvent.ArrivalQueued]: async (
        playerAddr: string,
        arrivalId: EthersBN,
        fromLocRaw: EthersBN,
        toLocRaw: EthersBN,
        _artifactIdRaw: EthersBN,
        _: Event,
      ) => {
        this.emit(
          ContractsAPIEvent.ArrivalQueued,
          arrivalId.toString() as VoyageId,
          locationIdFromEthersBN(fromLocRaw),
          locationIdFromEthersBN(toLocRaw),
        );
        this.emit(ContractsAPIEvent.PlayerUpdate, address(playerAddr));
        this.emit(ContractsAPIEvent.RadiusUpdated);
      },
      [ContractEvent.PlanetUpgraded]: async (
        _playerAddr: string,
        location: EthersBN,
        _branch: EthersBN,
        _toBranchLevel: EthersBN,
        _: Event,
      ) => {
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(location),
        );
      },
      [ContractEvent.PlanetHatBought]: async (
        _playerAddress: string,
        location: EthersBN,
        _: Event,
      ) =>
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(location),
        ),

      [ContractEvent.PlanetTransferred]: async (
        _senderAddress: string,
        planetId: EthersBN,
        receiverAddress: string,
        _: Event,
      ) => {
        this.emit(
          ContractsAPIEvent.PlanetTransferred,
          locationIdFromEthersBN(planetId),
          address(receiverAddress),
        );
      },
      [ContractEvent.PlanetInvaded]: async (
        _playerAddr: string,
        location: EthersBN,
        _: Event,
      ) => {
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(location),
        );
      },
      [ContractEvent.PlanetCaptured]: async (
        _playerAddr: string,
        location: EthersBN,
        _: Event,
      ) => {
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(location),
        );
      },

      [ContractEvent.LocationRevealed]: async (
        revealerAddr: string,
        location: EthersBN,
        _x: EthersBN,
        _y: EthersBN,
        _: Event,
      ) => {
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(location),
        );
        this.emit(
          ContractsAPIEvent.LocationRevealed,
          locationIdFromEthersBN(location),
          address(revealerAddr.toLowerCase()),
        );
        this.emit(ContractsAPIEvent.PlayerUpdate, address(revealerAddr));
      },
      [ContractEvent.LocationClaimed]: async (
        revealerAddr: string,
        _previousClaimer: string,
        location: EthersBN,
        _: Event,
      ) => {
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(location),
        );

        this.emit(
          ContractsAPIEvent.LocationClaimed,
          locationIdFromEthersBN(location),
          address(revealerAddr.toLowerCase()),
        );
        this.emit(ContractsAPIEvent.PlayerUpdate, address(revealerAddr));
        this.emit(ContractsAPIEvent.PlayerUpdate, address(_previousClaimer));
      },

      [ContractEvent.ArtifactFound]: (
        _playerAddr: string,
        rawArtifactId: EthersBN,
        loc: EthersBN,
      ) => {
        const artifactId = artifactIdFromEthersBN(rawArtifactId);
        this.emit(ContractsAPIEvent.ArtifactUpdate, artifactId);
        this.emit(ContractsAPIEvent.PlanetUpdate, locationIdFromEthersBN(loc));
      },
      [ContractEvent.ArtifactDeposited]: (
        _playerAddr: string,
        rawArtifactId: EthersBN,
        loc: EthersBN,
      ) => {
        const artifactId = artifactIdFromEthersBN(rawArtifactId);
        this.emit(ContractsAPIEvent.ArtifactUpdate, artifactId);
        this.emit(ContractsAPIEvent.PlanetUpdate, locationIdFromEthersBN(loc));
      },
      [ContractEvent.ArtifactWithdrawn]: (
        _playerAddr: string,
        rawArtifactId: EthersBN,
        loc: EthersBN,
      ) => {
        const artifactId = artifactIdFromEthersBN(rawArtifactId);
        this.emit(ContractsAPIEvent.ArtifactUpdate, artifactId);
        this.emit(ContractsAPIEvent.PlanetUpdate, locationIdFromEthersBN(loc));
      },
      [ContractEvent.ArtifactActivated]: (
        _playerAddr: string,
        rawArtifactId: EthersBN,
        loc: EthersBN,
        linkTo: EthersBN,
      ) => {
        const artifactId = artifactIdFromEthersBN(rawArtifactId);
        this.emit(ContractsAPIEvent.ArtifactUpdate, artifactId);
        this.emit(ContractsAPIEvent.PlanetUpdate, locationIdFromEthersBN(loc));
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(linkTo),
        );
      },
      [ContractEvent.ArtifactDeactivated]: (
        _playerAddr: string,
        rawArtifactId: EthersBN,
        loc: EthersBN,
        linkTo: EthersBN,
      ) => {
        const artifactId = artifactIdFromEthersBN(rawArtifactId);
        this.emit(ContractsAPIEvent.ArtifactUpdate, artifactId);
        this.emit(ContractsAPIEvent.PlanetUpdate, locationIdFromEthersBN(loc));
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(linkTo),
        );
      },
      [ContractEvent.PlanetSilverWithdrawn]: async (
        player: string,
        location: EthersBN,
        _amount: EthersBN,
        _: Event,
      ) => {
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(location),
        );
        this.emit(ContractsAPIEvent.PlayerUpdate, address(player));
      },

      [ContractEvent.AdminOwnershipChanged]: (
        location: EthersBN,
        _newOwner: string,
      ) => {
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(location),
        );
      },
      [ContractEvent.AdminGiveSpaceship]: (
        location: EthersBN,
        _newOwner: string,
        _type: ArtifactType,
      ) => {
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(location),
        );
      },
      [ContractEvent.PauseStateChanged]: (paused: boolean) => {
        this.emit(ContractsAPIEvent.PauseStateChanged, paused);
      },

      [ContractEvent.HalfPriceChanged]: (halfPrice: boolean) => {
        this.emit(ContractsAPIEvent.HalfPriceChanged, halfPrice);
      },

      [ContractEvent.LobbyCreated]: (ownerAddr: string, lobbyAddr: string) => {
        this.emit(
          ContractsAPIEvent.LobbyCreated,
          address(ownerAddr),
          address(lobbyAddr),
        );
      },

      [ContractEvent.LocationBurned]: async (
        revealerAddr: string,
        location: EthersBN,
        _x: EthersBN,
        _y: EthersBN,
        _: Event,
      ) => {
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(location),
        );
        this.emit(
          ContractsAPIEvent.LocationRevealed,
          locationIdFromEthersBN(location),
          address(revealerAddr.toLowerCase()),
        );
        this.emit(ContractsAPIEvent.PlayerUpdate, address(revealerAddr));
      },

      //todo: this is cool
      [ContractEvent.Kardashev]: async (
        revealerAddr: string,
        location: EthersBN,
        _x: EthersBN,
        _y: EthersBN,

        _: Event,
      ) => {
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(location),
        );
        this.emit(
          ContractsAPIEvent.LocationRevealed,
          locationIdFromEthersBN(location),
          address(revealerAddr.toLowerCase()),
        );
        this.emit(ContractsAPIEvent.PlayerUpdate, address(revealerAddr));
      },

      [ContractEvent.LocationBlued]: async (
        revealerAddr: string,
        location: EthersBN,
        _x: EthersBN,
        _y: EthersBN,
        centerPlanetLocation: EthersBN,
        _: Event,
      ) => {
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(location),
        );
        this.emit(
          ContractsAPIEvent.LocationRevealed,
          locationIdFromEthersBN(location),
          address(revealerAddr.toLowerCase()),
        );
        this.emit(ContractsAPIEvent.PlayerUpdate, address(revealerAddr));

        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(centerPlanetLocation),
        );
      },

      [ContractEvent.PlanetBought]: async (
        player: string,
        locRaw: EthersBN,
        _: Event,
      ) => {
        this.emit(ContractsAPIEvent.PlayerUpdate, address(player));
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(locRaw),
        );
        this.emit(ContractsAPIEvent.RadiusUpdated);
      },
      [ContractEvent.SpaceshipBought]: (
        location: EthersBN,
        _newOwner: string,
        _type: ArtifactType,
      ) => {
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromEthersBN(location),
        );
      },
    };

    this.ethConnection.subscribeToContractEvents(
      contract,
      eventHandlers,
      filter,
    );
  }

  public removeEventListeners(): void {
    const { contract } = this;

    contract.removeAllListeners(ContractEvent.PlayerInitialized);
    contract.removeAllListeners(ContractEvent.ArrivalQueued);
    contract.removeAllListeners(ContractEvent.PlanetUpgraded);
    contract.removeAllListeners(ContractEvent.PlanetHatBought);
    contract.removeAllListeners(ContractEvent.PlanetTransferred);
    contract.removeAllListeners(ContractEvent.ArtifactFound);
    contract.removeAllListeners(ContractEvent.ArtifactDeposited);
    contract.removeAllListeners(ContractEvent.ArtifactWithdrawn);
    contract.removeAllListeners(ContractEvent.ArtifactActivated);
    contract.removeAllListeners(ContractEvent.ArtifactDeactivated);
    contract.removeAllListeners(ContractEvent.LocationRevealed);
    contract.removeAllListeners(ContractEvent.LocationClaimed);
    contract.removeAllListeners(ContractEvent.PlanetSilverWithdrawn);
    contract.removeAllListeners(ContractEvent.PlanetInvaded);
    contract.removeAllListeners(ContractEvent.PlanetCaptured);
    contract.removeAllListeners(ContractEvent.LocationBurned);
    contract.removeAllListeners(ContractEvent.Kardashev);
  }

  public getContractAddress(): EthAddress {
    return this.contractAddress;
  }

  public setDiagnosticUpdater(diagnosticUpdater?: DiagnosticUpdater) {
    this.txExecutor?.setDiagnosticUpdater(diagnosticUpdater);
    this.ethConnection.setDiagnosticUpdater(diagnosticUpdater);
  }

  public async submitTransaction<T extends TxIntent>(
    txIntent: T,
    overrides?: providers.TransactionRequest,
  ): Promise<Transaction<T>> {
    const config = {
      contractAddress: this.contractAddress,
      account: this.ethConnection.getAddress(),
    };
    const queuedTx = await this.txExecutor.queueTransaction(txIntent, {
      gasLimit: getSetting(config, Setting.GasFeeLimit),
      ...overrides,
    });

    this.emit(ContractsAPIEvent.TxQueued, queuedTx);
    // TODO: Why is this setTimeout here? Can it be removed?
    setTimeout(() => this.emitTransactionEvents(queuedTx), 0);

    return queuedTx;
  }

  /**
   * Remove a transaction from the queue.
   */
  public cancelTransaction(tx: Transaction): void {
    this.txExecutor.dequeueTransction(tx);
    this.emit(ContractsAPIEvent.TxCancelled, tx);
  }

  /**
   * Make sure this transaction is the next to be executed.
   */
  public prioritizeTransaction(tx: Transaction): void {
    this.txExecutor.prioritizeTransaction(tx);
    this.emit(ContractsAPIEvent.TxPrioritized, tx);
  }

  /**
   * This is a strange interface between the transaction queue system and the rest of the game. The
   * strange thing about it is that introduces another way by which transactions are pushed into the
   * game - these {@code ContractsAPIEvent} events.
   */
  public emitTransactionEvents(tx: Transaction): void {
    tx.submittedPromise
      .then(() => {
        this.emit(ContractsAPIEvent.TxSubmitted, tx);
      })
      .catch(() => {
        this.emit(ContractsAPIEvent.TxErrored, tx);
      });

    tx.confirmedPromise
      .then(() => {
        this.emit(ContractsAPIEvent.TxConfirmed, tx);
      })
      .catch(() => {
        this.emit(ContractsAPIEvent.TxErrored, tx);
      });
  }

  public getAddress() {
    return this.ethConnection.getAddress();
  }

  // public async getEntryFee(): Promise<EthersBN> {}

  // async getScoreV3(
  //   address: EthAddress | undefined,
  // ): Promise<number | undefined> {}

  getConstants(): ContractConfigs | undefined {
    const {
      TempConfigSet,
      UniverseConfig,
      SpaceTypeConfig,
      UniverseZoneConfig,
      PlanetLevelConfig,
      PlanetTypeConfig,
      UpgradeConfig,
      SnarkConfig,
    } = this.components;

    const tempConfigSet = getComponentValue(TempConfigSet, singletonEntity);
    const universeConfig = getComponentValue(UniverseConfig, singletonEntity);
    const spaceTypeConfig = getComponentValue(SpaceTypeConfig, singletonEntity);
    const universeZoneConfig = getComponentValue(
      UniverseZoneConfig,
      singletonEntity,
    );

    const planetLevelConfig = getComponentValue(
      PlanetLevelConfig,
      singletonEntity,
    );

    const upgradeConfig = getComponentValue(UpgradeConfig, singletonEntity);
    const snarkConfig = getComponentValue(SnarkConfig, singletonEntity);

    // console.log(tempConfigSet);
    // console.log(universeConfig);
    // console.log(spaceTypeConfig);
    // console.log(universeZoneConfig);
    // console.log(planetLevelConfig);
    // console.log(upgradeConfig);
    // console.log(snarkConfig);

    if (
      !tempConfigSet ||
      !universeConfig ||
      !spaceTypeConfig ||
      !universeZoneConfig ||
      !planetLevelConfig ||
      !upgradeConfig ||
      !snarkConfig
    ) {
      return undefined;
    }

    const PLANET_TYPE_WEIGHTS = [];
    for (let i = 1; i <= 4; i++) {
      const value = [];
      for (let j = 0; j <= 9; j++) {
        const key = encodeEntity(PlanetTypeConfig.metadata.keySchema, {
          spaceType: i,
          level: j,
        });
        const rawResult = getComponentValue(PlanetTypeConfig, key);
        if (rawResult === undefined) {
          return undefined;
        }
        const planetTypeWeights = [
          rawResult.thresholds[0],
          rawResult.thresholds[1],
          rawResult.thresholds[2],
          rawResult.thresholds[3],
          rawResult.thresholds[4],
        ];
        value.push(planetTypeWeights);
      }
      PLANET_TYPE_WEIGHTS.push(value);
    }

    const configs: ContractConfigs = {
      BIOME_CHECKS: tempConfigSet.biomeCheck,
      DISABLE_ZK_CHECKS: tempConfigSet.skipProofCheck,
      PLAYER_AMOUNT_LIMIT: tempConfigSet.playerLimit,
      INIT_PERLIN_MIN: tempConfigSet.spawnPerlinMin,
      INIT_PERLIN_MAX: tempConfigSet.spawnPerlinMax,
      LOCATION_REVEAL_COOLDOWN: Number(tempConfigSet.revealCd),
      PLANET_RARITY: Number(universeConfig.sparsity),
      WORLD_RADIUS_MIN: Number(universeConfig.radius),
      PERLIN_THRESHOLD_1: spaceTypeConfig.perlinThresholds[0],
      PERLIN_THRESHOLD_2: spaceTypeConfig.perlinThresholds[1],
      PERLIN_THRESHOLD_3: spaceTypeConfig.perlinThresholds[2],
      MAX_LEVEL_DIST: universeZoneConfig.borders.map((x) => Number(x)),
      MAX_LEVEL_LIMIT: universeZoneConfig.planetLevelLimits,
      MIN_LEVEL_BIAS: universeZoneConfig.planetLevelBonus,
      PLANET_LEVEL_THRESHOLDS: planetLevelConfig.thresholds,
      PLANET_TYPE_WEIGHTS: PLANET_TYPE_WEIGHTS as PlanetTypeWeightsBySpaceType,
      PLANETHASH_KEY: Number(snarkConfig.planetHashKey),
      BIOMEBASE_KEY: Number(snarkConfig.biomeBaseKey),
      SPACETYPE_KEY: Number(snarkConfig.spaceTypeKey),
      PERLIN_LENGTH_SCALE: Number(snarkConfig.perlinLengthScale),
      PERLIN_MIRROR_X: snarkConfig.perlinMirrorX === 1,
      PERLIN_MIRROR_Y: snarkConfig.perlinMirrorY === 1,
    };

    return configs;
  }

  public getPlayers(
    onProgress?: (fractionCompleted: number) => void,
  ): Map<string, Player> | undefined {
    const { Player } = this.components;

    const playerIds = [...runQuery([Has(Player)])];
    const nPlayers: number = playerIds.length;

    const playerMap: Map<EthAddress, Player> = new Map();

    for (let i = 0; i < nPlayers; i++) {
      const playerId = "0x" + playerIds[i].slice(-40);
      const player = this.getPlayerById(playerId as Hex);
      if (!player) {
        continue;
      }
      playerMap.set(player?.address, player);
      onProgress && onProgress((i + 1) / nPlayers);
    }

    return playerMap;
  }

  public getPlayerById(playerId: Hex): Player | undefined {
    const { Player, SpawnPlanet, LastReveal } = this.components;
    const playerKey = encodeEntity(Player.metadata.keySchema, {
      owner: playerId,
    });
    const rawPlayer = getComponentValue(Player, playerKey);

    const spawnPlanetKey = encodeEntity(SpawnPlanet.metadata.keySchema, {
      player: playerId,
    });

    const rawSpawnPlanet = getComponentValue(SpawnPlanet, spawnPlanetKey);

    const lastRevealKey = encodeEntity(LastReveal.metadata.keySchema, {
      player: playerId,
    });

    const lastReveal = getComponentValue(LastReveal, lastRevealKey);

    if (!rawPlayer) {
      return undefined;
    }

    const player: Player = {
      address: playerId as EthAddress,
      burner: rawPlayer.burner as EthAddress,
      index: rawPlayer.index,
      createdAt: Number(rawPlayer.createdAt),
      name: rawPlayer.name,
      homePlanetId: rawSpawnPlanet
        ? (rawSpawnPlanet.planet.toString() as LocationId)
        : undefined,
      lastRevealTickNumber: lastReveal ? lastReveal.tickNumber : 0n,
    };

    return player;
  }

  public getWorldRadius(): number | undefined {
    const { UniverseConfig } = this.components;
    const result = getComponentValue(UniverseConfig, singletonEntity);
    return result === undefined ? undefined : Number(result.radius);
  }

  // timestamp since epoch (in seconds)
  // public async getTokenMintEndTimestamp(): Promise<number> {}

  // public async getArrival(
  //   arrivalId: number,
  // ): Promise<QueuedArrival | undefined> {}

  public async getArrivalsForPlanet(
    planetId: LocationId,
  ): Promise<QueuedArrival[]> {}

  public async getAllArrivals(
    planetsToLoad: LocationId[],
    onProgress?: (fractionCompleted: number) => void,
  ): Promise<QueuedArrival[]> {}

  public async getTouchedPlanetIds(
    // startingAt: number,
    onProgress?: (fractionCompleted: number) => void,
  ): Promise<LocationId[]> {
    const { Planet } = this.components;
    const planets = [...runQuery([Has(Planet)])];
    const nPlanets: number = planets.length;
    const result = [];
    for (let i = 0; i < nPlanets; i++) {
      const locationId = planets[i].toString() as LocationId;
      result.push(locationId);
      onProgress && onProgress((i + 1) / nPlanets);
    }
    return result;
  }

  public getRevealedCoordsByIdIfExists(
    planetId: LocationId,
  ): RevealedCoords | undefined {
    const { RevealedPlanet } = this.components;
    const revealedPlanetId = encodeEntity(RevealedPlanet.metadata.keySchema, {
      id: locationIdToDecStr(planetId) as Hex,
    });
    const revealedPlanet = getComponentValue(RevealedPlanet, revealedPlanetId);
    if (!revealedPlanet) {
      return undefined;
    }

    const result: RevealedCoords = {
      x: revealedPlanet.x as number,
      y: revealedPlanet.y as number,
      revealer: revealedPlanet.revealer as EthAddress,
      hash: planetId as LocationId,
    };

    return result;
  }

  public getIsPaused(): boolean | undefined {
    const { Ticker } = this.components;
    const ticker = getComponentValue(Ticker, singletonEntity);
    if (!ticker) {
      return undefined;
    }
    return ticker.paused;
  }

  public getRevealedPlanetsCoords(
    // startingAt: number,
    // onProgressIds?: (fractionCompleted: number) => void,
    onProgressCoords?: (fractionCompleted: number) => void,
  ): RevealedCoords[] {
    const { RevealedPlanet } = this.components;
    const planetIds = [...runQuery([Has(RevealedPlanet)])];
    const result: RevealedCoords[] = [];
    const nPlanetIds = planetIds.length;

    for (let i = 0; i < nPlanetIds; i++) {
      const planetId = planetIds[i].toString() as LocationId;
      const revealedCroods = this.getRevealedCoordsByIdIfExists(planetId);
      if (!revealedCroods) {
        continue;
      }
      result.push(revealedCroods);
      onProgressCoords && onProgressCoords((i + 1) / nPlanetIds);
    }
    return result;
  }

  // public async getClaimedCoordsByIdIfExists(
  //   planetId: LocationId,
  // ): Promise<ClaimedCoords | undefined> {}

  // public async getClaimedPlanetsCoords(
  //   startingAt: number,
  //   onProgressIds?: (fractionCompleted: number) => void,
  //   onProgressCoords?: (fractionCompleted: number) => void,
  // ): Promise<ClaimedCoords[]> {}

  // public async getBurnedCoordsByIdIfExists(
  //   planetId: LocationId,
  // ): Promise<BurnedCoords | undefined> {}

  // public async getBurnedPlanetsCoords(
  //   startingAt: number,
  //   onProgressIds?: (fractionCompleted: number) => void,
  //   onProgressCoords?: (fractionCompleted: number) => void,
  // ): Promise<BurnedCoords[]> {}

  // public async getKardashevCoordsByIdIfExists(
  //   planetId: LocationId,
  // ): Promise<KardashevCoords | undefined> {}

  // public async getKardashevPlanetsCoords(
  //   startingAt: number,
  //   onProgressIds?: (fractionCompleted: number) => void,
  //   onProgressCoords?: (fractionCompleted: number) => void,
  // ): Promise<KardashevCoords[]> {}

  public async bulkGetPlanets(
    toLoadPlanets: LocationId[],
    onProgressPlanet?: (fractionCompleted: number) => void,
  ): Promise<Map<LocationId, Planet>> {}

  public _validateHash(planet: Planet): boolean {
    const locationBI = bigInt(planet.locationId, 16);
    if (locationBI.geq(LOCATION_ID_UB)) {
      return false;
      // throw new Error("not a valid location");
    }
    return true;
  }

  public _initPlanet(planet: Planet): Planet | undefined {
    const { Ticker } = this.components;

    const result_1 = this._initZone(planet);
    if (!result_1) {
      return undefined;
    }
    planet = result_1;

    const result_2 = this._initSpaceType(planet);
    if (!result_2) {
      return undefined;
    }
    planet = result_2;

    planet = this._initLevel(planet);
    planet = this._initPlanetType(planet);
    planet = this._initPopulationAndSilver(planet);
    const ticker = getComponentValue(Ticker, singletonEntity);
    planet.lastUpdateTick = ticker ? Number(ticker.tickNumber) : 0;
    return planet;
  }

  public _initZone(planet: Planet): Planet | undefined {
    const { UniverseZoneConfig } = this.components;
    const universeZoneConfig = getComponentValue(
      UniverseZoneConfig,
      singletonEntity,
    );

    if (!universeZoneConfig) {
      return undefined;
    }

    const borders = universeZoneConfig.borders;
    const distanceSquare = planet.distSquare;
    const maxZone = borders.length;

    for (let i = 0; i < maxZone; ) {
      if (distanceSquare < borders[i] * borders[i]) {
        planet.universeZone = i;
        return planet;
      }
      ++i;
    }
    planet.universeZone = maxZone;
    return planet;
  }

  public _initSpaceType(planet: Planet): Planet | undefined {
    const { SpaceTypeConfig, UniverseZoneConfig } = this.components;
    const spaceTypeConfig = getComponentValue(SpaceTypeConfig, singletonEntity);
    const universeZoneConfig = getComponentValue(
      UniverseZoneConfig,
      singletonEntity,
    );

    if (!spaceTypeConfig) {
      return undefined;
    }
    if (!universeZoneConfig) {
      return undefined;
    }

    const thresholds = spaceTypeConfig.perlinThresholds;
    const perlin = planet.perlin;
    const length = thresholds.length;
    if (planet.universeZone + 1 === universeZoneConfig.borders.length) {
      // planet.spaceType =
      return planet;
    }
  }

  public _initLevel(planet: Planet): Planet {}

  public _initPlanetType(planet: Planet): Planet {}

  public _initPopulationAndSilver(planet: Planet): Planet {}

  public getPlanetById(planetId: LocationId) {
    const { Planet } = this.components;
    const planetKey = encodeEntity(Planet.metadata.keySchema, {
      id: ("0x" + planetId) as Hex,
    });

    const planet = getComponentValue(Planet, planetKey);
    return planet;
  }

  // public async getArtifactById(
  //   artifactId: ArtifactId,
  // ): Promise<Artifact | undefined> {}

  // public async bulkGetArtifactsOnPlanets(
  //   locationIds: LocationId[],
  //   onProgress?: (fractionCompleted: number) => void,
  // ): Promise<Artifact[][]> {}

  // public async bulkGetArtifacts(
  //   artifactIds: ArtifactId[],
  //   onProgress?: (fractionCompleted: number) => void,
  // ): Promise<Artifact[]> {}

  // public async getPlayerArtifacts(
  //   playerId?: EthAddress,
  //   onProgress?: (percent: number) => void,
  // ): Promise<Artifact[]> {}

  // public async getPlayerSpaceships(
  //   playerId?: EthAddress,
  //   onProgress?: (percent: number) => void,
  // ): Promise<Artifact[]> {}

  // public async getNTargetPlanetArrivalIds(
  //   planetId: LocationId,
  // ): Promise<number> {}

  // public async getTargetPlanetArrivalIdsRangeWithTimestamp(
  //   planetId: LocationId,
  //   timestamp: number,
  // ): Promise<number[]> {}

  // public async getTargetPlanetArrivalIdsWithTimestamp(
  //   planetId: LocationId,
  //   timestamp: number,
  // ): Promise<number[]> {}

  // public async getTargetPlanetAllArrivals(
  //   planetId: LocationId,
  //   timestamp: number,
  //   onProgress?: (fractionCompleted: number) => void,
  // ): Promise<QueuedArrival[]> {}
}

export async function makeContractsAPI({
  connection,
  contractAddress,
  components,
}: ContractsApiConfig): Promise<ContractsAPI> {
  await connection.loadContract(contractAddress, loadDiamondContract);

  return new ContractsAPI({ connection, contractAddress, components });
}
