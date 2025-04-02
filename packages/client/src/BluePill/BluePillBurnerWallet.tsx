import {
  useAccount,
  useDisconnect,
  useWalletClient,
  usePublicClient,
} from "wagmi";
import { useMUD } from "@mud/MUDContext";
import { useEffect, useState } from "react";
import { useBurnerBalance, useMainWalletBalance } from "@hooks/useBalance";
import { zeroAddress } from "@wallet/utils";
import { formatAddress } from "@wallet/utils";
import { formatEther, parseEther, type Hex } from "viem";

export const BluePillBurnerWallet = () => {
  const { isConnected, address, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const {
    network: {
      walletClient: burnerWalletClient,
      playerEntity,
      waitForTransaction,
    },
    components: { Player },
  } = useMUD();

  const publicClient = usePublicClient();

  const { value: burnerBalanceValue, refetch: refetchBurnerBalance } =
    useBurnerBalance();
  const { value: mainWalletBalanceValue, refetch: refetchMainWalletBalance } =
    useMainWalletBalance();

  const [transferAmount, setTransferAmount] = useState("0.001");
  const [isCopied, setIsCopied] = useState(false);

  const transferToBurner = async () => {
    if (!walletClient || !burnerWalletClient?.account?.address) return;
    try {
      const hash = await walletClient.sendTransaction({
        to: burnerWalletClient.account.address,
        value: parseEther(transferAmount),
      });
      await waitForTransaction(hash);
      refetchMainWalletBalance();
      refetchBurnerBalance();
    } catch (error) {
      console.error("Transfer failed:", error);
    }
  };

  const withdrawAll = async () => {
    if (!burnerWalletClient || !walletClient) {
      return;
    }
    try {
      // Get gas price
      const gasPrice = await burnerWalletClient.transport.request({
        method: "eth_gasPrice",
      });

      // Convert hex gasPrice to BigInt
      const gasPriceBigInt = BigInt(gasPrice);
      const gasLimit = BigInt(21000);
      const gasCost = gasPriceBigInt * gasLimit;

      // Ensure balance is BigInt
      const balance = BigInt(burnerBalanceValue);

      // Calculate max amount
      if (balance <= gasCost) {
        console.error("Insufficient funds to cover gas");
        return;
      }

      const maxAmount = balance - gasCost;

      const hash = await burnerWalletClient.sendTransaction({
        to: walletClient.account?.address,
        value: maxAmount,
        gasLimit,
      });
      await waitForTransaction(hash);
      console.log("hash", hash);
      refetchMainWalletBalance();
      refetchBurnerBalance();
    } catch (error) {
      console.error("Transfer failed:", error);
    }
  };

  const copyBurnerAddress = async () => {
    if (!burnerWalletClient?.account?.address) return;

    const privateKey = localStorage.getItem("mud:burnerWallet");
    if (!privateKey) return;

    try {
      await navigator.clipboard.writeText(privateKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  useEffect(() => {
    const fetchBalances = async () => {
      await refetchBurnerBalance();
      await refetchMainWalletBalance();
    };
    fetchBalances();
  }, [refetchBurnerBalance, refetchMainWalletBalance]);

  return (
    <div>
      <div>
        <span>Main Wallet: </span>
        <span>{(walletClient?.account?.address ?? zeroAddress) as Hex}</span>
        <br />
        <span>Balance: {formatEther(mainWalletBalanceValue)} ETH</span>
      </div>
      <div>
        <span>Burner Wallet: </span>
        <span>
          {(burnerWalletClient?.account?.address ?? zeroAddress) as Hex}
        </span>
        <br />
        <span>Balance: {formatEther(burnerBalanceValue)} ETH</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            className="rounded border px-2 py-1"
            step="0.01"
            min="0"
          />
          <button
            onClick={transferToBurner}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Send to Burner
          </button>
        </div>

        <button
          onClick={withdrawAll}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Transfer All to Main
        </button>

        <button
          onClick={copyBurnerAddress}
          className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
        >
          {isCopied ? "Copied!" : "Copy Burner Address"}
        </button>
      </div>
    </div>
  );
};
