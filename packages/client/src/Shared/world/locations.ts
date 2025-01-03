import type {
  EthAddress,
  LocationId,
  RevealedLocation,
  WorldLocation,
} from "@df/types";

////////////////////////
/// Locations Map
///////////////////////
export class LocationsMap {
  constructor() {
    throw new Error("LocationsMap is a singleton and can't be initialized");
  }

  static #locations = new Map<LocationId, WorldLocation>();

  static getWorldLocation(locationId: LocationId): WorldLocation | undefined {
    return this.#locations.get(locationId);
  }

  static setWorldLocation(locationId: LocationId, location: WorldLocation) {
    this.#locations.set(locationId, toWorldLocation(location));
  }
}

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

    const location = LocationsMap.getWorldLocation(locationId);
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

export function toWorldLocation(
  location: WorldLocation | RevealedLocation,
): WorldLocation {
  return {
    hash: location.hash,
    coords: {
      x: location.coords.x,
      y: location.coords.y,
    },
    perlin: location.perlin,
    biomebase: location.biomebase,
  };
}

export function isRevealedLocationType(
  location: WorldLocation | RevealedLocation,
): location is RevealedLocation {
  return (location as RevealedLocation).revealer !== undefined;
}
