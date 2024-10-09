import { useStore } from "@hooks/useStore";
import { useComponentValue } from "@latticexyz/react";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { useMUD } from "@mud/MUDContext";
import { useEffect, useState } from "react";

export const PlayPauseTickButton = () => {
  const {
    network: { waitForTransaction },
    components: { Ticker },
    systemCalls: { unPause, pause, tick },
  } = useMUD();

  const externalWorldContract = useStore(
    (state) => state.externalWorldContract,
  );

  const [isPaused, setIsPaused] = useState<boolean | null>(null);
  const tickerValue = useComponentValue(Ticker, singletonEntity);

  // Fetch the paused status when the component mounts
  useEffect(() => {
    if (tickerValue) {
      setIsPaused(tickerValue.paused);
    }
  }, [tickerValue]);

  const handleToggle = async () => {
    if (!externalWorldContract) {
      console.error("No wallet client available");
      return;
    }

    try {
      if (isPaused) {
        const tx = await externalWorldContract.write.df__unpause();
        const receipt = await waitForTransaction(tx as `0x${string}`);
        console.log("UnPaused:", receipt);
        setIsPaused(false);
      } else {
        const tx = await externalWorldContract.write.df__pause();
        const receipt = await waitForTransaction(tx as `0x${string}`);
        console.log("Paused:", receipt);
        setIsPaused(true);
      }
    } catch (error) {
      console.error("Error toggling pause state:", error);
    }
  };

  if (isPaused === null) {
    // Loading state or placeholder
    return <div>Loading...</div>;
  }

  const handleTick = async () => {
    tick();
  };
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
        className={`rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600`}
      >
        Tick
      </button>
    </div>
  );
};
