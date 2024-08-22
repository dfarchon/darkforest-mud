import React from "react";



import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect } from "wagmi";

import { shortenAddress } from "../shared";

const WalletHeader: React.FC = () => {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();


  return (
    <div className="fixed right-4 top-4 flex flex-col items-center space-y-2">
      {isConnected ? (
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-2">
            <span className="rounded-lg bg-gray-800 p-2 text-white shadow-md">{shortenAddress(address!)}</span>
            <button
              onClick={() => disconnect()}
              className="ml-2 rounded-lg bg-red-600 p-2 text-white shadow-md hover:bg-red-700"
            >
              Log Off
            </button>
          </div>
        </div>
      ) : (
        <ConnectButton />
      )}
    </div>
  );
};

export default WalletHeader;
