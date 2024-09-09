import { useEffect, useState } from "react";
import { useMUD } from "@mud/MUDContext";
import { useComponentValue } from "@latticexyz/react";
import { singletonEntity } from "@latticexyz/store-sync/recs";

export const PlayPauseButton = () => {
  const {
    components: { Ticker },
    systemCalls: { unPause, pause, tick },
  } = useMUD();

  const [isPaused, setIsPaused] = useState<boolean | null>(null);
  const tickerValue = useComponentValue(Ticker, singletonEntity);

  // Fetch the paused status when the component mounts
  useEffect(() => {
    if (tickerValue) {
      setIsPaused(tickerValue.paused);
    }
  }, [tickerValue]);

  const handleToggle = async () => {
    try {
      if (isPaused) {
        await unPause(); // Call the unPause system call
        setIsPaused(false);
      } else {
        await pause(); // Call the pause system call
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
    <div>
      <button
        onClick={handleToggle}
        className={`px-4 py-2 rounded-md text-white ${isPaused
          ? "bg-green-500 hover:bg-green-600"
          : "bg-red-500 hover:bg-red-600"
          }`}
      >
        {isPaused ? "Play" : "Pause"}
      </button>

      <button
        onClick={handleTick}
        className={`px-4 py-2 rounded-md text-white 
            bg-red-500 hover:bg-red-600`}
      >
        Tick
      </button>
    </div>
  );
};
