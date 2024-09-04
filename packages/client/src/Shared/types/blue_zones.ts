import type { EthAddress, LocationId } from "./identifier";
import type { WorldCoords } from "./world";

export type BlueZone = {
  locationId: LocationId;
  coords: WorldCoords;
  radius: number;
  operator: EthAddress;
};
