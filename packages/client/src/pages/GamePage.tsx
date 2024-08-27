import { useComponentValue } from "@latticexyz/react";
import React, { useState } from "react";

import { singletonEntity } from "@latticexyz/store-sync/recs";

import { useMUD } from "../MUDContext";
import SpawnPlayer from "../components/spawnPlayer-form";
import SyncClientStatusRec from "../components/syncClientStatusRec";

// Adjust the import path as needed

export const GamePage: React.FC = () => {
  const {
    network: { tables, useStore, playerEntity },
    components: { SyncProgress },
  } = useMUD();
  const [name, setName] = useState("");

  const syncProgress = useComponentValue(SyncProgress, singletonEntity, {
    message: "Connecting",
    percentage: 0,
    step: "Initialize",
    latestBlockNumber: 0n,
    lastBlockNumberProcessed: 0n,
  });
  // Todo checking sync progress if huge tables on sync
  console.log(syncProgress);

  // Get the player's data to check if they have spawned a player
  const playerSpawned = useStore((state) => {
    const record = Object.values(state.getRecords(tables.PlayersTable));
    // TODO zustand sync apply !!! this is not optimal for now is avoiding error if zustand not synced

    if (record.length > 0) {
      record.find((pl) => pl.key.owner === playerEntity);

      if (name !== record[0].value.name) {
        setName(record[0].value.name);
      }
    }
    return record.length > 0; // Check if the player has spawned
  });

  return (
    <div>
      {playerSpawned && <div className="m-4 text-center">Player: {name}</div>}
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white">
        {syncProgress.step === "live" ? (
          <div className="text-center">
            <h1 className="text-4xl font-bold">HERE WILL BE MAP</h1>
            {!playerSpawned && (
              <>
                {" "}
                <h1 className="text-4xl font-bold">Welcome to Dark Forest Game</h1> <SpawnPlayer />{" "}
              </>
            )}
          </div>
        ) : (
          <SyncClientStatusRec message={syncProgress.message} percentage={syncProgress.percentage} />
        )}
      </div>
    </div>
  );
};

export default GamePage;
