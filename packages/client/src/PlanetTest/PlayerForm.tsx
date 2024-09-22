import { entityToAddress } from "@frontend/Pages/GamePage";
import { useMUD } from "@mud/MUDContext";
import { useState } from "react";
import { encodeFunctionData } from "viem";
import { useAccount, useWalletClient } from "wagmi";

const PlayerForm = () => {
  const {
    // @ts-expect-error unused registerPlayer and changePlayerName
    systemCalls: { registerPlayer, changePlayerName, changeBurnerWallet },
    network: { playerEntity, worldContract },
  } = useMUD();

  // Define your contract details

  const { data: walletClient } = useWalletClient();
  const [playerName, setPlayerName] = useState("");

  // @ts-expect-error unused account
  const account = useAccount();
  const [newPlayerName, setNewPlayerName] = useState("");

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        args: [playerName, burnerWalletAddress],
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

  const handleChangeNameSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    // Check if walletClient is available
    if (!walletClient) {
      console.error("No wallet client available");
      return;
    }

    try {
      // Define the ABI for the changePlayerName function
      const changePlayerNameAbi = [
        {
          inputs: [{ internalType: "string", name: "newName", type: "string" }],
          name: "df__changePlayerName",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ];

      // Encode function data using viem's encodeFunctionData
      const data = encodeFunctionData({
        abi: changePlayerNameAbi,
        functionName: "df__changePlayerName",
        args: [newPlayerName],
      });

      // Prepare the transaction data
      const txData = {
        to: worldContract.address, // The address of the contract that handles the changePlayerName function
        data, // The encoded function data
        gasLimit: 21000, // Adjust the gas limit as needed
      };

      // Send the transaction using walletClient
      const txResponse = await walletClient.sendTransaction(txData);

      console.log("Transaction sent:", txResponse);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  // const handleRegisterSubmit = (e) => {
  //   e.preventDefault();

  //   // Handle player registration logic here
  //   registerPlayer(playerName, entityToAddress(playerEntity) as `0x${string}`);
  //   console.log(
  //     "Registering player:",
  //     playerName,
  //     entityToAddress(playerEntity),
  //   );
  // };

  // const handleChangeNameSubmit = (e) => {
  //   e.preventDefault();
  //   changePlayerName(newPlayerName, account.address);
  //   // Handle change player name logic here
  //   console.log("Changing player name to:", newPlayerName);
  // };

  const handleChangeBurnerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle change burner address logic here
    changeBurnerWallet(entityToAddress(playerEntity) as `0x${string}`);
    console.log("Changing burner address to:", entityToAddress(playerEntity));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-6 text-2xl font-semibold">Player Actions</h2>

        {/* Register Player Form */}
        <form onSubmit={handleRegisterSubmit} className="mb-8">
          <h3 className="mb-4 text-xl font-medium">Register Player</h3>
          <div className="mb-4">
            <label htmlFor="playerName" className="block text-gray-700">
              Player Name
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter player name"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Register Player
          </button>
        </form>

        {/* Change Player Name Form */}
        <form onSubmit={handleChangeNameSubmit} className="mb-8">
          <h3 className="mb-4 text-xl font-medium">Change Player Name</h3>
          <div className="mb-4">
            <label htmlFor="newPlayerName" className="block text-gray-700">
              New Player Name
            </label>
            <input
              type="text"
              id="newPlayerName"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter new player name"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Change Player Name
          </button>
        </form>

        {/* Change Burner Address Form */}
        <form onSubmit={handleChangeBurnerSubmit}>
          <h3 className="mb-4 text-xl font-medium">Change Burner Address</h3>

          <button
            type="submit"
            className="w-full rounded-md bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            Change Burner Address
          </button>
        </form>
      </div>
    </div>
  );
};

export default PlayerForm;
