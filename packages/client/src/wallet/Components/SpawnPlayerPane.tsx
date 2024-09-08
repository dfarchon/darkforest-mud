import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useMUD } from "@mud/MUDContext";

const SpawnPlayer = () => {
  const [name, setName] = useState("");
  const linkedAccount = useAccount();
  const {
    systemCalls: { mintPlayer },
  } = useMUD();

  const handleMintPlayer = () => {
    if (!linkedAccount.address) {
      alert("Please Connect Main Account");
      return;
    }
    if (name.length <= 8 && name.length > 0) {
      mintPlayer(name, linkedAccount.address);
    } else {
      alert("Name must be between 1 and 8 characters.");
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
          onClick={handleMintPlayer}
          className="w-full rounded bg-blue-500 p-2 font-semibold text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Spawn Player
        </button>
      </div>
    </>
  );
};

export default SpawnPlayer;
