/*
 * Network specific configuration for the client.
 * By default connect to the anvil test network.
 *
 */

/*
 * By default the template just creates a temporary wallet
 * (called a burner wallet).
 */
// import { getBurnerPrivateKey } from "@latticexyz/common";

/*
 * Import the addresses of the World, possibly on multiple chains,
 * from packages/contracts/worlds.json. When the contracts package
 * deploys a new `World`, it updates this file.
 */
// import worlds from "contracts/worlds.json";

/*
 * The supported chains.
 * By default, there are only two chains here:
 */
// import { Entity } from "@latticexyz/recs";
import { addAccount } from "@backend/Network/AccountManager";
import worldsJson from "contracts/worlds.json";
import { Wallet } from "ethers";

import { supportedChains } from "./supportedChains";

export type NetworkConfig = Awaited<ReturnType<typeof getNetworkConfig>>;

export const LIVE_WORLDS = worldsJson as Partial<
  Record<string, { address: string; blockNumber?: number }>
>;

export const getWorldFromChainId = (chainId: number) => {
  return LIVE_WORLDS[chainId.toString()];
};

export const getChain = (chainId: number) => {
  const chainIndex = supportedChains.findIndex((c) => c.id === chainId);
  const chain = supportedChains[chainIndex];

  if (!chain) {
    throw new Error(`Chain ${chainId} not supported`);
  }

  return chain;
};

export const getBurnerWallet = () => {
  const params = new URLSearchParams(window.location.search);

  // const manualPrivateKey = params.get("privateKey");
  // if (manualPrivateKey) {
  //   return new Wallet(manualPrivateKey).privateKey;
  // }

  const useAnvilAdminKey = import.meta.env.DEV && params.has("asAdmin");
  if (useAnvilAdminKey) {
    // default anvil admin key
    return "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  }

  const storageKey = "mud:burnerWallet";

  const privateKey = localStorage.getItem(storageKey);
  if (privateKey) {
    return privateKey;
  }

  const burnerWallet = Wallet.createRandom();
  localStorage.setItem(storageKey, burnerWallet.privateKey);
  addAccount(burnerWallet.privateKey);
  return burnerWallet.privateKey;
};

export function getNetworkConfig() {
  const params = new URLSearchParams(window.location.search);

  /*
   * The chain ID is the first item available from this list:
   * 1. chainId query parameter
   * 2. chainid query parameter
   * 3. The VITE_CHAIN_ID environment variable set when the
   *    vite dev server was started or client was built
   * 4. The default, 31337 (anvil)
   */

  const chainId = Number(
    params.get("chainId") || import.meta.env.VITE_CHAIN_ID || 31337,
  );

  /*
   * Find the chain (unless it isn't in the list of supported chains).
   */
  const chain = getChain(chainId);
  if (!chain) {
    throw new Error(`Chain ${chainId} not found`);
  }

  /*
   * Get the address of the World. If you want to use a
   * different address than the one in worlds.json,
   * provide it as worldAddress in the query string.
   */
  const world = getWorldFromChainId(chain.id);
  const worldAddress = params.get("worldAddress") || world?.address;
  if (!worldAddress) {
    throw new Error(
      `No world address found for chain ${chainId}. Did you run \`mud deploy\`?`,
    );
  }

  /*
   * MUD clients use events to synchronize the database, meaning
   * they need to look as far back as when the World was started.
   * The block number for the World start can be specified either
   * on the URL (as initialBlockNumber) or in the worlds.json
   * file. If neither has it, it starts at the first block, zero.
   */
  const initialBlockNumber = params.has("initialBlockNumber")
    ? Number(params.get("initialBlockNumber"))
    : (world?.blockNumber ?? -1); // -1 will attempt to find the block number from RPC

  const useBurner =
    (import.meta.env.DEV && !params.has("useExternalWallet")) ||
    params.has("useBurner");
  const burnerWalletPrivateKey = params.has("anon")
    ? Wallet.createRandom().privateKey
    : getBurnerWallet();

  return {
    clock: {
      period: 1000,
      initialTime: 0,
      syncInterval: 2000,
    },
    provider: {
      chainId,
      jsonRpcUrl: params.get("rpc") ?? chain.rpcUrls.default.http[0],
      wsRpcUrl: params.get("wsRpc") ?? chain.rpcUrls.default.webSocket?.[0],
    },
    privateKey: burnerWalletPrivateKey,
    useBurner,
    chainId,
    faucetServiceUrl: params.get("faucet") ?? chain.faucetUrl,
    worldAddress,
    initialBlockNumber,
    disableCache: import.meta.env.PROD,
    chain,
    indexerUrl: "http://localhost:3001", //params.get("indexerUrl") ?? chain.indexerUrl,
  };
}
