import { entityToAddress } from "@frontend/Pages/GamePage";
import { useMUD } from "@mud/MUDContext";
import { useState } from "react";
import { encodeFunctionData } from "viem";
import { useWalletClient } from "wagmi";

const SpawnPlayer = () => {
  const [name, setName] = useState("");
  // const linkedAccount = useAccount();
  const {
    network: { playerEntity, worldContract },
  } = useMUD();
  const { data: walletClient } = useWalletClient();

  // const handleMintPlayer = () => {
  //   if (!linkedAccount.address) {
  //     alert("Please Connect Main Account");
  //     return;
  //   }
  //   if (name.length <= 8 && name.length > 0) {
  //     mintPlayer(name, linkedAccount.address);
  //   } else {
  //     alert("Name must be between 1 and 8 characters.");
  //   }
  // };

  const handleRegisterSubmit = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();

    // Check if walletClient is available
    if (!walletClient) {
      console.error("No wallet client available");
      return;
    }

    // Get the address of the burner wallet from playerEntity
    const burnerWalletAddress = entityToAddress(playerEntity);
    if (!burnerWalletAddress) {
      console.error("No burner wallet address available");
      return;
    }

    try {
      // Define the ABI for the registerPlayer function
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

      // Encode function data using viem's encodeFunctionData
      const data = encodeFunctionData({
        abi: registerPlayerAbi,
        functionName: "df__registerPlayer",
        args: [name, burnerWalletAddress],
      });
      const gasLimit = 21000;
      // Prepare the transaction data
      const txData = {
        to: worldContract.address, // The address of the contract that handles registration
        data, // The encoded function data
        gasLimit,
        // Adjust gas limit as needed
      };

      // Send the transaction using walletClient
      const txResponse = await walletClient.sendTransaction(txData);

      console.log("Transaction sent:", txResponse);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  return (
    <>
      <div className="mx-auto flex max-w-sm flex-col items-center space-y-4 rounded-lg p-4 shadow-md">
        <input
          type="text"
          placeholder="Enter name (max 8 chars)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={8}
          className="w-full rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleRegisterSubmit}
          className="w-full rounded bg-blue-500 p-2 font-semibold text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Spawn Player
        </button>
      </div>
    </>
  );
};

export default SpawnPlayer;
