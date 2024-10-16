import { addressToHex, address as toEthAddress } from "@df/serde";
import { Btn } from "@frontend/Components/Btn";
import { Spacer, Title } from "@frontend/Components/CoreUI";
import { Green, Red } from "@frontend/Components/Text";
import { getComponentValue } from "@latticexyz/recs";
import { encodeEntity } from "@latticexyz/store-sync/recs";
import { useMUD } from "@mud/MUDContext";
import React, { useEffect, useState, useCallback } from "react";
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

  // PUNK update functions has issues here
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
          playerName: rawPlayer?.name || "",
        }));
      }
    };

    checkPlayerRegistration();
  }, [playerEntity, Player, walletClient]);

  const handlePlayerNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setState((prev) => ({
        ...prev,
        playerName: e.target.value.slice(0, 8),
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
      setState((prev) => ({
        ...prev,
        registrationStatus: "Player registered successfully!",
      }));
    } catch (error) {
      console.error("Transaction failed:", error);
      setState((prev) => ({
        ...prev,
        registrationStatus: "Failed to register player. Please try again.",
      }));
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
              Player Name:{" "}
              <span className="font-semibold">{state.playerName}</span>
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
              placeholder="Player name (max 8)"
              value={state.playerName}
              onChange={handlePlayerNameChange}
              className="h-8 w-48 rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-sm">
              Player Name:{" "}
              <span className="font-semibold">
                {state.playerName || "Not set"}
              </span>
            </div>
          </div>
        </div>
        {burnerWalletClient.account && (
          <Btn
            onClick={registerPlayerAction}
            disabled={!state.playerName}
            className="h-8 w-48 px-3 py-1 text-sm"
          >
            Register Player
          </Btn>
        )}
      </div>
    );
  };

  const renderStatusMessages = () => (
    <div>
      {state.registrationStatus && (
        <div>
          {state.registrationStatus.includes("successfully") ? (
            <Green>{state.registrationStatus}</Green>
          ) : (
            <Red>{state.registrationStatus}</Red>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <Title slot="title">Register Player</Title>
      <div slot="title" style={{ marginLeft: "8px", flexShrink: 0 }}>
        <Spacer width={4} />
      </div>

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
