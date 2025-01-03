import type {
  EthAddress,
  LocationId,
  RevealedLocation,
  WorldLocation,
} from "@df/types";

import type { PersistedLocation } from "../../_types/darkforest/api/ChunkStoreTypes";

////////////////////////
/// Locations Map
///////////////////////
class LocationsMap {
  #locations = new Map<LocationId, WorldLocation>();

  getWorldLocation(locationId: LocationId): WorldLocation | undefined {
    return this.#locations.get(locationId);
  }

  setWorldLocation(locationId: LocationId, location: WorldLocation) {
    this.#locations.set(locationId, location);
  }
}

export const locationsMap = new LocationsMap();

////////////////////////
/// Revealed locations
///////////////////////

export class LocationsRevealedMap {
  constructor() {
    throw new Error("LocationsMap is a singleton and can't be initialized");
  }

  static #locationsRevealed = new Map<LocationId, EthAddress>();

  static isLocationRevealed(locationId: LocationId): boolean {
    return this.#locationsRevealed.has(locationId);
  }

  static setLocationRevealed(locationId: LocationId, revealer: EthAddress) {
    this.#locationsRevealed.set(locationId, revealer);
  }

  static getLocationRevealed(
    locationId: LocationId,
  ): WorldLocation | undefined {
    if (!this.isLocationRevealed(locationId)) {
      return undefined;
    }

    const location = locationsMap.getWorldLocation(locationId);
    if (!location) {
      console.warn(
        `Could not find stored world location for revealed location: ${locationId}`,
      );
    }

    return location;
  }

  static getLocationsRevealed(): Map<LocationId, EthAddress> {
    return this.#locationsRevealed;
  }
}

////////////////////////
/// Helpers
///////////////////////

export function persistedLocationToWorldLocation(
  persistedLocation: PersistedLocation,
): WorldLocation {
  let worldLocation = locationsMap.getWorldLocation(persistedLocation.h);
  if (!worldLocation) {
    worldLocation = {
      hash: persistedLocation.h,
      coords: {
        x: persistedLocation.x,
        y: persistedLocation.y,
      },
      perlin: persistedLocation.p,
      biomebase: persistedLocation.p,
    };

    locationsMap.setWorldLocation(worldLocation.hash, worldLocation);
  }

  return worldLocation;
}

export function toWorldLocation(
  location: WorldLocation | RevealedLocation,
): WorldLocation {
  let worldLocation = locationsMap.getWorldLocation(location.hash);
  if (!worldLocation) {
    worldLocation = {
      hash: location.hash,
      coords: {
        x: location.coords.x,
        y: location.coords.y,
      },
      perlin: location.perlin,
      biomebase: location.biomebase,
    };

    locationsMap.setWorldLocation(worldLocation.hash, worldLocation);
  }

  // update perlin and biomebase accross all world location references
  // if (update) {
  //   (worldLocation as WorldLocation & { perlin: number }).perlin =
  //     location.perlin;
  //   (worldLocation as WorldLocation & { biomebase: number }).biomebase =
  //     location.biomebase;
  // }

  return worldLocation;
}

export function isRevealedLocationType(
  location: WorldLocation | RevealedLocation | PersistedLocation,
): location is RevealedLocation {
  return (location as RevealedLocation).revealer !== undefined;
}

export function isPersistedLocationType(
  location: WorldLocation | RevealedLocation | PersistedLocation,
): location is PersistedLocation {
  return (location as PersistedLocation).h !== undefined;
}
