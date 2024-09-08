/*
 * Create the system calls that the client can use to ask
 * for changes in the World state (using the System contracts).
 */

import { Entity, getComponentValue } from "@latticexyz/recs";
import { ClientComponents } from "./createClientComponents";
import { SetupNetworkResult } from "./setupNetwork";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { Address } from "viem";
import { address } from "@df/serde/address";
import bigInt from "big-integer";
import { BigNumberish } from "ethers";

export type SystemCalls = ReturnType<typeof createSystemCalls>;
interface Proof {
  A: { X: bigint; Y: bigint };
  B: { X: readonly [bigint, bigint]; Y: readonly [bigint, bigint] };
  C: { X: bigint; Y: bigint };
}

interface MoveInput {
  fromPlanetHash: bigint;
  toPlanetHash: bigint;
  toPerlin: bigint;
  universeRadius: bigint;
  distance: bigint;
  mimcHashKey: bigint;
  spaceTypeKey: bigint;
  perlinLengthScale: bigint;
  perlinMirrorX: bigint;
  perlinMirrorY: bigint;
  toRadiusSquare: bigint;
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

  // Admin functions : Todo on the end decide how it will be use
  // create control page for admin?

  // GAME MANAGER
  // unPause function call for game contract
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

  // pause function call for game contract
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

  // tick function call for game contract
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

  // ADMIN Planets calls

