import type { LocationId, WorldLocation } from "@df/types";

import type { PersistedLocation } from "../../_types/darkforest/api/ChunkStoreTypes";

////////////////////////
/// Locations Map
///////////////////////
/**
 * @deprecated Will be removed
 * A class that manages a memoized location Map, mapping locationId to WorldLocation.
 *
 * Maps from location id (unique id of each planet) to some information about the location at which
 * the planet is located, if we happen to know the coordinates of the given locationId.
 */
class LocationsMap {
  #locations = new Map<LocationId, WorldLocation>();

  /**
   * Retrieves a world location by its ID.
   * @param locationId - The ID of the location to retrieve.
   * @returns The world location associated with the given ID, or undefined if not found.
   */
  getWorldLocation(locationId: LocationId): WorldLocation | undefined {
    return this.#locations.get(locationId);
  }

  /**
   * Sets a world location for a given ID.
   * @param locationId - The ID of the location to set.
   * @param location - The world location to associate with the given location ID.
   */
  setWorldLocation(locationId: LocationId, location: WorldLocation): void {
    this.#locations.set(locationId, location);
  }

  /**
   * Get the size of the locations map
   */
  get size() {
    return this.#locations.size;
  }

  /**
   * Get iterator for locationId to WorldLocation
   */
  entries(): MapIterator<[LocationId, WorldLocation]> {
    return this.#locations.entries();
  }
}

/** @deprecated will be removed in the future */
export const locationsMap = new LocationsMap();

////////////////////////
/// Helpers
///////////////////////

/**
 * @deprecated Will be removed
 * Converts a persisted location into a world location if it has not already been added to the
 * locations map.
 *
 * This function ensures that each location is only added once to the locations map. If the location
 * is already present, it returns the existing reference. If not, it adds the location to the map and
 * then returns the reference.
 *
 * The function will return an immutable world location reference. This means that once a location
 * is added to the map, any code that references a world location by the given location id hash will
 * always get the same reference. This helps maintain consistency and prevents duplication.
 *
 * @param persistedLocation The persisted location to transform
 * @returns The immutable World Location reference
 */
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

/**
 * @deprecated Will be removed
 * Converts a location into a world location if it has not already been added to the
 * locations map.
 *
 * This function ensures that each location is only added once to the locations map. If the location
 * is already present, it returns the existing reference. If not, it adds the location to the map and
 * then returns the reference.
 *
 * The function will return an immutable world location reference. This means that once a location
 * is added to the map, any code that references a world location by the given location id hash will
 * always get the same reference. This helps maintain consistency and prevents duplication.
 *
 * @param location The location to transform
 * @returns The immutable World Location reference
 */
export function toWorldLocation(location: WorldLocation): WorldLocation {
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

  return worldLocation;
}
