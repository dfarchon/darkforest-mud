import { locationIdToHexStr } from "@df/serde";
import type { QueuedArrival } from "@df/types";
import { useUIManager } from "@frontend/Utils/AppHooks";
import { getComponentValue } from "@latticexyz/recs";
import { encodeEntity } from "@latticexyz/store-sync/recs";
import { useMUD } from "@mud/MUDContext";
import { useCallback } from "react";

/**
 * Hook for handling move revert functionality
 */
export function useMoveRevert() {
  const { systemCalls, components } = useMUD();
  const gameUIManager = useUIManager();

  // Helper function to find the move index for a specific voyage
  const findMoveIndex = useCallback(
    (voyage: QueuedArrival): number => {
      const { Move, PendingMove } = components;

      // Get the pending move data for the destination planet
      const pendingMoveEntity = encodeEntity(PendingMove.metadata.keySchema, {
        to: locationIdToHexStr(voyage.toPlanet) as `0x${string}`,
      });

      const pendingMove = getComponentValue(PendingMove, pendingMoveEntity);
      if (!pendingMove) {
        return -1;
      }

      // Extract indexes from the pending move data
      const indexes = Array(30).fill(0);
      let indexesBigInt = pendingMove.indexes;
      for (let i = 29; i >= 0; i--) {
        indexes[i] = indexesBigInt % 256n;
        indexesBigInt = indexesBigInt / 256n;
      }

      // Search through the move queue to find the matching move
      for (
        let i = pendingMove.head;
        i < pendingMove.head + pendingMove.number;
        i++
      ) {
        const moveEntity = encodeEntity(Move.metadata.keySchema, {
          to: locationIdToHexStr(voyage.toPlanet) as `0x${string}`,
          index: indexes[i % 30],
        });

        const move = getComponentValue(Move, moveEntity);

        if (move && move.id.toString() === voyage.eventId) {
          return indexes[i % 30];
        }
      }

      return -1;
    },
    [components],
  );

  const canRevertMove = useCallback(
    (voyage: QueuedArrival): boolean => {
      // Check if the voyage is owned by the current player
      const isMyVoyage =
        voyage.player === gameUIManager.getAccount() ||
        gameUIManager.getArtifactWithId(voyage.artifactId)?.controller ===
          gameUIManager.getPlayer()?.address;

      if (!isMyVoyage) {
        return false;
      }

      // Check if the original source planet is still owned by the player
      const sourcePlanet = gameUIManager.getPlanetWithId(voyage.fromPlanet);

      if (!sourcePlanet || sourcePlanet.owner !== gameUIManager.getAccount()) {
        return false;
      }

      // Check if the voyage is within the first half of its journey
      const currentTime = Date.now();
      const departureTime = gameUIManager.convertTickToMs(voyage.departureTick);
      const arrivalTime = gameUIManager.convertTickToMs(voyage.arrivalTick);

      const totalJourneyTime = arrivalTime - departureTime;
      const elapsedTime = currentTime - departureTime;

      const isInFirstHalf = elapsedTime < totalJourneyTime / 2;

      // Allow revert only if less than half the journey is completed
      return isInFirstHalf;
    },
    [gameUIManager],
  );

  const revertMove = useCallback(
    async (voyage: QueuedArrival): Promise<void> => {
      if (!canRevertMove(voyage)) {
        throw new Error("Cannot revert this move");
      }

      // Find the move index for this voyage
      const moveIndex = findMoveIndex(voyage);

      if (moveIndex === -1) {
        throw new Error("Move not found in destination planet's queue");
      }

      // Call the revertMove system function
      // This will reverse the direction, set travel time to elapsed time,
      // and reduce resources by 50%
      // Convert planet hash to proper bytes32 format
      const toPlanetHash = voyage.toPlanet.startsWith("0x")
        ? voyage.toPlanet
        : "0x" + voyage.toPlanet;

      await systemCalls.revertMove(
        BigInt(voyage.eventId), // moveId (uint64)
        toPlanetHash as `0x${string}`, // toPlanetHash (bytes32)
        moveIndex, // moveIndex (uint8)
      );
    },
    [systemCalls, canRevertMove, findMoveIndex],
  );

  return {
    canRevertMove,
    revertMove,
  };
}
