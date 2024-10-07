import { EMPTY_LOCATION_ID, TOKEN_NAME } from "@df/constants";
import type { EthConnection } from "@df/network";
import {
  aggregateBulkGetter,
  ContractCaller,
  ethToWei,
  // TxCollection,
  TxExecutor,
} from "@df/network";
import {
  address,
  addressToHex,
  artifactIdFromEthersBN,
  hexToEthAddress,
  // artifactIdToDecStr,
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
  locationIdFromHexStr,
  locationIdToDecStr,
  locationIdFromDecStr,
  locationIdToHexStr,
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
  Upgrade,
  UpgradeBranches,
  UpgradeLevels,
  VoyageId,
} from "@df/types";
import { Setting } from "@df/types";
import { hexToResource } from "@latticexyz/common";
import {
  type Entity,
  getComponentValue,
  getComponentValueStrict,
  Has,
  runQuery,
} from "@latticexyz/recs";
import {
  encodeEntity,
  singletonEntity,
  decodeEntity,
} from "@latticexyz/store-sync/recs";
import type { ClientComponents } from "@mud/createClientComponents";
import type { ContractFunction, Event, providers } from "ethers";
import { BigNumber as EthersBN } from "ethers";
import { EventEmitter } from "events";
import { flatten } from "lodash-es";
import type { Hex } from "viem";
import type { Subscription } from "rxjs";

