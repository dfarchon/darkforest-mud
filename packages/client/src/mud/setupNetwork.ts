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
import { observer } from "@latticexyz/explorer/observer";
import { encodeEntity, syncToRecs } from "@latticexyz/store-sync/recs";
// import { syncToZustand } from "@latticexyz/store-sync/zustand";
import {
  loadComponentsFromIndexedDB,
  loadStateInfoFromIndexedDB,
} from "@mud/IndexerDB";
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
  type ClientConfig,
  createPublicClient,
  createWalletClient,
  fallback,
  getContract,
  type Hex,
  http,
  webSocket,
} from "viem";

import { getNetworkConfig } from "./getNetworkConfig";
import { world } from "./world";
export type SetupNetworkResult = Awaited<ReturnType<typeof setupNetwork>>;

function findDifferences(obj1, obj2) {
  const differences = {};

  for (const key in obj1) {
    if (obj1[key] !== obj2[key]) {
      if (typeof obj1[key] === "object" && typeof obj2[key] === "object") {
        const nestedDiff = findDifferences(obj1[key], obj2[key]);
        if (Object.keys(nestedDiff).length > 0) {
          differences[key] = nestedDiff;
        }
      } else {
        differences[key] = { old: obj1[key], new: obj2[key] };
      }
    }
  }

  for (const key in obj2) {
    if (!(key in obj1)) {
      differences[key] = { old: undefined, new: obj2[key] };
    }
  }

  return differences;
}

export async function setupNetwork() {
  const networkConfig = getNetworkConfig();

  //PUNK
  console.log("show indexer url");
  console.log(networkConfig.indexerUrl);

  const waitForStateChange = Promise.withResolvers<WaitForStateChange>();
  /*
   * Create a viem public (read only) client
   * (https://viem.sh/docs/clients/public.html)
   */
  const clientOptions = {
    chain: networkConfig.chain,
    transport: transportObserver(fallback([webSocket(), http()])),
    pollingInterval: 1000,
  } as const satisfies ClientConfig;

  const publicClient = createPublicClient(clientOptions);

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
  const savedComponents = await loadComponentsFromIndexedDB();

  const savedState = await loadStateInfoFromIndexedDB();
  // Use a fallback value if `savedState` is undefined
  const startBlock = savedState?.snapshotStartBlock
    ? BigInt(savedState.snapshotStartBlock)
    : BigInt(-1);

  const { components, latestBlock$, storedBlockLogs$, waitForTransaction } =
    await syncToRecs({
      world,
      config: mudConfig,
      address: networkConfig.worldAddress as Hex,
      publicClient,
      indexerUrl: networkConfig.indexerUrl,
      startBlock: startBlock,
    });
  // todo de-sanitized

  // const savedArtifacts = savedComponents["Artifact"];
  // const componentsArtifacts = components["Artifact"];

  // const same =
  //   savedComponents["Artifact"].metadata.valueSchema ==
  //   components["Artifact"].metadata.valueSchema;

  // debugger;
  // const {
  //   tables,
  //   useStore,
  //   latestBlock$: latestBlockZu$,
  //   storedBlockLogs$: storedBlockLogsZu$,
  //   waitForTransaction: waitForTransactionZu,
  // } = await syncToZustand({
  //   config: mudConfig,
  //   address: networkConfig.worldAddress as Hex,
  //   publicClient,
  //   startBlock: BigInt(networkConfig.initialBlockNumber),
  // });

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
    .extend(writeObserver({ onWrite: (write) => write$.next(write) }))
    .extend(observer({ waitForTransaction }));

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
      { address: burnerWalletClient.account.address },
    ),
    publicClient,
    walletClient: burnerWalletClient,
    latestBlock$,
    storedBlockLogs$,
    waitForTransaction,
    worldContract,
    write$: write$.asObservable().pipe(share()),
    // tables,
    // useStore,
    // latestBlockZu$,
    // storedBlockLogsZu$,
    // waitForTransactionZu,
  };
}
