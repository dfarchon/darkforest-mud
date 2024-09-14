import { entityToAddress } from "@frontend/Pages/GamePage";
import { useMUD } from "@mud/MUDContext";
import { useState } from "react";
import { useAccount } from "wagmi";

const RegisterPlayer = () => {
  const [name, setName] = useState("");
  const linkedAccount = useAccount();

  const {
    systemCalls: { registerPlayer },
    network: { playerEntity },
  } = useMUD();

  const handleregisterPlayer = () => {
    if (!linkedAccount.address) {
      alert("Please Connect Main Account");
      return;
    }
    if (name.length <= 8 && name.length > 0) {
      registerPlayer(name, entityToAddress(playerEntity) as `0x${string}`);
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
          onClick={handleregisterPlayer}
          className="w-full rounded bg-blue-500 p-2 font-semibold text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Register Player
        </button>
      </div>
    </>
  );
};

export default RegisterPlayer;
