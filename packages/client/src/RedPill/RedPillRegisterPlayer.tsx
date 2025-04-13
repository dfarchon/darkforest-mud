import { address as toEthAddress, addressToHex } from "@df/serde";
import { Btn } from "@frontend/Components/Btn";
import { Green, Red } from "@frontend/Components/Text";
import { useBurnerBalance, useMainWalletBalance } from "@hooks/useBalance";
import { getComponentValue } from "@latticexyz/recs";
import { encodeEntity } from "@latticexyz/store-sync/recs";
import { useMUD } from "@mud/MUDContext";
import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import {
  createWalletClient,
  encodeFunctionData,
  http,
  type Hex,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { useWalletClient } from "wagmi";
import type { EthConnection } from "@df/network";
import { observer } from "@latticexyz/explorer/observer";
import { transactionQueue, writeObserver } from "@latticexyz/common/actions";
import type { EthAddress } from "@df/types";

const StyledInput = styled.input`
  background-color: transparent;
  color: white;
  border: 2px solid #ff69b4;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 18px;
  transition: all 0.3s ease;
  box-shadow: ${(props) =>
    !props.value ? "0 0 30px #ff1493" : "0 0 5px rgba(255, 105, 180, 0.2)"};
  outline: none;
  width: 400px;
  height: 50px;

  &:focus {
    border-color: #ff1493;
    box-shadow: 0 0 15px rgba(255, 105, 180, 0.5);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  animation: ${(props) =>
    !props.value ? "glow 1.5s ease-in-out infinite alternate" : "none"};

  @keyframes glow {
    from {
      box-shadow:
        0 0 30px #ff1493,
        0 0 50px rgba(255, 20, 147, 0.8),
        0 0 70px rgba(255, 20, 147, 0.6);
      border-color: #ff1493;
    }
    to {
      box-shadow:
        0 0 5px rgba(255, 105, 180, 0.2),
        0 0 10px rgba(255, 105, 180, 0.1);
      border-color: #ff69b4;
    }
  }
`;

const PlayerNameLabel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 20px;
  width: 100%;
`;

const PlayerNameTitle = styled.div`
  font-size: 20px;
  color: #a0aec0;
  margin-bottom: 12px;
  margin-left: 16px;
`;

const PlayerNameValue = styled.div`
  color: #ff69b4;
  font-weight: bold;
  font-size: 48px;
  text-shadow: 0 0 20px rgba(255, 105, 180, 0.5);
  transition: all 0.3s ease;
  padding: 16px;
  letter-spacing: 2px;

  &:hover {
    text-shadow: 0 0 30px rgba(255, 105, 180, 0.8);
    transform: scale(1.05);
  }
`;

const NotSetText = styled.span`
  font-size: 24px;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;

  font-weight: bold;
  font-size: 48px;
  transition: all 0.3s ease;
  padding: 16px;
  letter-spacing: 2px;
`;

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

  &:disabled {
    background-color: #ffc0cb;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    opacity: 0.6;

    &:hover {
      background-color: #ffc0cb;
      transform: none;
      box-shadow: none;
    }
  }
`;

export const RedPillRegisterPlayer = ({
  ethConnection,
}: {
  ethConnection: EthConnection;
}) => {
  const {
    network: { playerEntity, worldContract, waitForTransaction, publicClient },
    components: { Player },
  } = useMUD();

  const [state, setState] = useState({
    playerName: "",
    isPlayerRegistered: false,
    registrationStatus: "",
  });

  const [registrationMessage, setRegistrationMessage] = useState("");
  const [redPillWalletClient, setRedPillWalletClient] =
    useState<WalletClient | null>(null);

  // Convert EthAddress to 0x hex string
  const toHexAddress = (
    address: EthAddress | undefined,
  ): `0x${string}` | undefined => {
    if (!address) return undefined;
    return address as `0x${string}`;
  };

  // Create a viem WalletClient from ethConnection
  useEffect(() => {
    if (ethConnection) {
      const address = ethConnection.getAddress();
      const privateKey = ethConnection.getPrivateKey();
      const provider = ethConnection.getProvider();

      if (address && privateKey) {
        try {
          const account = privateKeyToAccount(privateKey as `0x${string}`);

          // Create a custom wallet client using ethConnection's data
          const customWalletClient = createWalletClient({
            account,
            transport: http(provider.connection.url),
            chain: publicClient.chain,
          })
            .extend(transactionQueue())
            .extend(
              writeObserver({
                onWrite: (write) => console.log("Transaction write:", write),
              }),
            )
            .extend(observer({ waitForTransaction }));

          setRedPillWalletClient(customWalletClient);
        } catch (error) {
          console.error("Failed to create wallet client:", error);
        }
      }
    }
  }, [ethConnection, waitForTransaction, publicClient]);

  useEffect(() => {
    const checkPlayerRegistration = async () => {
      if (playerEntity && ethConnection) {
        const address = ethConnection.getAddress();
        if (address) {
          const playerKey = encodeEntity(Player.metadata.keySchema, {
            owner: addressToHex(address),
          });
          const rawPlayer = getComponentValue(Player, playerKey);
          setState((prev) => ({
            ...prev,
            isPlayerRegistered: !!rawPlayer,
            playerName:
              rawPlayer?.name ||
              (prev.isPlayerRegistered ? "" : prev.playerName),
          }));
        }
      }
    };

    // Initial check
    checkPlayerRegistration();

    // Set up interval to check every 5 seconds
    const intervalId = setInterval(checkPlayerRegistration, 5000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [playerEntity, Player, ethConnection]);

  const handlePlayerNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setState((prev) => ({
        ...prev,
        playerName: e.target.value.replace(/\s+/g, "").slice(0, 16),
      }));
    },
    [],
  );

  const registerPlayerAction = async () => {
    console.log("something 1");
    if (!redPillWalletClient) {
      alert("No wallet client available");
      console.error("No wallet client available");
      return;
    }

    console.log("something 2");
    const address = ethConnection.getAddress();
    if (!address) {
      alert("No address available");
      console.error("No address available");
      return;
    }

    console.log("something 3");
    if (state.playerName.length === 0) {
      alert("Player name is required");
      console.error("Player name is required");
      return;
    }

    console.log("something 4");
    try {
      const registerPlayerAbi = [
        {
          inputs: [
            { internalType: "string", name: "name", type: "string" },
            { internalType: "address", name: "burner", type: "address" },
          ],
          name: "df__registerPlayer",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ];

      const hexAddress = toHexAddress(address);
      if (!hexAddress) {
        alert("Invalid address format");
        return;
      }

      const data = encodeFunctionData({
        abi: registerPlayerAbi,
        functionName: "df__registerPlayer",
        args: [state.playerName, hexAddress],
      });
      const gasLimit = 21000n;

      const txData = {
        to: worldContract.address as `0x${string}`,
        data,
        gasLimit,
      };

      console.log("Preparing to send transaction:", txData);
      console.log("Using wallet client:", redPillWalletClient);

      // Use the viem wallet client created from ethConnection
      const txResponse = await redPillWalletClient.sendTransaction(txData);
      console.log("Transaction sent:", txResponse);
      await waitForTransaction(txResponse);

      setRegistrationMessage("Player registered successfully!");

      // Set a timer to clear the message after 5 seconds
      setTimeout(() => {
        setRegistrationMessage("");
      }, 5000);
    } catch (error) {
      console.error("Transaction failed:", error);
      setRegistrationMessage("Failed to register player. Please try again.");

      // Also clear error message after 5 seconds
      setTimeout(() => {
        setRegistrationMessage("");
      }, 5000);
    }
  };

  const renderRegistrationControls = () => {
    if (state.isPlayerRegistered) {
      return (
        <div className="flex flex-col gap-2">
          <div className="text-sm">
            <Green>You are already registered as a player.</Green>
          </div>
          <div className="text-sm">
            Address:{" "}
            <span className="font-semibold">
              {ethConnection.getAddress() || "Not connected"}
            </span>
          </div>
          {state.playerName && (
            <div className="text-sm">
              Your Player Name: <Green>{state.playerName}</Green>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <br />
          <br />

          <div className="flex items-center gap-2">
            <StyledInput
              type="text"
              placeholder="eg: john"
              value={state.playerName}
              onChange={handlePlayerNameChange}
            />
          </div>
        </div>

        <PlayerNameLabel>
          {state.playerName ? (
            <div>
              <PlayerNameValue> {state.playerName}</PlayerNameValue>
            </div>
          ) : (
            <NotSetText>Not Set Yet</NotSetText>
          )}
        </PlayerNameLabel>

        {ethConnection.getAddress() && (
          <div>
            <PinkButton
              onClick={registerPlayerAction}
              disabled={!state.playerName || !redPillWalletClient}
            >
              {state.playerName
                ? `Register as "${state.playerName}"`
                : "Please Enter Your Name"}
            </PinkButton>
          </div>
        )}
      </div>
    );
  };

  const renderStatusMessages = () => (
    <div>
      {registrationMessage && (
        <div>
          {registrationMessage.includes("successfully") ? (
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
      <div className="flex flex-col gap-6">
        <div className="rounded-lg">{renderRegistrationControls()}</div>
        {renderStatusMessages()}
      </div>
    </div>
  );
};
