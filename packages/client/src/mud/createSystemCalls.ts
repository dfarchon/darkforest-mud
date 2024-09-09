/*
 * Create the system calls that the client can use to ask
 * for changes in the World state (using the System contracts).
 */

import { getComponentValue } from "@latticexyz/recs";
import { ClientComponents } from "./createClientComponents";
import { SetupNetworkResult } from "./setupNetwork";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { Address } from "viem";

export type SystemCalls = ReturnType<typeof createSystemCalls>;
interface Proof {
  // Your proof structure here
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
  input: string[];
}

interface MoveInput {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isTeleport: boolean;
  isAttack: boolean;
}

// PlanetType Enum
export enum PlanetType {
  PLANET = 0,
  ASTEROID_FIELD = 1,
  FOUNDRY = 2,
  SPACETIME_RIP = 3,
  QUASAR = 4,
}

// SpaceType Enum
export enum SpaceType {
  NEBULA = 0,
  SPACE = 1,
  DEEP_SPACE = 2,
  DEAD_SPACE = 3,
}

export function createSystemCalls(
  /*
   * The parameter list informs TypeScript that:
   *
   * - The first parameter is expected to be a
   *   SetupNetworkResult, as defined in setupNetwork.ts
   *
   *   Out of this parameter, we only care about two fields:
   *   - worldContract (which comes from getContract, see
   *     https://github.com/latticexyz/mud/blob/main/templates/react/packages/client/src/mud/setupNetwork.ts#L63-L69).
   *
   *   - waitForTransaction (which comes from syncToRecs, see
   *     https://github.com/latticexyz/mud/blob/main/templates/react/packages/client/src/mud/setupNetwork.ts#L77-L83).
   *
   * - From the second parameter, which is a ClientComponent,
   *   we only care about Counter. This parameter comes to use
   *   through createClientComponents.ts, but it originates in
   *   syncToRecs
   *   (https://github.com/latticexyz/mud/blob/main/templates/react/packages/client/src/mud/setupNetwork.ts#L77-L83).
   */
  { worldContract, waitForTransaction }: SetupNetworkResult,
  { PlayersTable, Move, Planet, Ticker }: ClientComponents,
) {
  // const increment = async () => {
  //   /*
  //    * Because IncrementSystem
  //    * (https://mud.dev/templates/typescript/contracts#incrementsystemsol)
  //    * is in the root namespace, `.increment` can be called directly
  //    * on the World contract.
  //    */
  //   const tx = await worldContract.write.df__increment();
  //   await waitForTransaction(tx);
  //   return getComponentValue(Counter, singletonEntity);
  // };

  const mintPlayer = async (name: string, linked: Address) => {
    const tx = await worldContract.write.df__mintPlayer([name, linked]);

    await waitForTransaction(tx);
    return getComponentValue(PlayersTable, singletonEntity);
  };

  const createPlanet = async (
    planetHash: string,
    owner: string,
    perlin: number,
    level: number,
    planetType: PlanetType,
    spaceType: SpaceType,
    population: number,
    silver: number
  ): Promise<void> => {
    try {
      // Call the createPlanet function on the contract
      const tx = await worldContract.write.df__createPlanet([
        // @ts-expect-error will be fixed in 9stx6/main-Iworld merge
        planetHash,
        owner as `0x${string}`,
        perlin,
        level,
        planetType,
        spaceType,
        BigInt(population),
        BigInt(silver),
        0, //TODO add upgrade input
      ]);
      // Wait for the transaction to be confirmed
      const receipt = await waitForTransaction(tx as `0x${string}`);

      // Log the receipt or trigger additional actions, e.g., update game state
      console.log("Planet created successfully:", receipt);
      getComponentValue(Planet, singletonEntity);
    } catch (error) {
      console.error("Create planet transaction failed:", error);
      throw error; // Re-throw error to handle it higher up if needed
    }
  };

  const move = async (
    proof: Proof,
    moveInput: MoveInput,
    population: number,
    silver: number,
    artifact: number
  ): Promise<number> => {
    try {
      // Call the move function on the contract
      const tx = await worldContract.write.df__move({
        // @ts-expect-error needs to be fixed wrong type
        proof,
        moveInput,
        population,
        silver,
        artifact,
      });
      const receipt = await waitForTransaction(tx);

      console.log("Move created successfully:", receipt);
      getComponentValue(Move, singletonEntity);
      return 0;
    } catch (error) {
      console.error("Move transaction failed:", error);
      throw error;
    }
  };

  const unPause = async () => {
    try {
      const tx = await worldContract.write.df__unpause();
      const receipt = await waitForTransaction(tx as `0x${string}`);

      // Log the receipt or trigger additional actions, e.g., update game state
      console.log("UnPaused:", receipt);
      getComponentValue(Ticker, singletonEntity);
    } catch (error) {
      console.error("Create UnPaused:", error);
      throw error; // Re-throw error to handle it higher up if needed
    }
  };

  const pause = async () => {
    try {
      const tx = await worldContract.write.df__pause();
      const receipt = await waitForTransaction(tx as `0x${string}`);
      // Log the receipt or trigger additional actions, e.g., update game state
      console.log("Paused:", receipt);
      getComponentValue(Ticker, singletonEntity);
    } catch (error) {
      console.error("Create Paused:", error);
      throw error; // Re-throw error to handle it higher up if needed
    }
  };

  const tick = async () => {
    try {
      const tx = await worldContract.write.df__tick();
      const receipt = await waitForTransaction(tx as `0x${string}`);
      // Log the receipt or trigger additional actions, e.g., update game state
      console.log("Tick:", receipt);
      getComponentValue(Ticker, singletonEntity);
    } catch (error) {
      console.error("Create Paused:", error);
      throw error; // Re-throw error to handle it higher up if needed
    }
  };

  return {
    mintPlayer,
    createPlanet,
    move,
    unPause,
    pause,
    tick,
  };
}
