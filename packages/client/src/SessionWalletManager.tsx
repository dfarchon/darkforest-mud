import React, { useEffect, useState } from "react";

import { createBurnerAccount } from "@latticexyz/common";

import { createWalletClient, formatEther, parseEther } from "viem";
import { useWalletClient } from "wagmi";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/tooltip";
import { useBurnerBalance, useMainWalletBalance } from "./hooks/useBalance";
import { clientOptions } from "./mud/common";
import { LOW_BALANCE_THRESHOLD, RECOMMENDED_BALANCE, shortedAddress } from "./shared";

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
      const gasLimit = 21000; // Typical gas limit for simple ETH transfers
      await walletClient.sendTransaction({
        to: burnerWalletClient.account?.address,
        value,
        gasLimit,
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
    <div className="fixed right-5 top-[80px] z-50 flex items-center justify-center bg-black">
      <div id="session-wallet-modal" className="relative w-full max-w-lg rounded-lg bg-black p-6 shadow-lg">
        <button onClick={onClose} className="absolute right-2 top-2 text-gray-500 hover:text-gray-700">
          ✕
        </button>
        <h3 className="mb-4 flex items-center justify-between text-lg">
          <span className="text-left font-bold">Session Wallet Manager</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <button
                  onClick={fetchBalances}
                  className="flex items-center rounded-lg bg-gray-800 p-2 text-white shadow-md hover:bg-gray-600"
                >
                  🗘
                </button>
              </TooltipTrigger>
              <TooltipContent>Refresh balance</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Main :</span>
            <span>{shortedAddress(walletClient?.account?.address as `0x${string}`)}</span>
            <span>{mainWalletBalance ? Number(formatEther(mainWalletBalance)).toFixed(4) : "0"} ETH</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Session :</span>
            <span>{shortedAddress(burnerWalletClient?.account?.address)}</span>

            <span>{burnerBalance ? Number(formatEther(burnerBalance)).toFixed(4) : "0"} ETH</span>
          </div>
          <div className="items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <button
                    onClick={copyPrivateKey}
                    className="flex items-center rounded-lg bg-gray-800 p-2 text-white shadow-md hover:bg-gray-600"
                  >
                    {pkCopied ? "Copied!" : "Copy"}
                  </button>
                </TooltipTrigger>
                <TooltipContent>Copy pk to clipboard</TooltipContent>
              </Tooltip>
            </TooltipProvider>{" "}
          </div>
          <div className="flex flex-row items-center justify-center space-x-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <button
                    onClick={transferToBurner}
                    className="w-full rounded bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:opacity-50"
                    disabled={
                      (transferAmount ?? 0) <= 0 || mainWalletBalance < parseEther((transferAmount ?? 0).toString())
                    }
                  >
                    Send to
                  </button>
                </TooltipTrigger>
                <TooltipContent>Send input amount to burnerWallet</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <input
                    type="number"
                    placeholder="Enter amount to transfer"
                    value={transferAmount ?? "0"}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value >= 0 && value <= 1) {
                        setTransferAmount(value);
                      }
                    }}
                    min="0"
                    max="1"
                    step="0.001" // Allows increments of 0.01 ETH for more precise control
                    className="rounded border p-2"
                  />
                </TooltipTrigger>
                <TooltipContent>Set input amount</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <button
                    onClick={drainBurner}
                    className="w-full rounded bg-red-500 p-2 text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    Drain
                  </button>
                </TooltipTrigger>
                <TooltipContent>Send all to mainWallet</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {burnerBalanceValue <= LOW_BALANCE_THRESHOLD && (
            <div className="flex items-center justify-center text-red-500">Warning: Low session wallet balance!</div>
          )}
          {txSuccessful && <div className="text-center text-green-600">Transaction successful!</div>}
        </div>
      </div>
    </div>
  );
};
