import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

import WalletHeader from ".././components/walletHeader";

export const WelcomePage: React.FC = () => {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  // Redirect to /game if connected
  useEffect(() => {
    if (isConnected) {
      navigate("/game");
    }
  }, [isConnected, navigate]);

  return (
    <div className="flex h-screen">
      <div className="m-auto">
        {!isConnected && (
          <>
            <h1 className="mb-6 text-2xl font-bold">Connect your wallet to play MUD version of Dark Forest</h1>
          </>
        )}
      </div>
    </div>
  );
};
