import { getNetworkConfig } from "@mud/getNetworkConfig";
import { useMUD } from "@mud/MUDContext";
import { useAccount, useDisconnect, useWalletClient } from "wagmi";

import { BluePillConnectButton } from "./BluePillConnectButton";
import { formatAddress } from "./utils";
// import { WalletPane } from "./WalletPane";

export const BluePillWalletButton: React.FC = () => {
  const { isConnected, address, chain } = useAccount();
  const { disconnect } = useDisconnect();

  const { data: externalWalletClient } = useWalletClient();

  const {
    network: { walletClient: burnerWalletClient },
  } = useMUD();

  const addNetwork = () => {
    const networkConfig = getNetworkConfig();
    const networkConfigChain = networkConfig.chain;

    networkConfigChain.blockExplorers = {
      default: {
        name: "Redstone Explorer",
        url: "https://explorer.redstone.xyz",
      },
    };
    externalWalletClient?.addChain({ chain: networkConfigChain });
  };

  return (
    <div>
      {!isConnected && <BluePillConnectButton />}

      {/* TODO: Need to investigate why externalWalletClient is incorrect. */}
      {isConnected && burnerWalletClient.chain?.id !== chain?.id && (
        <button
          className="rounded-lg bg-gray-800 p-2 text-white shadow-md"
          onClick={addNetwork}
        >
          add network
        </button>
      )}
      {isConnected && burnerWalletClient.chain?.id === chain?.id && (
        <div className="flex items-center space-x-2">
          <span className="rounded-lg bg-gray-800 p-2 text-white shadow-md focus:outline-none">
            {chain?.name}
          </span>
          <span className="rounded-lg bg-gray-800 p-2 text-white shadow-md focus:outline-none">
            {formatAddress(address!)}
          </span>

          <button
            className="rounded-lg bg-gray-800 p-2 text-white shadow-md focus:outline-none"
            onClick={() => disconnect()}
          >
            Log Off
          </button>
        </div>
      )}
    </div>
  );
};
