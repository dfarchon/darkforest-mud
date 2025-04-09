import { Green, Red } from "@frontend/Components/Text";
import { useBurnerBalance, useMainWalletBalance } from "@hooks/useBalance";
import { useMUD } from "@mud/MUDContext";
import { zeroAddress } from "@wallet/utils";
import { formatAddress } from "@wallet/utils";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { formatEther, type Hex, parseEther } from "viem";
import {
  useAccount,
  useDisconnect,
  usePublicClient,
  useWalletClient,
} from "wagmi";

const PinkButton = styled.button`
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 20px 40px;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 105, 180, 0.3);
  margin: 20px;
  min-width: 200px;
  outline: none;

  &:hover {
    background-color: #ff1493;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 105, 180, 0.4);
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 2px 10px rgba(255, 105, 180, 0.3);
  }

  &:focus {
    outline: none;
  }
`;

const NormalButton = styled.button`
  background-color: #4a5568;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 20px 40px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(74, 85, 104, 0.3);
  min-width: 200px;

  &:hover {
    background-color: #2d3748;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(74, 85, 104, 0.4);
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 2px 10px rgba(74, 85, 104, 0.3);
  }

  &:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const StyledInput = styled.input`
  background-color: transparent;
  color: white;
  border: 2px solid #ff69b4;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 24px;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 105, 180, 0.3);
  outline: none;
  width: 160px;
  height: 50px;

  &:focus {
    border-color: #ff1493;
    box-shadow: 0 0 15px rgba(255, 105, 180, 0.5);
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    opacity: 1;
    background-color: #ff69b4;
  }

  &[type="number"] {
    -moz-appearance: textfield;
    &:hover,
    &:focus {
      -moz-appearance: number-input;
    }
  }
`;

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
  const [registrationMessage, setRegistrationMessage] = useState("");

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
      setRegistrationMessage("Transfer to burner wallet successfully!");
      // Set a timer to clear the message after 5 seconds
      setTimeout(() => {
        setRegistrationMessage("");
      }, 5000);
    } catch (error) {
      console.error("Transfer failed:", error);
      setRegistrationMessage(
        "Transfer to burner wallet failed. Please try again.",
      );
      // Set a timer to clear the message after 5 seconds
      setTimeout(() => {
        setRegistrationMessage("");
      }, 5000);
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
      setRegistrationMessage("Transfer to main wallet successfully!");
      // Set a timer to clear the message after 5 seconds
      setTimeout(() => {
        setRegistrationMessage("");
      }, 5000);
    } catch (error) {
      console.error("Transfer failed:", error);
      setRegistrationMessage(
        "Transfer to main wallet failed. Please try again.",
      );
      // Set a timer to clear the message after 5 seconds
      setTimeout(() => {
        setRegistrationMessage("");
      }, 5000);
    }
  };

  const copyBurnerPrivateKey = async () => {
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

  // Add input validation handler with max value check
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty input or valid numbers
    if (value === "" || /^\d*\.?\d{0,5}$/.test(value)) {
      // Convert empty string to '0'
      const newValue = value === "" ? "0" : value;
      // Prevent leading zeros
      const formattedValue = newValue.replace(/^0+(?=\d)/, "");

      // Check if value is less than or equal to 1
      const numValue = parseFloat(formattedValue);
      if (numValue <= 1) {
        setTransferAmount(formattedValue);
      }
    }
  };

  const renderStatusMessages = () => (
    <div>
      {registrationMessage && (
        <div>
          {registrationMessage.includes("successful") ? (
            <Green>{registrationMessage}</Green>
          ) : (
            <Red>{registrationMessage}</Red>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div>
        <span>Main Account: </span>
        <span>{(walletClient?.account?.address ?? zeroAddress) as Hex}</span>
        <br />
        <span>Balance: {formatEther(mainWalletBalanceValue)} ETH</span>
      </div>
      <div>
        <span>Game Account: </span>
        <span>
          {(burnerWalletClient?.account?.address ?? zeroAddress) as Hex}
        </span>
        <br />
        <span>Balance: {formatEther(burnerBalanceValue)} ETH</span>
      </div>

      <div
        style={{
          padding: "20px",
          background: "rgba(0, 0, 0, 0.8)",
          borderRadius: "8px",
          border: "1px solid #ff69b4",
          color: "#fff",
          textAlign: "left",
          margin: "20px 0",
          width: "600px",
          maxWidth: "90%",
        }}
      >
        <div
          style={{
            fontSize: "24px",
            marginBottom: "15px",
            color: "#ff69b4",
          }}
        >
          ⚡ ⚠️ HEADS UP ⚡
        </div>
        <ul style={{ listStyleType: "none", padding: 0 }}>
          <li>1. Your Game Wallet lives only in your browser.</li>
          <li>2. It's never online — you're the only one who holds the key.</li>
          <li>3. Just keep enough ETH for gas.</li>
          <li>4. Don't clear your explorer cache during game.</li>
          <li>5. Don't forget to back up your private key.</li>
        </ul>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <StyledInput
            type="number"
            value={transferAmount}
            onChange={handleInputChange}
            step="0.0001"
            min="0"
            max="1"
            placeholder="0"
          />
          <PinkButton onClick={transferToBurner}>
            Send {transferAmount} ETH to Game Account
          </PinkButton>
        </div>

        <div className="flex items-center space-x-2">
          <NormalButton onClick={withdrawAll}>
            Transfer All to Main Account
          </NormalButton>
          <NormalButton onClick={copyBurnerPrivateKey}>
            {isCopied ? "Copied!" : "Copy Game Account Private Key"}
          </NormalButton>
        </div>
        {renderStatusMessages()}
      </div>
    </div>
  );
};
