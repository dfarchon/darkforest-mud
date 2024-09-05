// import { useEffect } from "react";
// import { useStore } from "@hooks/useStore";
import { useMemo } from "react";
// import { useNetworkLayer } from "./useNetworkLayer";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { getNetworkConfig } from "@mud/getNetworkConfig";
import { ExternalWalletProvider } from "./ExternalWalletProvider";
import "@rainbow-me/rainbowkit/styles.css";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { structuralSharing } from "@wagmi/core/query";

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
        chains: [networkConfig.chain],
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
        <RainbowKitProvider theme={darkTheme()}>
          <ExternalWalletProvider networkConfig={networkConfig}>
            {children}
          </ExternalWalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
