import { useStore } from "@hooks/useStore";
import { transportObserver } from "@latticexyz/common";
import { transactionQueue } from "@latticexyz/common/actions";
import type { NetworkConfig } from "@mud/getNetworkConfig";
import IWorldAbi from "contracts/out/IWorld.sol/IWorld.abi.json";
import { useEffect } from "react";
import type { ClientConfig, Hex } from "viem";
import {
  createPublicClient,
  fallback,
  getContract,
  http,
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

    const customExternalWalletClient =
      externalWalletClient.extend(transactionQueue());

    const clientOptions = {
      chain: networkConfig.chain,
      transport: transportObserver(fallback([webSocket(), http()])),
      pollingInterval: 250,
    } as const satisfies ClientConfig;

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
      externalWorldContract: externalWorldContract,
    });
  }, [
    externalWalletClient,
    networkConfig.chain,
    networkConfig.useBurner,
    networkConfig.worldAddress,
  ]);

  return children;
}
