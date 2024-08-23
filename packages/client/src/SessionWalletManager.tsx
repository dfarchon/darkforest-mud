import React, { useEffect, useState } from "react";

import { createBurnerAccount } from "@latticexyz/common";

import { createWalletClient, formatEther, parseEther } from "viem";
import { useWalletClient } from "wagmi";

import { useBurnerBalance, useMainWalletBalance } from "./hooks/useBalance";
import { clientOptions } from "./mud/common";
import { RECOMMENDED_BALANCE, shortedAddress } from "./shared";

export const SessionWalletManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const burnerAccount = createBurnerAccount(localStorage.getItem("mud:burnerWallet") as `0x${string}`);
  const burnerWalletClient = createWalletClient({
    ...clientOptions,
    account: burnerAccount,
  });

  const [burnerBalance, setBurnerBalance] = useState<bigint>(0n);
  const [mainWalletBalance, setMainWalletBalance] = useState<bigint>(0n);
  const [transferAmount, setTransferAmount] = useState<number>(Number(RECOMMENDED_BALANCE) / 1e18);
  const [txSuccessful, setTxSuccessful] = useState(false);
  const [pkCopied, setPkCopied] = useState(false);

  const { data: walletClient } = useWalletClient();
  const { value: burnerBalanceValue, refetch: refetchBurnerBalance } = useBurnerBalance(burnerWalletClient);
  const { value: mainWalletBalanceValue, refetch: refetchMainWalletBalance } = useMainWalletBalance();

  // Fetch balances explicitly
  const fetchBalances = async () => {
    try {
      await refetchBurnerBalance();
      await refetchMainWalletBalance();
      setBurnerBalance(burnerBalanceValue);
      setMainWalletBalance(mainWalletBalanceValue);
    } catch (err) {
      console.error("Error fetching balances:", err);
    }
  };

  // Initial and interval-based balance fetch
  useEffect(() => {
    fetchBalances(); // Initial fetch

    const intervalId = setInterval(() => {
      fetchBalances(); // Fetch every 2 seconds
    }, 2000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [refetchBurnerBalance, refetchMainWalletBalance, burnerBalanceValue, mainWalletBalanceValue]);

  const transferToBurner = async () => {
    if (!burnerWalletClient || !walletClient) return;
    const value = parseEther((transferAmount ?? 0).toString());
    try {
      await walletClient.sendTransaction({
        to: burnerWalletClient.account?.address,
        value,
      });
      setTxSuccessful(true);
      fetchBalances(); // Refresh balances after transaction
      setTimeout(() => setTxSuccessful(false), 5000); // Remove message after 5 seconds
    } catch (err) {
      console.error("Error sending transaction:", err);
    }
  };

  const drainBurner = async () => {
    if (!burnerWalletClient || !walletClient) return;
    const value = burnerBalance; // Draining all funds
    try {
      await burnerWalletClient.sendTransaction({
        to: walletClient.account?.address,
        value,
      });
      setTxSuccessful(true);
      fetchBalances(); // Refresh balances after transaction
      setTimeout(() => setTxSuccessful(false), 5000); // Remove message after 5 seconds
    } catch (err) {
      console.error("Error sending transaction:", err);
    }
  };

  const copyPrivateKey = () => {
    if (burnerAccount.address) {
      navigator.clipboard
        .writeText(localStorage.getItem("mud:burnerWallet") as string)
        .then(() => {
          setPkCopied(true);
          setTimeout(() => setPkCopied(false), 2000); // Reset after 2 seconds
        })
        .catch((err) => {
          console.error("Failed to copy PK:", err);
        });
    }
  };

  // Click outside the modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const modal = document.getElementById("session-wallet-modal");
      if (modal && !modal.contains(target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div id="session-wallet-modal" className="relative w-full max-w-lg rounded-lg bg-black p-6 shadow-lg">
        <button onClick={onClose} className="absolute right-2 top-2 text-gray-500 hover:text-gray-700">
          ✕
        </button>
        <h3 className="mb-4 flex items-center justify-between text-lg font-bold">
          <span className="text-left">Session Wallet Manager</span>
          <button
            onClick={fetchBalances} // Manually refresh balances
            className="flex items-center rounded-lg bg-gray-800 p-2 text-white shadow-md hover:bg-gray-600"
          >
            Refresh
          </button>
        </h3>
        {txSuccessful && <div className="text-center text-green-600">Transaction successful!</div>}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Main Wallet Balance:</span>
            <span>{shortedAddress(walletClient?.account?.address as `0x${string}`)}</span>
            <span>{mainWalletBalance ? formatEther(mainWalletBalance) : "0"} ETH</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Session Wallet Balance:</span>
            <span>{shortedAddress(burnerWalletClient?.account?.address)}</span>
            <button
              onClick={copyPrivateKey}
              className="flex items-center rounded-lg bg-gray-800 p-2 text-white shadow-md hover:bg-gray-600"
            >
              {pkCopied ? "Copied!" : "Copy PK"}
            </button>
            <span>{burnerBalance ? formatEther(burnerBalance) : "0"} ETH</span>
          </div>
          {burnerBalanceValue.danger && <div className="text-red-500">Warning: Low session wallet balance!</div>}
          <div className="mt-4 space-y-2">
            <input
              type="number"
              placeholder="Enter amount to transfer"
              value={transferAmount ?? "0"}
              onChange={(e) => setTransferAmount(parseFloat(e.target.value))}
              className="w-full rounded border p-2"
            />
            <div className="flex items-center">
              <button
                onClick={transferToBurner}
                className="w-full rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
                disabled={
                  (transferAmount ?? 0) <= 0 || mainWalletBalance < parseEther((transferAmount ?? 0).toString())
                }
              >
                Transfer to Session Wallet
              </button>
              <button onClick={drainBurner} className="ml-2 w-full rounded bg-red-500 p-2 text-white hover:bg-red-600">
                Drain Session Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
