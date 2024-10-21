import { address as toEthAddress, addressToHex } from "@df/serde";
import { Btn } from "@frontend/Components/Btn";
import { Green, Red } from "@frontend/Components/Text";
import { getComponentValue } from "@latticexyz/recs";
import { encodeEntity } from "@latticexyz/store-sync/recs";
import { useMUD } from "@mud/MUDContext";
import React, { useCallback, useEffect, useState } from "react";
import { encodeFunctionData } from "viem";
import { useWalletClient } from "wagmi";

export const RegisterPlayerComponent = () => {
  const {
    network: { walletClient: burnerWalletClient, playerEntity, worldContract },
    components: { Player },
  } = useMUD();

  const { data: walletClient } = useWalletClient();

  const [state, setState] = useState({
    playerName: "",
    isPlayerRegistered: false,
    registrationStatus: "",
  });

  const [registrationMessage, setRegistrationMessage] = useState("");

  useEffect(() => {
    const checkPlayerRegistration = async () => {
      if (playerEntity && walletClient?.account) {
        const mainAccount = toEthAddress(walletClient.account.address);
        const playerKey = encodeEntity(Player.metadata.keySchema, {
          owner: addressToHex(mainAccount),
        });
        const rawPlayer = getComponentValue(Player, playerKey);
        setState((prev) => ({
          ...prev,
          isPlayerRegistered: !!rawPlayer,
          // playerName: rawPlayer?.name || "",
        }));
      }
    };

    // Initial check
    checkPlayerRegistration();

    // Set up interval to check every 5 seconds
    const intervalId = setInterval(checkPlayerRegistration, 5000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [playerEntity, Player, walletClient]);

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
    if (!walletClient) {
      console.error("No wallet client available");
      return;
    }

    const burnerWalletAddress = burnerWalletClient.account?.address;
    if (!burnerWalletAddress) {
      console.error("No burner wallet address available");
      return;
    }

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

      const data = encodeFunctionData({
        abi: registerPlayerAbi,
        functionName: "df__registerPlayer",
        args: [state.playerName, burnerWalletAddress],
      });
      const gasLimit = 21000;

      const txData = {
        to: worldContract.address,
        data,
        gasLimit,
      };

      const txResponse = await walletClient.sendTransaction(txData);
      console.log("Transaction sent:", txResponse);
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
            Burner Wallet:{" "}
            <span className="font-semibold">
              {burnerWalletClient.account
                ? burnerWalletClient.account.address
                : "Not connected"}
            </span>
          </div>
          {state.playerName && (
            <div className="text-sm">
              Player Name: <Green>{state.playerName}</Green>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="text-sm">
            Burner Wallet:{" "}
            <span className="font-semibold">
              {burnerWalletClient.account
                ? burnerWalletClient.account.address
                : "Not connected"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Input Player Name (MAX 16)"
              value={state.playerName}
              onChange={handlePlayerNameChange}
              style={{
                width: "200px",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                outline: "none",
              }}
            />
            <div className="text-sm">
              Player Name:{" "}
              <span className="font-semibold">
                {state.playerName ? (
                  <Green> {state.playerName} </Green>
                ) : (
                  "Not Set Yet"
                )}
              </span>
            </div>
          </div>
        </div>
        {burnerWalletClient.account && (
          <Btn
            size="medium"
            onClick={registerPlayerAction}
            disabled={!state.playerName}
          >
            Register Player
          </Btn>
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
        <div className="rounded-lg">
          <h3 className="mb-4 text-lg font-semibold">Player Registration</h3>
          {renderRegistrationControls()}
        </div>
        {renderStatusMessages()}
      </div>
    </div>
  );
};
