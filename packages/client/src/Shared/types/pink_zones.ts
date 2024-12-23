import type { ArtifactId, EthAddress, LocationId } from "./identifier";
import type { WorldCoords } from "./world";
export type PinkZone = {
  locationId: LocationId;
  coords: WorldCoords;
  radius: number;
  operator: EthAddress;
  launchTick: number;
  arrivalTick: number;
  launchPlanet: LocationId;
  artifactId: ArtifactId;
};
