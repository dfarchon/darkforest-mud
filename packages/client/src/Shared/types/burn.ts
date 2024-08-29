import type { EthAddress, LocationId } from "./identifier";
import type { WorldCoords, WorldLocation } from "./world";

/**
 * Represents a planet location that has been broadcast on-chain
 */
export type BurnedCoords = WorldCoords & {
  hash: LocationId;
  operator: EthAddress;
};

export type BurnedLocation = WorldLocation & {
  operator: EthAddress;
  radius: number;
};
