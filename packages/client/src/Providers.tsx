import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";

import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider } from "wagmi";

import { TooltipProvider } from "./components/tooltip";
import { getNetworkConfig } from "./mud/getNetworkConfig";

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
    chains: [networkConfig.chain],
    transports: {
      [networkConfig.chain.id]: networkConfig.chain.transports, // You can update this as per your logic
    },
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
          {/* <AccountKitProvider
            config={{
              chain: networkConfig.chain,
              worldAddress: networkConfig.worldAddress,
              gasTankAddress: (worlds as any)[networkConfig.chainId].address,
              appInfo: {
                name: "Get Shit Done",
              },
            }}
          > */}
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider> {/* </AccountKitProvider> */}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
