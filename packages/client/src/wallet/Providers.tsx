// import { useEffect } from "react";
// import { useStore } from "@hooks/useStore";
import "@rainbow-me/rainbowkit/styles.css";

import { getNetworkConfig } from "@mud/getNetworkConfig";
// import { useNetworkLayer } from "./useNetworkLayer";
import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { structuralSharing } from "@wagmi/core/query";
import { useMemo } from "react";
import { type Chain, mainnet } from "viem/chains";
import { http, WagmiProvider } from "wagmi";

import { ExternalWalletProvider } from "./ExternalWalletProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      structuralSharing,
    },
  },
});

export type Props = {
  children: React.ReactNode;
};

export function Providers({ children }: Props) {
  const networkConfig = useMemo(() => getNetworkConfig(), []);
  const wagmiConfig = useMemo(
    () =>
      getDefaultConfig({
        appName: "DF-MUD",
        projectId: "4cb4d26de6508ef627675e916a2db64f",
        // downcast Mud chain to Viem Chain type
        chains: [networkConfig.chain as Chain],
        transports: {
          [networkConfig.chain.id]: http(),
        },
      }),
    [networkConfig],
  );

  //   const networkLayer = useNetworkLayer(networkConfig);
  //   useEffect(() => {
  //     if (networkLayer) {
  //       useStore.setState({ networkLayer });
  //     }
  //   }, [networkLayer]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()} initialChain={mainnet}>
          <ExternalWalletProvider networkConfig={networkConfig}>
            {children}
          </ExternalWalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
