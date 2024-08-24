import { useComponentValue } from "@latticexyz/react";
import React from "react";

import { singletonEntity } from "@latticexyz/store-sync/recs";

import { useMUD } from "../MUDContext";
import SyncClientStatus from "../components/syncClientStatus";

// Adjust the import path as needed

export const GamePage: React.FC = () => {
  const {
    components: { SyncProgress },
  } = useMUD();

  const syncProgress = useComponentValue(SyncProgress, singletonEntity, {
    message: "Connecting",
    percentage: 0,
    step: "Initialize",
    latestBlockNumber: 0n,
    lastBlockNumberProcessed: 0n,
  });
  // Todo checking sync progress if huge tables on sync
  console.log(syncProgress);
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white">
      {syncProgress.step === "live" ? (
        <h1 className="text-4xl font-bold">Welcome to Dark Forest Game </h1>
      ) : (
        <SyncClientStatus message={syncProgress.message} percentage={syncProgress.percentage} />
      )}
    </div>
  );
};

export default GamePage;
