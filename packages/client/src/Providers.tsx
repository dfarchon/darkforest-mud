import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";

import { transportObserver } from "@latticexyz/common";
import { MUDChain } from "@latticexyz/common/chains";

import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider, fallback, http, webSocket } from "wagmi";

import { ExternalWalletProvider } from "./ExternalWalletProvider";
import { TooltipProvider } from "./components/tooltip";
import WalletHeader from "./components/walletHeader";
import { getNetworkConfig } from "./mud/getNetworkConfig";
import { supportedChains } from "./mud/supportedChains";

export const queryClient = new QueryClient();

export type Props = {
  children: React.ReactNode;
};

export function Providers({ children }: Props) {
  const [networkConfig, setNetworkConfig] = useState<any>(null); // Local state for storing resolved network config

  useEffect(() => {
    const fetchNetworkConfig = async () => {
      try {
        const config = await getNetworkConfig();
        // Update chain.id to be equal to chainId
        config.chain.id = config.chainId;
        setNetworkConfig(config);
      } catch (error) {
        console.error("Error fetching network config:", error);
      }
    };

    fetchNetworkConfig(); // Call the async function to fetch the config
  }, []);

  if (!networkConfig) {
    return <div>Loading...</div>; // Show loading until network config is fetched
  }

  const wagmiConfig = getDefaultConfig({
    appName: "DF-MUD",
    projectId: "4cb4d26de6508ef627675e916a2db64f",
    chains: supportedChains as [MUDChain, ...MUDChain[]],
    pollingInterval: 250,
    transports: Object.fromEntries(
      supportedChains.map((chain) => {
        if (chain.rpcUrls.default.webSocket) return [chain.id, transportObserver(fallback([http(), webSocket()]))];
        return [chain.id, transportObserver(fallback([http()]))];
      }),
    ),
  });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#999996",
            accentColorForeground: "#000",
            borderRadius: "small",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          {/* <MUDAccountKitProvider
            config={{
              chain: networkConfig.chain,
              worldAddress: networkConfig.worldAddress,
              gasTankAddress: (worlds as any)[networkConfig.chainId].address,
              appInfo: {
                name: "DF on MUD",
              },
            }}
          > */}{" "}
          <ExternalWalletProvider networkConfig={networkConfig}>
            <TooltipProvider delayDuration={300}>
              {" "}
              <WalletHeader />
              {children}
            </TooltipProvider>
          </ExternalWalletProvider>
          {/* </MUDAccountKitProvider> */}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
