/*
 * The MUD client code is built on top of viem
 * (https://viem.sh/docs/getting-started.html).
 * This line imports the functions we need from it.
 */

import { ContractWrite, createBurnerAccount, transportObserver } from "@latticexyz/common";

import {
  createPublicClient,
  fallback,
  webSocket,
  http,
  createWalletClient,
  Hex,
  ClientConfig,
  getContract,
} from "viem";
import { encodeEntity, syncToRecs } from "@latticexyz/store-sync/recs";

import { getNetworkConfig } from "./getNetworkConfig";
import { world } from "./world";
import IWorldAbi from "contracts/out/IWorld.sol/IWorld.abi.json";


import { transactionQueue, writeObserver } from "@latticexyz/common/actions";
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
import { Subject, share } from "rxjs";
import {
  ClientConfig,
  Hex,
  createPublicClient,
  createWalletClient,
  fallback,
  getContract,
  http,
  webSocket,
} from "viem";

import { getNetworkConfig } from "./getNetworkConfig";
// import { SEASON_PASS_NAMESPACE } from "./shared";
import { world } from "./world";

export type SetupNetworkResult = Awaited<ReturnType<typeof setupNetwork>>;

export async function setupNetwork() {
  const networkConfig = getNetworkConfig();

  /*
   * Create a viem public (read only) client
   * (https://viem.sh/docs/clients/public.html)
   */
  const clientOptions = {
    chain: networkConfig.chain,
    transport: transportObserver(fallback([webSocket(), http()])),
    pollingInterval: 250,
  } as const satisfies ClientConfig;

  const publicClient = createPublicClient(clientOptions);

  const txReceiptClient = createPublicClient({
    ...clientOptions,
    transport: transportObserver(fallback([webSocket(), http()], { retryCount: 0 })),
    pollingInterval: 250,
  });

  // // defaulting to a namespace here for easy development, but we cannot use this namespace in production
  // let seasonPassNamespace = SEASON_PASS_NAMESPACE;
  // const indexerClient = networkConfig.indexerUrl ? createIndexerClient({ url: networkConfig.indexerUrl }) : undefined;
  // if (indexerClient) {
  //   let retriesRemaining = 3;
  //   while (retriesRemaining > 0) {
  //     try {
  //       const seasonPassNamespaceTable = resourceToHex({ type: "table", namespace: "", name: "SeasonPassNamesp" });
  //       const result = await indexerClient.getLogs({
  //         chainId: networkConfig.chain.id,
  //         address: networkConfig.worldAddress as Hex,
  //         filters: [{ tableId: seasonPassNamespaceTable }],
  //       });

  //       if (!("error" in result)) {
  //         const log = result.ok.logs.find((l) => l.args.tableId === seasonPassNamespaceTable);
  //         if (log) {
  //           const val = decodeValueArgs({ value: "bytes14" }, log.args as ValueArgs).value;
  //           seasonPassNamespace = hexToString(val, { size: 14 });
  //         }
  //       }
  //       break; // Exit loop if successful
  //     } catch (e) {
  //       console.error("Error fetching season pass namespace from indexer", e);
  //       retriesRemaining -= 1;
  //     }
  //   }
  // }
  // const filters = [...createSyncFilters(networkConfig.matchEntity), ...extraSyncFilters(seasonPassNamespace)];
  // const { components, latestBlock$, storedBlockLogs$ } = await syncToRecs({
  //   world,
  //   config: mudConfig,
  //   address: networkConfig.worldAddress as Hex,
  //   publicClient: txReceiptClient,
  //   indexerUrl: networkConfig.indexerUrl,
  //   startBlock: networkConfig.initialBlockNumber > 0n ? BigInt(networkConfig.initialBlockNumber) : undefined,
  //   filters,
  //   tables: extraTables(seasonPassNamespace),
  //   // making the block range very small here, as we've had problems with
  //   // large Sky Strife worlds overloading the RPC
  //   maxBlockRange: 100n,
  // });
  const { components, latestBlock$, storedBlockLogs$, waitForTransaction } = await syncToRecs({
    world,
    config: mudConfig,
    address: networkConfig.worldAddress as Hex,
    publicClient,
    startBlock: BigInt(networkConfig.initialBlockNumber),
  });

  // const ext = extraTables(seasonPassNamespace);
  // ext.ERC20Registry;
  // /*
  //  * Create an observable for contract writes that we can
  //  * pass into MUD dev tools for transaction observability.
  //  */

  // const clock = createClock(networkConfig.clock);
  // world.registerDisposer(() => clock.dispose());

  const write$ = new Subject<ContractWrite>();

  /*
   * Create a temporary wallet and a viem client for it
   * (see https://viem.sh/docs/clients/wallet.html).
   */
  const burnerAccount = createBurnerAccount(networkConfig.privateKey as Hex);
  const burnerWalletClient = createWalletClient({
    ...clientOptions,
    account: burnerAccount,
  })
    .extend(transactionQueue())
    .extend(writeObserver({ onWrite: (write) => write$.next(write) }));

  /*
   * Create an object for communicating with the deployed World.
   */
  const worldContract = getContract({
    address: networkConfig.worldAddress as Hex,
    abi: IWorldAbi,
    client: { public: publicClient, wallet: burnerWalletClient },
  });

  /*
   * Sync on-chain state into RECS and keeps our client in sync.
   * Uses the MUD indexer if available, otherwise falls back
   * to the viem publicClient to make RPC calls to fetch MUD
   * events from the chain.
   */


  const {
    tables,
    useStore,
    latestBlock$: latestBlockZu$,
    storedBlockLogs$: storedBlockLogsZu$,
    waitForTransaction: waitForTransactionZu,
  } = await syncToZustand({
    config: mudConfig,
    address: networkConfig.worldAddress as Hex,
    publicClient,
    startBlock: BigInt(networkConfig.initialBlockNumber),
  });

//   const { components, latestBlock$, storedBlockLogs$, waitForTransaction } =
//     await syncToRecs({
//       world,
//       config: mudConfig,
//       address: networkConfig.worldAddress as Hex,
//       publicClient,
//       startBlock: BigInt(networkConfig.initialBlockNumber),
//     });


  return {
    tables,
    useStore,
    world,
    components,
    playerEntity: encodeEntity(
      { address: "address" },
      { address: burnerWalletClient.account.address },
    ),
    publicClient,
    txReceiptClient,
    walletClient: burnerWalletClient,
    latestBlock$,
    storedBlockLogs$,
    waitForTransaction,
    worldContract,
    write$: write$.asObservable().pipe(share()),
    latestBlockZu$,
    storedBlockLogsZu$,
    waitForTransactionZu,
  };
}
