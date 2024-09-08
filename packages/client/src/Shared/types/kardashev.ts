import type { EthAddress, LocationId } from "./identifier";
import type { WorldCoords, WorldLocation } from "./world";

/**
 * Represents a planet location that has been broadcast on-chain
 */
export type KardashevCoords = WorldCoords & {
  hash: LocationId;
  operator: EthAddress;
};

export type KardashevLocation = WorldLocation & {
  operator: EthAddress;
  radius: number;
};
