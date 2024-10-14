import { useStore } from "@hooks/useStore";
import { useComponentValue } from "@latticexyz/react";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { useMUD } from "@mud/MUDContext";
import { useEffect, useState } from "react";
import { encodeFunctionData } from "viem";
import { useWalletClient } from "wagmi";

export const PlayPauseTickButton = () => {
  const {
    network: { waitForTransaction },
    components: { Ticker },
    systemCalls: { tick },
  } = useMUD();

  const [tickerNewValue, setTickerNewValue] = useState(10n);
  const [isPaused, setIsPaused] = useState<boolean | null>(null);
  const tickerValue = useComponentValue(Ticker, singletonEntity);
  const externalWorldContract = useStore(
    (state) => state.externalWorldContract,
  );

  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (tickerValue && walletClient) {
      setIsPaused(tickerValue.paused);
    }
  }, [tickerValue, walletClient]);

  const handleToggle = async () => {
    if (!walletClient) {
      console.error("No wallet client available");
      return;
    }

    try {
      let receipt;
      if (isPaused) {
        const tx = await externalWorldContract.write.df__unpause([]);
        receipt = await waitForTransaction(tx);
      } else {
        const tx = await externalWorldContract.write.df__pause([]);
        receipt = await waitForTransaction(tx);
      }
      console.log(isPaused ? "Unpaused" : "Paused", receipt);
      setIsPaused(!isPaused);
    } catch (error) {
      console.error("Error toggling pause state:", error);
    }
  };

  const handleSetTick = async () => {
    if (!walletClient) {
      console.error("No wallet client available");
      return;
    }

    try {
      const tx = await externalWorldContract.write.df__updateTickRate([
        tickerNewValue,
      ]);
      const receipt = await waitForTransaction(tx);

      console.log("Tick rate updated:", receipt);
    } catch (error) {
      console.error("Error setting tick rate:", error);
    }
  };

  const handleTick = async () => {
    tick();
  };

  if (isPaused === null) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleToggle}
        className={`rounded-md px-4 py-2 text-white ${
          isPaused
            ? "bg-green-500 hover:bg-green-600"
            : "bg-red-500 hover:bg-red-600"
        }`}
      >
        {isPaused ? "Play" : "Pause"}
      </button>

      <button
        onClick={handleTick}
        className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
      >
        Tick
      </button>

      <input
        type="number"
        id="tickerNewValue"
        value={Number(tickerNewValue)}
        onChange={(e) => setTickerNewValue(BigInt(e.target.value))}
        className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        placeholder="new tick"
      />
      <button
        onClick={handleSetTick}
        className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Set Tick
      </button>
    </div>
  );
};
