/*
 * The MUD client code is built on top of viem
 * (https://viem.sh/docs/getting-started.html).
 * This line imports the functions we need from it.
 */

import {
  type ContractWrite,
  createBurnerAccount,
  transportObserver,
} from "@latticexyz/common";
import { transactionQueue, writeObserver } from "@latticexyz/common/actions";
import {
  observer,
  type WaitForTransaction,
} from "@latticexyz/explorer/observer";
import { encodeEntity, syncToRecs } from "@latticexyz/store-sync/recs";
import { syncToZustand } from "@latticexyz/store-sync/zustand";
/*
 * Import our MUD config, which includes strong types for
 * our tables and other config options. We use this to generate
 * things like RECS components and get back strong types for them.
 *
 * See https://mud.dev/templates/typescript/contracts#mudconfigts
 * for the source of this information.
 */
import mudConfig from "contracts/mud.config";
import IWorldAbi from "contracts/out/IWorld.sol/IWorld.abi.json";
import { share, Subject } from "rxjs";
import {
  type Chain,
  createPublicClient,
  createWalletClient,
  fallback,
  getContract,
  type Hex,
  http,
  type PublicClientConfig,
  type Transport,
  webSocket,
} from "viem";

import { getNetworkConfig } from "./getNetworkConfig";
import { world } from "./world";

export type SetupNetworkResult = Awaited<ReturnType<typeof setupNetwork>>;

export async function setupNetwork() {
  const networkConfig = getNetworkConfig();
  const waitForStateChange = Promise.withResolvers<WaitForTransaction>();
  const fallbackTransport = fallback([webSocket(), http()]);

  /*
   * Create a viem public (read only) client
   * (https://viem.sh/docs/clients/public.html)
   */
  const clientOptions: PublicClientConfig = {
    chain: networkConfig.chain as Chain,
    transport: transportObserver(
      // NOTE: Are we sure this is working correctly?, since underlying type of fallbackResponse is Transport[]
      // while transportObserver wants Transport
      fallbackTransport as Parameters<typeof transportObserver>[0],
    ) as Transport,
    pollingInterval: 1000,
  };

  const publicClient = createPublicClient<Transport, Chain>(clientOptions);

  /*
   * Create an observable for contract writes that we can
   * pass into MUD dev tools for transaction observability.
   */
  const write$ = new Subject<ContractWrite>();
  /*
   * Sync on-chain state into RECS and keeps our client in sync.
   * Uses the MUD indexer if available, otherwise falls back
   * to the viem publicClient to make RPC calls to fetch MUD
   * events from the chain.
   */
  const { components, latestBlock$, storedBlockLogs$, waitForTransaction } =
    await syncToRecs({
      world,
      config: mudConfig,
      address: networkConfig.worldAddress as Hex,
      // NOTE: We cast to type of publicClient in syncToRecs options need to investigate more here on how to get correct types
      publicClient: publicClient as Parameters<
        typeof syncToRecs
      >[0]["publicClient"],
      startBlock: BigInt(networkConfig.initialBlockNumber),
    });

  const {
    tables,
    useStore,
    latestBlock$: latestBlockZu$,
    storedBlockLogs$: storedBlockLogsZu$,
    waitForTransaction: waitForTransactionZu,
  } = await syncToZustand({
    config: mudConfig,
    address: networkConfig.worldAddress as Hex,
    // NOTE: We cast to type of publicClient in syncToZustand options need to investigate more here on how to get correct types
    publicClient: publicClient as Parameters<
      typeof syncToZustand
    >[0]["publicClient"],
    startBlock: BigInt(networkConfig.initialBlockNumber),
  });

  /*
   * Create a temporary wallet and a viem client for it
   * (see https://viem.sh/docs/clients/wallet.html).
   */
  const burnerAccount = createBurnerAccount(networkConfig.privateKey as Hex);
  type BurnerWalletClient = ReturnType<typeof createWalletClient>;
  let burnerWalletClient: BurnerWalletClient = createWalletClient({
    ...clientOptions,
    // NOTE: We cast to account type  in createWalletClient options need to investigate more here on how to get correct types
    account: burnerAccount as Parameters<
      typeof createWalletClient
    >[0]["account"],
  });

  // TODO: Fix hacky mess to get types correct and remove never from burnerWalletClient
  type ExtendFnType = Parameters<typeof burnerWalletClient.extend>[0];
  burnerWalletClient = burnerWalletClient.extend(
    transactionQueue() as ExtendFnType,
  ) as unknown as BurnerWalletClient;
  burnerWalletClient = burnerWalletClient.extend(
    writeObserver({ onWrite: (write) => write$.next(write) }) as ExtendFnType,
  ) as unknown as BurnerWalletClient;
  burnerWalletClient = burnerWalletClient.extend(
    observer({ waitForTransaction }) as ExtendFnType,
  ) as unknown as BurnerWalletClient;

  /*
   * Create an object for communicating with the deployed World.
   */
  const worldContract = getContract({
    address: networkConfig.worldAddress as Hex,
    abi: IWorldAbi,
    client: { public: publicClient, wallet: burnerWalletClient },
  });

  waitForStateChange.resolve(waitForTransaction);
  return {
    world,
    components,
    playerEntity: encodeEntity(
      { address: "address" },
      { address: burnerWalletClient.account!.address },
    ),
    publicClient,
    walletClient: burnerWalletClient,
    latestBlock$,
    storedBlockLogs$,
    waitForTransaction,
    worldContract,
    write$: write$.asObservable().pipe(share()),
    tables,
    useStore,
    latestBlockZu$,
    storedBlockLogsZu$,
    waitForTransactionZu,
  };
}
