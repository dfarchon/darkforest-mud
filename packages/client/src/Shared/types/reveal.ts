import type { EthAddress, LocationId } from "./identifier";
import type { WorldCoords, WorldLocation } from "./world";

/**
 * Represents a planet location that has been broadcast on-chain
 */
export type RevealedCoords = Readonly<{
  hash: LocationId;
  coords: WorldCoords;
  revealer: EthAddress;
}>;

export type RevealedLocation = Readonly<{
  location: WorldLocation;
  revealer: EthAddress;
}>;
