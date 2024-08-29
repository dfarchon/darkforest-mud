import type { EthAddress, LocationId } from "./identifier";
import type { WorldCoords } from "./world";
export type PinkZone = {
  locationId: LocationId;
  coords: WorldCoords;
  radius: number;
  operator: EthAddress;
};
