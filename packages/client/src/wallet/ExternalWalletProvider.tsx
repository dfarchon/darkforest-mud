import { type ContractType, useStore } from "@hooks/useStore";
import { transportObserver } from "@latticexyz/common";
import { transactionQueue } from "@latticexyz/common/actions";
import type { NetworkConfig } from "@mud/getNetworkConfig";
import IWorldAbi from "contracts/out/IWorld.sol/IWorld.abi.json";
import { useEffect } from "react";
import {
  type Chain,
  createPublicClient,
  fallback,
  getContract,
  type Hex,
  http,
  type PublicClientConfig,
  type Transport,
  webSocket,
} from "viem";
import { useWalletClient } from "wagmi";

export type Props = {
  networkConfig: NetworkConfig;
  children: React.ReactNode;
};

export function ExternalWalletProvider({ networkConfig, children }: Props) {
  const { data: externalWalletClient } = useWalletClient();
  useEffect(() => {
    if (networkConfig.useBurner) {
      return;
    }

    if (!externalWalletClient) {
      useStore.setState({
        externalWalletClient: null,
        externalWorldContract: null,
      });
      return;
    }

    type ExternalWalletClient = typeof externalWalletClient;
    type ExtendFnType = Parameters<typeof externalWalletClient.extend>[0];
    const customExternalWalletClient = externalWalletClient.extend(
      transactionQueue() as ExtendFnType,
    ) as unknown as ExternalWalletClient;

    const fallbackTransport = fallback([webSocket(), http()]);
    const clientOptions: PublicClientConfig = {
      chain: networkConfig.chain as Chain,
      transport: transportObserver(
        // NOTE: Are we sure this is working correctly?, since underlying type of fallbackResponse is Transport[]
        // while transportObserver wants Transport
        fallbackTransport as Parameters<typeof transportObserver>[0],
      ) as Transport,
      pollingInterval: 250,
    };

    // TODO: centralize this somewhere
    const publicClient = createPublicClient(clientOptions);

    const externalWorldContract = getContract({
      address: networkConfig.worldAddress as Hex,
      abi: IWorldAbi,
      client: {
        public: publicClient,
        wallet: customExternalWalletClient,
      },
    });

    useStore.setState({
      externalWalletClient: customExternalWalletClient,
      externalWorldContract: externalWorldContract as ContractType,
    });
  }, [
    externalWalletClient,
    networkConfig.chain,
    networkConfig.useBurner,
    networkConfig.worldAddress,
  ]);

  return children;
}