  // Create planet
  const createPlanet = async (
    planetHash: bigint,
    owner: string,
    perlin: number,
    level: number,
    planetType: PlanetType,
    spaceType: SpaceType,
    population: number,
    silver: number,
    upgrade: number,
  ): Promise<void> => {
    try {
      // Call the createPlanet function on the contract

      console.log("PlanetHash:", BigInt(planetHash));

      const tx = await worldContract.write.df__createPlanet([
        planetHash,
        owner as `0x${string}`,
        perlin,
        level,
        planetType,
        spaceType,
        BigInt(population),
        BigInt(silver),
        upgrade, //TODO add upgrade input
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
  //
  // PLAYER CALLS
  //
  // Basic mint player to enter the game - TODO be as ERC20?
  const mintPlayer = async (name: string, linked: Address) => {
    const tx = await worldContract.write.df__mintPlayer([name, linked]);

    await waitForTransaction(tx);
    return getComponentValue(PlayersTable, singletonEntity);
  };

  const planetUpgrade = async (
    planetHash: bigint,
    rangeUpgrades: number,
    speedUpgrades: number,
    defenseUpgrades: number,
  ): Promise<void> => {
    try {
      // Call the upgradePlanet function on the contract
      const upgrade = `0x${rangeUpgrades}${speedUpgrades}${defenseUpgrades}`;
      const tx = await worldContract.write.df__upgradePlanet([
        planetHash,
        BigInt(rangeUpgrades),
        BigInt(speedUpgrades),
        BigInt(defenseUpgrades),
      ]);

      // Wait for the transaction to be confirmed
      const receipt = await waitForTransaction(tx as `0x${string}`);

      // Log the receipt or trigger additional actions, e.g., update game state
      console.log("Planet upgraded successfully:", receipt);
      getComponentValue(Planet, singletonEntity);
    } catch (error) {
      console.error("Upgrade planet transaction failed:", error);
      throw error; // Re-throw error to handle it higher up if needed
    }
  };

  // Todo types!!
  const move = async (
    proof: Proof,
    moveInput: MoveInput,
    population: bigint,
    silver: bigint,
    artifact: bigint,
  ): Promise<bigint> => {
    try {
      // Call the move function on the contract
      const tx = await worldContract.write.df__move([
        proof,
        moveInput,
        population,
        silver,
        artifact,
      ]);
      const receipt = await waitForTransaction(tx);

      console.log("Move created successfully:", receipt);
      getComponentValue(Move, singletonEntity);
      return BigInt(0);
    } catch (error) {
      console.error("Move transaction failed:", error);
      throw error;
    }
  };
  // Player Read
  // Basic read function
  const readPlanetWithHash = async (planetHash: bigint): Promise<void> => {
    try {
      // Call the readPlanet function on the contract with only planetHash
      const planet = await worldContract.read.df__readPlanet([planetHash]);
      const receipt = await waitForTransaction(planet);
      // Log the planet details or trigger additional actions, e.g., update game state
      console.log("Planet Details (Hash):", planet);
      console.log("Planet Details (Hash) receipt:", receipt);
      getComponentValue(Planet, singletonEntity);
      // Optionally trigger updates or use the planet data for further actions
    } catch (error) {
      console.error("Error reading planet with hash:", error);
      throw error; // Re-throw error to handle it higher up if needed
    }
  };

  const readPlanetWithHashPerlinDistance = async (
    planetHash: bigint,
    perlin: bigint,
    distanceSquare: bigint,
  ): Promise<void> => {
    try {
      // Call the readPlanet function on the contract with planetHash, perlin, and distanceSquare
      const planet = await worldContract.read.df__readPlanet([
        planetHash,
        perlin,
        distanceSquare,
      ]);

      // Log the planet details or trigger additional actions, e.g., update game state

      console.log("Planet Details (Hash, Perlin, Distance):", planet);

      getComponentValue(Planet, singletonEntity);

      return planet;
      // Optionally trigger updates or use the planet data for further actions
    } catch (error) {
      console.error(
        "Error reading planet with hash, perlin, and distance:",
        error,
      );
      throw error; // Re-throw error to handle it higher up if needed
    }
  };

  // VERIFICATIONS FUNCTIONS
  const verifyInitProof = async (
    a: BigInt[],
    b: BigInt[][],
    c: BigInt[],
    input: BigInt[],
  ): Promise<`0x${string}`> => {
    try {
      const result = await worldContract.write.df__verifyInitProof(
        a,
        b,
        c,
        input,
      );
      return result;
    } catch (error) {
      console.error("Error in df__verifyInitProof:", error);
      throw error;
    }
  };

  const verifyMoveProof = async (
    proof: { a: BigInt[]; b: BigInt[][]; c: BigInt[] },
    moveInput: { [key: string]: BigInt },
  ): Promise<`0x${string}`> => {
    try {
      const result = await worldContract.write.df__verifyMoveProof(
        proof,
        moveInput,
      );
      return result;
    } catch (error) {
      console.error("Error in df__verifyMoveProof:", error);
      throw error;
    }
  };

  const verifyBiomebaseProof = async (
    a: BigInt[],
    b: BigInt[][],
    c: BigInt[],
    input: BigInt[],
  ): Promise<`0x${string}`> => {
    try {
      const result = await worldContract.write.df__verifyBiomebaseProof(
        a,
        b,
        c,
        input,
      );
      return result;
    } catch (error) {
      console.error("Error in df__verifyBiomebaseProof:", error);
      throw error;
    }
  };

  const verifyRevealProof = async (
    a: BigInt[],
    b: BigInt[][],
    c: BigInt[],
    input: BigInt[],
  ): Promise<`0x${string}`> => {
    try {
      const result = await worldContract.write.df__verifyRevealProof(
        a,
        b,
        c,
        input,
      );
      return result;
    } catch (error) {
      console.error("Error in df__verifyRevealProof:", error);
      throw error;
    }
  };

  const verifyWhitelistProof = async (
    a: BigInt[],
    b: BigInt[][],
    c: BigInt[],
    input: BigInt[],
  ): Promise<`0x${string}`> => {
    try {
      const result = await worldContract.write.df__verifyWhitelistProof(
        a,
        b,
        c,
        input,
      );
      return result;
    } catch (error) {
      console.error("Error in df__verifyWhitelistProof:", error);
      throw error;
    }
  };

  // do not forget init function calls to be accessable in MUD systems calls
  return {
    mintPlayer,
    createPlanet,
    move,
    unPause,
    pause,
    tick,
    planetUpgrade,
    verifyInitProof,
    verifyMoveProof,
    verifyBiomebaseProof,
    verifyRevealProof,
    verifyWhitelistProof,
    readPlanetWithHash,
    readPlanetWithHashPerlinDistance,
  };
}
