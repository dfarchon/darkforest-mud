// import { useComponentValue } from "@latticexyz/react";
// import { singletonEntity } from "@latticexyz/store-sync/recs";
import { useMUD } from "@mud/MUDContext";
import SpawnPlayer from "@wallet/Components/SpawnPlayerPane";
import SyncClientStatusRec from "@wallet/Components/SyncClientStatusRec";
import WalletButton from "@wallet/WalletButton";
import React, { useState } from "react";
import { useAccount } from "wagmi";

export function entityToAddress(entity: string): string {
  return entity.slice(0, 2) + entity.slice(26);
}

// Adjust the import path as needed
export const GamePage: React.FC = () => {
  const {
    // @ts-expect-error unused playerEntity
    network: { tables, useStore, playerEntity },
    // @ts-expect-error unused SyncProgress
    components: { SyncProgress },
  } = useMUD();
  const [name, setName] = useState("");
  // Zustand useStore state usage
  const syncProgress = useStore((state) => state.syncProgress);
  const { isConnected, address } = useAccount();

  // const syncProgress = useComponentValue(SyncProgress, singletonEntity, {
  //   message: "Connecting",
  //   percentage: 0,
  //   step: "Initialize",
  //   latestBlockNumber: 0n,
  //   lastBlockNumberProcessed: 0n,
  // });
  // Todo checking sync progress if huge tables on sync
  console.log(syncProgress);

  // Get the player's data to check if they have spawned a player
  const playerSpawned = useStore((state) => {
    const records = Object.values(state.getRecords(tables.Player));
    // TODO zustand sync apply !!! this is not optimal for now is avoiding error if zustand not synced

    if (records.length > 0) {
      const record = records.filter((pl) => pl.fields.owner === address);

      if (record.length > 0) {
        if (name !== record[0].value.name) {
          setName(record[0].value.name);
        }
      }
      return record.length > 0; // Check if the player has spawned
    }
  });

  return (
    <div>
      <WalletButton />
      {isConnected && playerSpawned && (
        <>
          {" "}
          <div className="fixed left-1/2 top-4 -translate-x-1/2 transform text-center">
            Player: {name}
          </div>
          <div className="flex items-center justify-center bg-gray-900 text-white">
            {" "}
            <h1 className="text-4xl font-bold">HERE WILL BE MAP</h1>
          </div>
        </>
      )}
      <div className="flex items-center justify-center bg-gray-900 text-white">
        {syncProgress.step === "live" ? (
          <div className="text-center">
            {isConnected && !playerSpawned && (
              <>
                {" "}
                <h1 className="text-4xl font-bold">
                  Welcome to Dark Forest Game
                </h1>{" "}
                <SpawnPlayer />{" "}
              </>
            )}
          </div>
        ) : (
          <SyncClientStatusRec
            message={syncProgress.message}
            percentage={syncProgress.percentage}
          />
        )}
      </div>
    </div>
  );
};

export default GamePage;