import type {
  ContractConstants,
  PlanetTypeWeightsBySpaceType,
} from "../../_types/darkforest/api/ContractsAPITypes";
import {
  ContractEvent,
  ContractsAPIEvent,
} from "../../_types/darkforest/api/ContractsAPITypes";
import NotificationManager from "../../Frontend/Game/NotificationManager";
import { openConfirmationWindowForTransaction } from "../../Frontend/Game/Popups";
import { getSetting } from "../../Frontend/Utils/SettingsHooks";
import { loadDiamondContract } from "../Network/Blockchain";
import { MoveUtils } from "./MoveUtils";
import { PlanetUtils } from "./PlanetUtils";
import { TickerUtils } from "./TickerUtils";

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
   * Instrumented {@link ThrottledConcurrentQueue} for blockchain reads.
   */
  private readonly contractCaller: ContractCaller;

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

  private contractConstants: ContractConstants;

  private planetUtils: PlanetUtils;
  private moveUtils: MoveUtils;
  private tickerUtils: TickerUtils;

  private pausedStateSubscription: Subscription;
  private spawnPlayerSubscription: Subscription;
  private moveSubscription: Subscription;
  private planetSubscription: Subscription;

  get contract() {
    return this.ethConnection.getContract(this.contractAddress);
  }

  public constructor({
    connection,
    contractAddress,
    components,
  }: ContractsApiConfig) {
    super();
    this.contractCaller = new ContractCaller();
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
    this.contractConstants = this.getConstants();
    this.planetUtils = new PlanetUtils({
      components: components,
      contractConstants: this.contractConstants,
    });
    this.moveUtils = new MoveUtils({ components });
    this.tickerUtils = new TickerUtils({ components });

    this.setupEventListeners();
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

  private makeCall<T>(
    contractViewFunction: ContractFunction<T>,
    args: unknown[] = [],
  ): Promise<T> {
    return this.contractCaller.makeCall(contractViewFunction, args);
  }

  public async setupEventListeners(): Promise<void> {
    this.pausedStateSubscription = this.components.Ticker.update$.subscribe(
      (update) => {
        const [nextValue, prevValue] = update.value;
        this.emit(ContractsAPIEvent.PauseStateChanged, nextValue?.paused);
      },
    );

    this.spawnPlayerSubscription =
      this.components.SpawnPlanet.update$.subscribe((update) => {
        const entity = update.entity;
        const [nextValue] = update.value;

        if (nextValue) {
          const playerId = hexToEthAddress(entity.toString() as Hex);
          const locationId = locationIdFromDecStr(nextValue.planet.toString());

          this.emit(ContractsAPIEvent.PlayerUpdate, playerId);
          this.emit(ContractsAPIEvent.RadiusUpdated);
          this.emit(ContractsAPIEvent.PlanetUpdate, locationId);
        }
      });

    this.moveSubscription = this.components.Move.update$.subscribe((update) => {
      const entity = update.entity;
      const [nextValue] = update.value;
      const keyTuple = decodeEntity(
        this.components.Move.metadata.keySchema,
        entity,
      );

      if (nextValue) {
        const fromId = locationIdFromHexStr(nextValue.from);
        const toId = locationIdFromHexStr(keyTuple.to);
        const arrivalId = nextValue.id.toString() as VoyageId;
        const playerAddr = address(nextValue.captain);

        //PUNK
        // const { Planet } = this.components;
        // const planetKey = encodeEntity(Planet.metadata.keySchema, {
        //   id: "0x0000000079b5cf911e8b7f724f23977d5d0e657fe8c7c15c390df58fff0b7bc3",
        // });
        // const planet = getComponentValue(Planet, planetKey);
        // console.log("Source Planet");
        // console.log(planet);
        // const targetPlanetKey = encodeEntity(Planet.metadata.keySchema, {
        //   id: "0x0000000067708b3055e39901573131d62ef285e171e6d2716052efa25702e18d",
        // });
        // const targetPlanet = getComponentValue(Planet, targetPlanetKey);
        // console.log("Target Planet");
        // console.log(targetPlanet);
        // console.log("ArrivalId", arrivalId);
        // console.log("fromId", fromId);
        // console.log("toId", toId);

        this.emit(ContractsAPIEvent.ArrivalQueued, arrivalId, fromId, toId);
        this.emit(ContractsAPIEvent.PlayerUpdate, playerAddr);
        this.emit(ContractsAPIEvent.RadiusUpdated);
      }
    });

    this.planetSubscription = this.components.Planet.update$.subscribe(
      (update) => {
        const entity = update.entity;
        const keyTuple = decodeEntity(
          this.components.Planet.metadata.keySchema,
          entity,
        );
        this.emit(
          ContractsAPIEvent.PlanetUpdate,
          locationIdFromHexStr(keyTuple.id),
        );
      },
    );

    return;

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
    this.pausedStateSubscription.unsubscribe();
    this.spawnPlayerSubscription.unsubscribe();
    this.moveSubscription.unsubscribe();
    this.planetSubscription.unsubscribe();
    return;
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

  public setDiagnosticUpdater(diagnosticUpdater?: DiagnosticUpdater) {
    this.contractCaller.setDiagnosticUpdater(diagnosticUpdater);
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

  public getContractAddress(): EthAddress {
    return this.contractAddress;
  }

  public getCurrentTick(): number {
    return this.tickerUtils.getTickNumber();
  }

  public hasJoinedGame(playerId: EthAddress): boolean {
    const { SpawnPlanet } = this.components;

    const spawnPlanetKey = encodeEntity(SpawnPlanet.metadata.keySchema, {
      player: addressToHex(playerId),
    });

    const result = getComponentValue(SpawnPlanet, spawnPlanetKey);

    return result !== undefined;
  }

  public getConstants(): ContractConstants {
    const {
      NamespaceOwner,
      TempConfigSet,
      UniverseConfig,
      SpaceTypeConfig,
      UniverseZoneConfig,
      PlanetLevelConfig,
      PlanetBiomeConfig,
      PlanetTypeConfig,
      UpgradeConfig,
      SnarkConfig,
    } = this.components;

    const namespaceId =
      "0x6e73646600000000000000000000000000000000000000000000000000000000";
    // const resource = hexToResource(namespaceId);
    // console.log(resource);
    const result = getComponentValue(
      NamespaceOwner,
      namespaceId.toString() as Entity,
    );

    const adminAddress = result?.owner;

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
    const planetBiomeConfig = getComponentValue(
      PlanetBiomeConfig,
      singletonEntity,
    );
    // const planetTypeConfig = getComponentValue(PlanetTypeConfig,singletoneEntity);
    const upgradeConfig = getComponentValue(UpgradeConfig, singletonEntity);
    const snarkConfig = getComponentValue(SnarkConfig, singletonEntity);
    if (
      !adminAddress ||
      !tempConfigSet ||
      !universeConfig ||
      !spaceTypeConfig ||
      !universeZoneConfig ||
      !planetLevelConfig ||
      !planetBiomeConfig ||
      !upgradeConfig ||
      !snarkConfig
    ) {
      throw new Error("not set contracts constants yet");
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
          throw new Error("not set contracts constants yet");
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

    const defenseUpgrade: Upgrade = {
      energyCapMultiplier: upgradeConfig.populationCapMultiplier,
      energyGroMultiplier: upgradeConfig.populationGrowthMultiplier,
      rangeMultiplier: 100,
      speedMultiplier: 100,
      defMultiplier: upgradeConfig.defenseMultiplier,
    };

    const defenseUpgrades: UpgradeLevels = [
      defenseUpgrade,
      defenseUpgrade,
      defenseUpgrade,
      defenseUpgrade,
    ];

    const rangeUpgrade: Upgrade = {
      energyCapMultiplier: upgradeConfig.populationCapMultiplier,
      energyGroMultiplier: upgradeConfig.populationGrowthMultiplier,
      rangeMultiplier: upgradeConfig.rangeMultiplier,
      speedMultiplier: 100,
      defMultiplier: 100,
    };

    const rangeUpgrades: UpgradeLevels = [
      rangeUpgrade,
      rangeUpgrade,
      rangeUpgrade,
      rangeUpgrade,
    ];

    const speedUpgrade: Upgrade = {
      energyCapMultiplier: upgradeConfig.populationCapMultiplier,
      energyGroMultiplier: upgradeConfig.populationGrowthMultiplier,
      rangeMultiplier: 100,
      speedMultiplier: upgradeConfig.speedMultiplier,
      defMultiplier: 100,
    };

    const speedUpgrades: UpgradeLevels = [
      speedUpgrade,
      speedUpgrade,
      speedUpgrade,
      speedUpgrade,
    ];

    const upgrades: UpgradeBranches = [
      defenseUpgrades,
      rangeUpgrades,
      speedUpgrades,
    ];

    const constants: ContractConstants = {
      BIOME_CHECKS: tempConfigSet.biomeCheck,
      DISABLE_ZK_CHECKS: tempConfigSet.skipProofCheck,
      PLAYER_AMOUNT_LIMIT: tempConfigSet.playerLimit,
      INIT_PERLIN_MIN: tempConfigSet.spawnPerlinMin,
      INIT_PERLIN_MAX: tempConfigSet.spawnPerlinMax,
      LOCATION_REVEAL_COOLDOWN: tempConfigSet.revealCd,

      PLANET_RARITY: Number(universeConfig.sparsity),
      WORLD_RADIUS_MIN: Number(universeConfig.radius),

      /**
       * The perlin value at each coordinate determines the space type. There are four space
       * types, which means there are four ranges on the number line that correspond to
       * each space type. This function returns the boundary values between each of these
       * four ranges: `PERLIN_THRESHOLD_1`, `PERLIN_THRESHOLD_2`, `PERLIN_THRESHOLD_3`.
       */
      PERLIN_THRESHOLD_1: spaceTypeConfig.perlinThresholds[0],
      PERLIN_THRESHOLD_2: spaceTypeConfig.perlinThresholds[1],
      PERLIN_THRESHOLD_3: spaceTypeConfig.perlinThresholds[2],
      SPACE_TYPE_PLANET_LEVEL_LIMITS: spaceTypeConfig.planetLevelLimits,
      SPACE_TYPE_PLANET_LEVEL_BONUS: spaceTypeConfig.planetLevelBonus,

      MAX_LEVEL_DIST: universeZoneConfig.borders.map((val) => Number(val)),
      MAX_LEVEL_LIMIT: universeZoneConfig.planetLevelLimits,
      MIN_LEVEL_BIAS: universeZoneConfig.planetLevelBonus,

      /**
         The chance for a planet to be a specific level.
         Each index corresponds to a planet level (index 5 is level 5 planet).
         The lower the number the lower the chance.
         Note: This does not control if a planet spawns or not, just the level
         when it spawns.
       */
      PLANET_LEVEL_THRESHOLDS: planetLevelConfig.thresholds,

      BIOME_THRESHOLD_1: planetBiomeConfig.threshold1,
      BIOME_THRESHOLD_2: planetBiomeConfig.threshold2,

      upgrades: upgrades,

      PLANET_TYPE_WEIGHTS: PLANET_TYPE_WEIGHTS as PlanetTypeWeightsBySpaceType,

      PLANETHASH_KEY: Number(snarkConfig.planetHashKey),
      BIOMEBASE_KEY: Number(snarkConfig.biomeBaseKey),
      SPACETYPE_KEY: Number(snarkConfig.spaceTypeKey),
      PERLIN_LENGTH_SCALE: Number(snarkConfig.perlinLengthScale),
      PERLIN_MIRROR_X: snarkConfig.perlinMirrorX === 1,
      PERLIN_MIRROR_Y: snarkConfig.perlinMirrorY === 1,
      adminAddress: adminAddress as EthAddress,

      // TODO: Planet default state

      // defaultPopulationCap: number[];
      // defaultPopulationGrowth: number[];
      // defaultSilverCap: number[];
      // defaultSilverGrowth: number[];
      // defaultRange: number[];
      // defaultSpeed: number[];
      // defaultDefense: number[];
      // defaultBarbarianPercentage: number[];
      // planetCumulativeRarities: number[];
    };

    return constants;
  }

  public getPlayerById(playerId: EthAddress): Player | undefined {
    const { Player, SpawnPlanet, LastReveal } = this.components;
    const playerKey = encodeEntity(Player.metadata.keySchema, {
      owner: addressToHex(playerId),
    });
    const rawPlayer = getComponentValue(Player, playerKey);
    const spawnPlanetKey = encodeEntity(SpawnPlanet.metadata.keySchema, {
      player: addressToHex(playerId),
    });
    const rawSpawnPlanet = getComponentValue(SpawnPlanet, spawnPlanetKey);
    const lastRevealKey = encodeEntity(LastReveal.metadata.keySchema, {
      player: addressToHex(playerId),
    });
    const lastReveal = getComponentValue(LastReveal, lastRevealKey);
    if (!rawPlayer) {
      return undefined;
    }

    const player: Player = {
      address: playerId,
      burner: address(rawPlayer.burner),
      index: rawPlayer.index,
      createdAt: Number(rawPlayer.createdAt),
      name: rawPlayer.name,
      homePlanetId: rawSpawnPlanet
        ? (rawSpawnPlanet.planet.toString() as LocationId)
        : undefined,
      lastRevealTimestamp: lastReveal ? Number(lastReveal.tickNumber) : 0,
    };
    return player;
  }

  public getPlayers(
    onProgress?: (fractionCompleted: number) => void,
  ): Map<string, Player> {
    const { Player } = this.components;
    const playerIds = [...runQuery([Has(Player)])];
    const nPlayers: number = playerIds.length;

    const playerMap: Map<EthAddress, Player> = new Map();

    for (let i = 0; i < nPlayers; i++) {
      const playerId = hexToEthAddress(playerIds[i].toString() as Hex);

      const player = this.getPlayerById(playerId);
      if (!player) {
        continue;
      }
      // playerMap.set(player.address, player);
      playerMap.set(player.burner, player);

      onProgress && onProgress((i + 1) / nPlayers);
    }
    return playerMap;
  }

  public getWorldRadius(): number {
    const { UniverseConfig } = this.components;
    const universeConfig = getComponentValue(UniverseConfig, singletonEntity);
    if (!universeConfig) {
      throw new Error("need to set universe config");
    }

    return Number(universeConfig.radius);
  }

  //TODO fix getArrival
  // public async getArrival(
  //   arrivalId: number,
  // ): Promise<QueuedArrival | undefined> {
  //   const rawArrival = await this.makeCall(this.contract.planetArrivals, [
  //     arrivalId,
  //   ]);
  //   return decodeArrival(rawArrival);
  // }

  public getArrivalsForPlanet(planetId: LocationId): QueuedArrival[] {
    return this.moveUtils.getArrivalsForPlanet(planetId);
  }

  public getAllArrivals(
    planetsToLoad: LocationId[],
    onProgress?: (fractionCompleted: number) => void,
  ): QueuedArrival[] {
    return this.moveUtils.getAllArrivals(planetsToLoad, onProgress);
  }

  public getTouchedPlanetIds(
    // startingAt: number,
    onProgress?: (fractionCompleted: number) => void,
  ): LocationId[] {
    const { Planet } = this.components;
    const planets = [...runQuery([Has(Planet)])];
    const nPlanets: number = planets.length;
    const result = [];
    for (let i = 0; i < nPlanets; i++) {
      // NOTE: may need serde function here
      const locationId = locationIdFromHexStr(
        planets[i].toString(),
      ) as LocationId;
      result.push(locationId);
      onProgress && onProgress((i + 1) / nPlanets);
    }
    return result;
  }

  public getRevealedCoordsByIdIfExists(
    planetId: LocationId,
  ): RevealedCoords | undefined {
    const { RevealedPlanet } = this.components;
    // console.log("revlead coords by Id if exists");
    // console.log(locationIdToHexStr(planetId));
    const revealedPlanetId = encodeEntity(RevealedPlanet.metadata.keySchema, {
      id: locationIdToHexStr(planetId) as Hex,
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

  public getIsPaused(): boolean {
    const { Ticker } = this.components;
    const ticker = getComponentValue(Ticker, singletonEntity);
    if (!ticker) {
      return false;
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
      const planetId = locationIdFromHexStr(planetIds[i].toString());

      const revealedCoords = this.getRevealedCoordsByIdIfExists(planetId);
      if (!revealedCoords) {
        continue;
      }
      result.push(revealedCoords);
      onProgressCoords && onProgressCoords((i + 1) / nPlanetIds);
    }

    onProgressCoords && onProgressCoords(1);

    return result;
  }

  public getPlanetById(planetId: LocationId): Planet | undefined {
    return this.planetUtils.getPlanetById(planetId);
  }

  public bulkGetPlanets(
    toLoadPlanets: LocationId[],
    onProgressPlanet?: (fractionCompleted: number) => void,
  ): Map<LocationId, Planet> {
    const planetIds = toLoadPlanets;
    const nPlanetIds: number = planetIds.length;

    const planets: Map<LocationId, Planet> = new Map();

    for (let i = 0; i < nPlanetIds; i += 1) {
      const planetId = planetIds[i];
      const planet = this.getPlanetById(planetId);
      if (planet) {
        planets.set(planet.locationId, planet);
      }
      onProgressPlanet && onProgressPlanet((i + 1) / nPlanetIds);
    }
    return planets;
  }

  // public async getEntryFee(): Promise<EthersBN> {
  //   const res = await this.makeCall<EthersBN>(this.contract.getEntryFee);
  //   return res;
  // }

  /**
   * If this player has a claimed planet, their score is the distance between the claimed planet and
   * the center. If this player does not have a claimed planet, then the score is undefined.
   */
  // async getScoreV3(
  //   address: EthAddress | undefined,
  // ): Promise<number | undefined> {
  //   if (address === undefined) {
  //     return undefined;
  //   }

  //   const score = await this.makeCall<EthersBN>(this.contract.getScore, [
  //     address,
  //   ]);

  //   if (
  //     score.eq(
  //       EthersBN.from(
  //         "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  //       ),
  //     )
  //   ) {
  //     return undefined;
  //   }
  //   return score.toNumber();
  // }
  // timestamp since epoch (in seconds)
  // public async getTokenMintEndTimestamp(): Promise<number> {
  //   const timestamp = (
  //     await this.makeCall<EthersBN>(this.contract.TOKEN_MINT_END_TIMESTAMP)
  //   ).toNumber();
  //   return timestamp;
  // }
  //
  // public async getIsHalfPrice(): Promise<boolean> {
  //   return this.makeCall(this.contract.halfPrice);
  // }

  // public async getClaimedCoordsByIdIfExists(
  //   planetId: LocationId,
  // ): Promise<ClaimedCoords | undefined> {
  //   const decStrId = locationIdToDecStr(planetId);
  //   const rawClaimedCoords = await this.makeCall(this.contract.claimedCoords, [
  //     decStrId,
  //   ]);
  //   const ret = decodeClaimedCoords(rawClaimedCoords);
  //   if (ret.hash === EMPTY_LOCATION_ID) {
  //     return undefined;
  //   }
  //   return ret;
  // }

  // public async getClaimedPlanetsCoords(
  //   startingAt: number,
  //   onProgressIds?: (fractionCompleted: number) => void,
  //   onProgressCoords?: (fractionCompleted: number) => void,
  // ): Promise<ClaimedCoords[]> {
  //   const nClaimedPlanets: number = (
  //     await this.makeCall<EthersBN>(this.contract.getNClaimedPlanets)
  //   ).toNumber();

  //   const rawClaimedPlanetIds = await aggregateBulkGetter<EthersBN>(
  //     nClaimedPlanets - startingAt,
  //     500,
  //     async (start, end) =>
  //       await this.makeCall(this.contract.bulkGetClaimedPlanetIds, [
  //         start + startingAt,
  //         end + startingAt,
  //       ]),
  //     onProgressIds,
  //   );

  //   const rawClaimedCoords = await aggregateBulkGetter(
  //     rawClaimedPlanetIds.length,
  //     500,
  //     async (start, end) =>
  //       await this.makeCall(this.contract.bulkGetClaimedCoordsByIds, [
  //         rawClaimedPlanetIds.slice(start, end),
  //       ]),
  //     onProgressCoords,
  //   );

  //   return rawClaimedCoords.map(decodeClaimedCoords);
  // }

  // public async getBurnedCoordsByIdIfExists(
  //   planetId: LocationId,
  // ): Promise<BurnedCoords | undefined> {
  //   const decStrId = locationIdToDecStr(planetId);
  //   const rawBurnedCoords = await this.makeCall(this.contract.burnedCoords, [
  //     decStrId,
  //   ]);
  //   const ret = decodeBurnedCoords(rawBurnedCoords);
  //   if (ret.hash === EMPTY_LOCATION_ID) {
  //     return undefined;
  //   }
  //   return ret;
  // }

  // public async getBurnedPlanetsCoords(
  //   startingAt: number,
  //   onProgressIds?: (fractionCompleted: number) => void,
  //   onProgressCoords?: (fractionCompleted: number) => void,
  // ): Promise<BurnedCoords[]> {
  //   const nBurnedPlanets: number = (
  //     await this.makeCall<EthersBN>(this.contract.getNBurnedPlanets)
  //   ).toNumber();

  //   const rawBurnedPlanetIds = await aggregateBulkGetter<EthersBN>(
  //     nBurnedPlanets - startingAt,
  //     500,
  //     async (start, end) =>
  //       await this.makeCall(this.contract.bulkGetBurnedPlanetIds, [
  //         start + startingAt,
  //         end + startingAt,
  //       ]),
  //     onProgressIds,
  //   );

  //   const rawBurnedCoords = await aggregateBulkGetter(
  //     rawBurnedPlanetIds.length,
  //     500,
  //     async (start, end) =>
  //       await this.makeCall(this.contract.bulkGetBurnedCoordsByIds, [
  //         rawBurnedPlanetIds.slice(start, end),
  //       ]),
  //     onProgressCoords,
  //   );

  //   return rawBurnedCoords.map(decodeBurnedCoords);
  // }

  // public async getKardashevCoordsByIdIfExists(
  //   planetId: LocationId,
  // ): Promise<KardashevCoords | undefined> {
  //   const decStrId = locationIdToDecStr(planetId);
  //   const rawKardashevCoords = await this.makeCall(
  //     this.contract.kardashevCoords,
  //     [decStrId],
  //   );
  //   const ret = decodeKardashevCoords(rawKardashevCoords);

  //   if (ret.hash === EMPTY_LOCATION_ID) {
  //     return undefined;
  //   }
  //   return ret;
  // }

  // public async getKardashevPlanetsCoords(
  //   startingAt: number,
  //   onProgressIds?: (fractionCompleted: number) => void,
  //   onProgressCoords?: (fractionCompleted: number) => void,
  // ): Promise<KardashevCoords[]> {
  //   const nBurnedPlanets: number = (
  //     await this.makeCall<EthersBN>(this.contract.getNKardashevPlanets)
  //   ).toNumber();

  //   const rawKardashevPlanetIds = await aggregateBulkGetter<EthersBN>(
  //     nBurnedPlanets - startingAt,
  //     500,
  //     async (start, end) =>
  //       await this.makeCall(this.contract.bulkGetKardashevPlanetIds, [
  //         start + startingAt,
  //         end + startingAt,
  //       ]),
  //     onProgressIds,
  //   );

  //   const rawKardashevCoords = await aggregateBulkGetter(
  //     rawKardashevPlanetIds.length,
  //     500,
  //     async (start, end) =>
  //       await this.makeCall(this.contract.bulkGetKardashevCoordsByIds, [
  //         rawKardashevPlanetIds.slice(start, end),
  //       ]),
  //     onProgressCoords,
  //   );

  //   return rawKardashevCoords.map(decodeKardashevCoords);
  // }

  // public async getArtifactById(
  //   artifactId: ArtifactId,
  // ): Promise<Artifact | undefined> {
  //   const exists = await this.makeCall<boolean>(
  //     this.contract.doesArtifactExist,
  //     [artifactIdToDecStr(artifactId)],
  //   );
  //   if (!exists) {
  //     return undefined;
  //   }
  //   const rawArtifact = await this.makeCall(this.contract.getArtifactById, [
  //     artifactIdToDecStr(artifactId),
  //   ]);

  //   const artifact = decodeArtifact(rawArtifact);
  //   artifact.transactions = new TxCollection();
  //   return artifact;
  // }

  // public async bulkGetArtifactsOnPlanets(
  //   locationIds: LocationId[],
  //   onProgress?: (fractionCompleted: number) => void,
  // ): Promise<Artifact[][]> {
  //   const rawArtifacts = await aggregateBulkGetter(
  //     locationIds.length,
  //     200,
  //     async (start, end) =>
  //       await this.makeCall(this.contract.bulkGetPlanetArtifacts, [
  //         locationIds.slice(start, end).map(locationIdToDecStr),
  //       ]),
  //     onProgress,
  //   );

  //   return rawArtifacts.map((rawArtifactArray) => {
  //     return rawArtifactArray.map(decodeArtifact);
  //   });
  // }

  // public async bulkGetArtifacts(
  //   artifactIds: ArtifactId[],
  //   onProgress?: (fractionCompleted: number) => void,
  // ): Promise<Artifact[]> {
  //   const rawArtifacts = await aggregateBulkGetter(
  //     artifactIds.length,
  //     200,
  //     async (start, end) =>
  //       await this.makeCall(this.contract.bulkGetArtifactsByIds, [
  //         artifactIds.slice(start, end).map(artifactIdToDecStr),
  //       ]),
  //     onProgress,
  //   );

  //   const ret: Artifact[] = rawArtifacts.map(decodeArtifact);
  //   ret.forEach((a) => (a.transactions = new TxCollection()));

  //   return ret;
  // }

  // public async getPlayerArtifacts(
  //   playerId?: EthAddress,
  //   onProgress?: (percent: number) => void,
  // ): Promise<Artifact[]> {
  //   if (playerId === undefined) {
  //     return [];
  //   }

  //   const mySpacespaceIds = (
  //     await this.makeCall(this.contract.getPlayerArtifactIds, [playerId])
  //   ).map(artifactIdFromEthersBN);
  //   return this.bulkGetArtifacts(mySpacespaceIds, onProgress);
  // }

  // public async getPlayerSpaceships(
  //   playerId?: EthAddress,
  //   onProgress?: (percent: number) => void,
  // ): Promise<Artifact[]> {
  //   if (playerId === undefined) {
  //     return [];
  //   }

  //   const myArtifactIds = (
  //     await this.makeCall<EthersBN[]>(this.contract.getMySpaceshipIds, [
  //       playerId,
  //     ])
  //   ).map(artifactIdFromEthersBN);
  //   return this.bulkGetArtifacts(myArtifactIds, onProgress);
  // }

  // public async getNTargetPlanetArrivalIds(
  //   planetId: LocationId,
  // ): Promise<number> {
  //   const decStrId = locationIdToDecStr(planetId);
  //   const result: number = (
  //     await this.makeCall<EthersBN>(this.contract.getNTargetPlanetArrivalIds, [
  //       decStrId,
  //     ])
  //   ).toNumber();
  //   return result;
  // }

  // public async getTargetPlanetArrivalIdsRangeWithTimestamp(
  //   planetId: LocationId,
  //   timestamp: number,
  // ): Promise<number[]> {
  //   const decStrId = locationIdToDecStr(planetId);

  //   const result: number[] = (
  //     await this.makeCall<EthersBN[]>(
  //       this.contract.getTargetPlanetArrivalIdsRangeWithTimestamp,
  //       [decStrId, timestamp],
  //     )
  //   ).map((value) => value.toNumber());
  //   return result;
  // }

  // public async getTargetPlanetArrivalIdsWithTimestamp(
  //   planetId: LocationId,
  //   timestamp: number,
  // ): Promise<number[]> {
  //   const decStrId = locationIdToDecStr(planetId);

  //   const result: number[] = (
  //     await this.makeCall<EthersBN[]>(
  //       this.contract.getTargetPlanetArrivalIdsWithTimestamp,
  //       [decStrId, timestamp],
  //     )
  //   ).map((value) => value.toNumber());

  //   return result;
  // }

  // public async getTargetPlanetAllArrivals(
  //   planetId: LocationId,
  //   timestamp: number,
  //   onProgress?: (fractionCompleted: number) => void,
  // ): Promise<QueuedArrival[]> {
  //   const arrivalIds = await this.getTargetPlanetArrivalIdsWithTimestamp(
  //     planetId,
  //     timestamp,
  //   );

  //   const arrivalsUnflattened = await aggregateBulkGetter(
  //     arrivalIds.length,
  //     200,
  //     async (start, end) => {
  //       return (
  //         await this.makeCall(this.contract.bulkGetVoyagesByIds, [
  //           arrivalIds.slice(start, end),
  //         ])
  //       ).map(decodeArrival);
  //     },
  //     onProgress,
  //   );

  //   return _.flatten(arrivalsUnflattened);
  // }

  public getAddress() {
    return this.ethConnection.getAddress();
  }
}

export async function makeContractsAPI({
  connection,
  contractAddress,
  components,
}: ContractsApiConfig): Promise<ContractsAPI> {
  await connection.loadContract(contractAddress, loadDiamondContract);

  return new ContractsAPI({ connection, contractAddress, components });
}
