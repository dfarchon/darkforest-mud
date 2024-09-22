import { getNetworkConfig } from "@mud/getNetworkConfig";
import { useMUD } from "@mud/MUDContext";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import React, { useState } from "react";
import type { Chain } from "viem";
import { useAccount, useDisconnect, useWalletClient } from "wagmi";

import { formatAddress } from "./utils";
import { WalletPane } from "./WalletPane";

export const WalletButton: React.FC = () => {
  const { isConnected, address, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const [showSessionWalletManager, setShowSessionWalletManager] =
    useState(false);

  const { data: externalWalletClient } = useWalletClient();

  const {
    network: { walletClient: burnerWalletClient },
  } = useMUD();

  const addNetwork = () => {
    const networkConfig = getNetworkConfig();
    // downcast from Mud chain to Viem chain type
    const chain = networkConfig.chain as Chain;
    (chain.blockExplorers = {
      default: { name: "Etherscan", url: "https://etherscan.io" },
    }),
      externalWalletClient?.addChain({ chain });
  };

  return (
    <div>
      {!isConnected && <ConnectButton />}
      {/* {!isConnected && <CustomConnectButton />} */}

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
          {/* <span className="rounded-lg bg-gray-800 p-2 text-white shadow-md focus:outline-none">
            {chain?.name}
          </span> */}
          <span className="rounded-lg bg-gray-800 p-2 text-white shadow-md focus:outline-none">
            {formatAddress(address!)}
          </span>
          <button
            className="rounded-lg bg-gray-800 p-2 text-white shadow-md focus:outline-none"
            onClick={() => setShowSessionWalletManager(true)}
          >
            🌸
          </button>
          <button
            className="rounded-lg bg-gray-800 p-2 text-white shadow-md focus:outline-none"
            onClick={() => disconnect()}
          >
            Log Off
          </button>
          {showSessionWalletManager && (
            <WalletPane onClose={() => setShowSessionWalletManager(false)} />
          )}
        </div>
      )}
    </div>
  );
};

export default WalletButton;
