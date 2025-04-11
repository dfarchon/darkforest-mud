import { Btn } from "@frontend/Components/Btn";
import { Spacer, Title } from "@frontend/Components/CoreUI";
import { Modal } from "@frontend/Components/Modal";
import { Green, Red } from "@frontend/Components/Text";
import { useBurnerBalance, useMainWalletBalance } from "@hooks/useBalance";
import { useMUD } from "@mud/MUDContext";
import {
  LOW_BALANCE_THRESHOLD,
  RECOMMENDED_BALANCE,
  zeroAddress,
} from "@wallet/utils";
import { useEffect, useState } from "react";
import { formatEther, type Hex, parseEther, parseUnits } from "viem";
import { useWalletClient } from "wagmi";

export const WalletPane = ({ onClose }: { onClose: () => void }) => {
  const {
    network: { walletClient: burnerWalletClient, waitForTransaction },
  } = useMUD();

  const [burnerBalance, setBurnerBalance] = useState<bigint>(0n);
  const [mainWalletBalance, setMainWalletBalance] = useState<bigint>(0n);
  const [transferAmount, setTransferAmount] = useState<number>(
    Number(RECOMMENDED_BALANCE) / 1e18,
  );
  const [txSuccessful, setTxSuccessful] = useState(false);
  const [pkCopied, setPkCopied] = useState(false);

  const { data: walletClient } = useWalletClient();
  const { value: burnerBalanceValue, refetch: refetchBurnerBalance } =
    useBurnerBalance();
  const { value: mainWalletBalanceValue, refetch: refetchMainWalletBalance } =
    useMainWalletBalance();

  // Initial and interval-based balance fetch
  useEffect(() => {
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

    fetchBalances(); // Initial fetch
  }, [
    refetchBurnerBalance,
    refetchMainWalletBalance,
    burnerBalanceValue,
    mainWalletBalanceValue,
  ]);

  const transferToBurner = async () => {
    if (!burnerWalletClient || !walletClient) {
      return;
    }
    const value = parseEther((transferAmount ?? 0).toString());
    try {
      const gasLimit = 21000; // Typical gas limit for simple ETH transfers
      const hash = await walletClient.sendTransaction({
        to: burnerWalletClient.account?.address,
        value,
        gasLimit,
      });

      await waitForTransaction(hash);
      setTxSuccessful(true);
      // fetchBalances(); // Refresh balances after transaction
      setTimeout(() => setTxSuccessful(false), 5000); // Remove message after 5 seconds
    } catch (err) {
      console.error("Error sending transaction:", err);
    }
  };

  const copyPrivateKey = () => {
    if (walletClient?.account?.address ?? zeroAddress) {
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

  const withdrawAll = async () => {
    if (!burnerWalletClient || !walletClient) {
      return;
    }
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

    try {
      const hash = await burnerWalletClient.sendTransaction({
        to: walletClient.account?.address,
        value: maxAmount,
        gasLimit,
      });
      await waitForTransaction(hash);
      setTxSuccessful(true);
      // fetchBalances(); // Refresh balances after transaction
      setTimeout(() => setTxSuccessful(false), 5000); // Remove message after 5 seconds
    } catch (err) {
      console.error("Error sending transaction:", err);
      // You might want to add error state handling here
    }
  };

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
    <Modal id="session-wallet-modal" width={"36em"}>
      <Title slot="title">Wallet Management</Title>
      <div slot="title" style={{ marginLeft: "8px", flexShrink: 0 }}>
        <Spacer width={4} />
        <Btn size="small" onClick={() => onClose()}>
          close
        </Btn>
      </div>

      <div>
        <span>Main:</span>
        <span>
          <span>{(walletClient?.account?.address ?? zeroAddress) as Hex}</span>
        </span>{" "}
        <span>
          {mainWalletBalance
            ? Number(formatEther(mainWalletBalance)).toFixed(4)
            : "0"}{" "}
          ETH
        </span>
        <br />
        <span>Burner:</span>
        <span>
          {(burnerWalletClient?.account?.address ?? zeroAddress) as Hex}
        </span>{" "}
        <span>
          {burnerBalance ? Number(formatEther(burnerBalance)).toFixed(4) : "0"}{" "}
          ETH
        </span>
      </div>
      <div>
        <Btn onClick={copyPrivateKey}>
          {pkCopied ? "Copied!" : "Copy Burner Wallet Private Key"}
        </Btn>
      </div>
      <br />
      <div>
        <Btn
          onClick={transferToBurner}
          disabled={
            (transferAmount ?? 0) <= 0 ||
            mainWalletBalance < parseEther((transferAmount ?? 0).toString())
          }
        >
          Deposit {transferAmount} ETH
        </Btn>{" "}
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
          className="w-32 rounded border"
        />{" "}
        <Btn onClick={withdrawAll} disabled={(burnerBalanceValue ?? 0) <= 0}>
          Withdraw All
        </Btn>
      </div>
      {burnerBalanceValue <= LOW_BALANCE_THRESHOLD && (
        <div>
          <Red>Warning: Low session wallet balance!</Red>
        </div>
      )}
      {txSuccessful && (
        <div>
          <Green>Transaction successful!</Green>
        </div>
      )}
    </Modal>
  );
};
