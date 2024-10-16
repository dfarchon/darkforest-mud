import { addressToHex } from "@df/serde";
import { Btn } from "@frontend/Components/Btn";
import { Spacer, Title } from "@frontend/Components/CoreUI";
import { Modal } from "@frontend/Components/Modal";
import { Green, Red } from "@frontend/Components/Text";
import { useBurnerBalance, useMainWalletBalance } from "@hooks/useBalance";
import { getComponentValue } from "@latticexyz/recs";
import { encodeEntity } from "@latticexyz/store-sync/recs";
import { getNetworkConfig } from "@mud/getNetworkConfig";
import { useMUD } from "@mud/MUDContext";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  LOW_BALANCE_THRESHOLD,
  RECOMMENDED_BALANCE,
  zeroAddress,
} from "@wallet/utils";
import { formatAddress } from "@wallet/utils";
import React, { useEffect, useState } from "react";
import { formatEther, type Hex, parseEther } from "viem";
import { useAccount, useDisconnect, useWalletClient } from "wagmi";

import { RegisterPlayerComponent } from "./RegisterPlayerComponent";

interface WalletComponentProps {
  showRegisterPlayer: boolean;
}

export const WalletComponent: React.FC<WalletComponentProps> = ({
  showRegisterPlayer = false,
}) => {
  const {
    network: { walletClient: burnerWalletClient, playerEntity },
    components: { Player },
  } = useMUD();

  const { isConnected, address, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();

  const [state, setState] = useState({
    burnerBalance: 0n,
    mainWalletBalance: 0n,
    transferAmount: Number(RECOMMENDED_BALANCE) / 1e18,
    txSuccessful: false,
    pkCopied: false,
    isPlayerRegistered: false,
    isDataLoaded: false, // New state to track if data has been loaded
  });

  const { value: burnerBalanceValue, refetch: refetchBurnerBalance } =
    useBurnerBalance();
  const { value: mainWalletBalanceValue, refetch: refetchMainWalletBalance } =
    useMainWalletBalance();

  useEffect(() => {
    const fetchBalances = async () => {
      await refetchBurnerBalance();
      await refetchMainWalletBalance();
      setState((prev) => ({ ...prev, isDataLoaded: true }));
    };

    fetchBalances();
    const intervalId = setInterval(fetchBalances, 2000);
    return () => clearInterval(intervalId);
  }, [refetchBurnerBalance, refetchMainWalletBalance]);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      burnerBalance: burnerBalanceValue || 0n,
      mainWalletBalance: mainWalletBalanceValue || 0n,
    }));
  }, [burnerBalanceValue, mainWalletBalanceValue]);

  useEffect(() => {
    const checkPlayerRegistration = async () => {
      if (playerEntity && walletClient?.account) {
        const mainAccount = walletClient.account.address;
        const playerKey = encodeEntity(Player.metadata.keySchema, {
          owner: addressToHex(mainAccount),
        });
        const rawPlayer = getComponentValue(Player, playerKey);
        setState((prev) => ({ ...prev, isPlayerRegistered: !!rawPlayer }));
      }
    };

    checkPlayerRegistration();
  }, [playerEntity, Player, walletClient]);

  const connectWallet = async () => {
    if (!burnerWalletClient.account) {
      const newPrivateKey = crypto.getRandomValues(new Uint8Array(32));
      localStorage.setItem(
        "mud:burnerWallet",
        Buffer.from(newPrivateKey).toString("hex"),
      );
      window.location.reload();
    }
  };

  const addNetwork = () => {
    const networkConfig = getNetworkConfig();
    const chain = networkConfig.chain;
    chain.blockExplorers = {
      default: { name: "Etherscan", url: "https://etherscan.io" },
    };
    walletClient?.addChain({ chain: chain });
  };

  const transferToBurner = async () => {
    if (!burnerWalletClient || !walletClient) {
      return;
    }
    const value = parseEther((state.transferAmount ?? 0).toString());
    try {
      const gasLimit = 21000;
      await walletClient.sendTransaction({
        to: burnerWalletClient.account?.address,
        value,
        gasLimit,
      });
      setState((prev) => ({ ...prev, txSuccessful: true }));
      setTimeout(
        () => setState((prev) => ({ ...prev, txSuccessful: false })),
        5000,
      );
    } catch (err) {
      console.error("Error sending transaction:", err);
    }
  };

  const drainBurner = async () => {
    if (!burnerWalletClient || !walletClient) {
      return;
    }
    const value = state.burnerBalance;
    try {
      await burnerWalletClient.sendTransaction({
        to: walletClient.account?.address,
        value,
      });
      setState((prev) => ({ ...prev, txSuccessful: true }));
      setTimeout(
        () => setState((prev) => ({ ...prev, txSuccessful: false })),
        5000,
      );
    } catch (err) {
      console.error("Error sending transaction:", err);
    }
  };

  const copyPrivateKey = () => {
    if (walletClient?.account?.address ?? zeroAddress) {
      navigator.clipboard
        .writeText(localStorage.getItem("mud:burnerWallet") as string)
        .then(() => {
          setState((prev) => ({ ...prev, pkCopied: true }));
          setTimeout(
            () => setState((prev) => ({ ...prev, pkCopied: false })),
            2000,
          );
        })
        .catch((err) => {
          console.error("Failed to copy PK:", err);
        });
    }
  };

  const renderWalletConnection = () => (
    <div>
      {!isConnected && <ConnectButton />}
      {isConnected && burnerWalletClient.chain.id !== chain?.id && (
        <Btn onClick={addNetwork}>Add Network</Btn>
      )}
      {isConnected && burnerWalletClient.chain.id === chain?.id && (
        <div className="flex items-center space-x-2">
          <span className="rounded-lg bg-gray-800 p-2 text-white shadow-md focus:outline-none">
            {formatAddress(address!)}
          </span>
          <Btn onClick={() => disconnect()}>Log Off</Btn>
        </div>
      )}
    </div>
  );

  const renderWalletStatus = () => (
    <div>
      <div>
        <span>Main Wallet: </span>
        <span>{(walletClient?.account?.address ?? zeroAddress) as Hex}</span>
        <span> Balance: {formatEther(state.mainWalletBalance)} ETH</span>
      </div>
      <div>
        <span>Game Wallet: </span>
        <span>
          {(burnerWalletClient.account?.address ?? zeroAddress) as Hex}
        </span>
        <span> Balance: {formatEther(state.burnerBalance)} ETH</span>
      </div>
    </div>
  );

  const renderTransferControls = () => (
    <div>
      <Btn
        onClick={transferToBurner}
        disabled={
          (state.transferAmount ?? 0) <= 0 ||
          state.mainWalletBalance <
            parseEther((state.transferAmount ?? 0).toString())
        }
      >
        Deposit {state.transferAmount} ETH
      </Btn>{" "}
      <input
        type="number"
        placeholder="Enter amount to transfer"
        value={state.transferAmount ?? "0"}
        onChange={(e) => {
          const value = parseFloat(e.target.value);
          if (value >= 0 && value <= 1) {
            setState((prev) => ({ ...prev, transferAmount: value }));
          }
        }}
        min="0"
        max="1"
        step="0.001"
        className="w-32 rounded border"
      />{" "}
      <Btn onClick={drainBurner} disabled={(burnerBalanceValue ?? 0) <= 0}>
        Withdraw All
      </Btn>
    </div>
  );

  const renderBurnerWalletControls = () => (
    <div>
      {/* {!burnerWalletClient.account && (
                <Btn onClick={connectWallet}>Generate Burner Wallet</Btn>
            )} */}
      {burnerWalletClient.account && (
        <Btn onClick={copyPrivateKey}>
          {state.pkCopied ? "Copied!" : "Copy Game Account Private Key"}
        </Btn>
      )}
    </div>
  );

  const renderStatusMessages = () => {
    if (!state.isDataLoaded) {
      return null; // Don't render anything if data hasn't loaded
    }

    return (
      <div>
        {burnerWalletClient.account && state.burnerBalance === 0n && (
          <div>
            <Red>
              Warning: Your burner wallet needs funds to register and play.
            </Red>
          </div>
        )}
        {burnerBalanceValue <= LOW_BALANCE_THRESHOLD && (
          <div>
            <Red>Warning: Low session wallet balance!</Red>
          </div>
        )}

        {state.txSuccessful && (
          <div>
            <Green>Transaction successful!</Green>
          </div>
        )}
        {state.pkCopied && (
          <div>
            <Green>Private key copied!</Green>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div slot="title" style={{ marginLeft: "8px", flexShrink: 0 }}>
        <Spacer width={4} />
      </div>

      <div className="flex flex-col gap-6">
        {renderWalletConnection()}
        {renderWalletStatus()}
        {renderBurnerWalletControls()}
        {renderTransferControls()}
        {renderStatusMessages()}
        {showRegisterPlayer && <RegisterPlayerComponent />}
      </div>
    </div>
  );
};
