import { transportObserver } from "@latticexyz/common";
import { MUDChain } from "@latticexyz/common/chains";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { ClientConfig } from "viem";
import { createConfig, fallback, http, webSocket } from "wagmi";
import { getPublicClient } from "wagmi/actions";

import { getNetworkConfig } from "./getNetworkConfig";
import { supportedChains } from "./supportedChains";

export const networkConfig = await getNetworkConfig();

export const wagmiConfig = createConfig({
  chains: supportedChains as [MUDChain, ...MUDChain[]],
  pollingInterval: 1_000,

  // TODO: how to properly set up a transport config for all chains supported as bridge sources?
  transports: Object.fromEntries(
    supportedChains.map((chain) => {
      if (chain.rpcUrls.default.webSocket) return [chain.id, transportObserver(fallback([http(), webSocket()]))];
      return [chain.id, transportObserver(fallback([http()]))];
    }),
  ),
});

export const clientOptions = {
  chain: networkConfig.chain,
  transport: transportObserver(fallback([webSocket(), http()], { retryCount: 0 })),
  pollingInterval: 250,
} as const satisfies ClientConfig;

// projectId obtain from
export const wagmiConfig2 = await getDefaultConfig({
  appName: "DF-MUD",
  projectId: "4cb4d26de6508ef627675e916a2db64f",
  pollingInterval: 250,
  chains: [networkConfig.chain],
  transports: Object.fromEntries(
    supportedChains.map((chain) => {
      if (chain.rpcUrls.default.webSocket) return [chain.id, transportObserver(fallback([http(), webSocket()]))];
      return [chain.id, transportObserver(fallback([http()]))];
    }),
  ),
});

// TODO: figure out how to get public client without !
export const publicClient = getPublicClient(wagmiConfig, { chainId: networkConfig.chainId })!;
