import React, { useState } from "react";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect } from "wagmi";

import { SessionWalletManager } from "../SessionWalletManager";
import { shortedAddress } from "./utils";

export const WalletHeader: React.FC = () => {
  const { isConnected, address, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const [showSessionWalletManager, setShowSessionWalletManager] = useState(false);
  return (
    <div className="fixed right-4 top-4 flex flex-col items-center space-y-2">
      {isConnected ? (
        <div className="flex items-center space-x-2">
          <span className="rounded-lg bg-gray-800 p-2 text-white shadow-md">{chain?.name}</span>
          <span className="rounded-lg bg-gray-800 p-2 text-white shadow-md">{shortedAddress(address!)}</span>
          <button
            onClick={() => setShowSessionWalletManager(true)}
            className="flex items-center rounded-lg bg-gray-800 p-2 text-white shadow-md hover:bg-gray-600"
          >
            🧿
          </button>
          <button
            onClick={() => disconnect()}
            className="rounded-lg bg-red-600 p-2 text-white shadow-md hover:bg-red-700"
          >
            Log Off
          </button>
          {showSessionWalletManager && <SessionWalletManager onClose={() => setShowSessionWalletManager(false)} />}
        </div>
      ) : (
        <ConnectButton />
      )}
    </div>
  );
};

export default WalletHeader;
