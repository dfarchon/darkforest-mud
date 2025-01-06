import type { CoordsId, LocationId, Planet, WorldCoords } from "@df/types";

const coordsToCoordsId = (coords: WorldCoords): CoordsId =>
  `${coords.x},${coords.y}` as CoordsId;

/////////////////////////////
/// Coords To LocationId Map
////////////////////////////
/**
 * A class that maps world coordinates to location IDs using a memoization technique.
 * It maintains an internal map to store the relationship between coordinates and location IDs.
 */
class CoordsToLocationId {
  #memo = new Map<CoordsId, LocationId>();

  /**
   * Retrieves the LocationId for the given coordinates.
   *
   * @param coords - The coordinates of the world.
   * @returns The LocationId associated with the given coordinates, or undefined if not found.
   */
  getLocationId(coords: WorldCoords): LocationId | undefined {
    return this.#memo.get(coordsToCoordsId(coords));
  }

  /**
   * Sets the location ID for the given world coordinates.
   *
   * @param coords - The coordinates of the world location.
   * @param locationId - The ID of the location to set.
   */
  setLocationId(coords: WorldCoords, locationId: LocationId) {
    this.#memo.set(coordsToCoordsId(coords), locationId);
  }

  /**
   * Gets the number of locationsId's stored.
   */
  get size() {
    return this.#memo.size;
  }
}

export const coordsToLocationId = new CoordsToLocationId();

////////////////////////
/// Planets Map
///////////////////////
/**
 * A class that manages a collection of planets mapped by their location IDs.
 */
class PlanetsMap {
  #memo = new Map<LocationId, Planet>();

  /**
   * Retrieves a planet by its location ID.
   * @param locationId - The ID of the location to retrieve the planet from.
   * @returns The planet associated with the given location ID, or `undefined` if not found.
   */
  getPlanet(locationId: LocationId): Planet | undefined {
    return this.#memo.get(locationId);
  }

  /**
   * Adds or updates a planet in the map with the given location ID.
   * @param locationId - The ID of the location to associate with the planet.
   * @param planet - The planet to be added or updated.
   */
  setPlanet(locationId: LocationId, planet: Planet) {
    this.#memo.set(locationId, planet);
  }

  /**
   * Retrieves the entire map of planets.
   */
  getPlanets(): Map<LocationId, Planet> {
    return this.#memo;
  }

  /**
   * Gets the number of planets in the map.
   */
  get size(): number {
    return this.#memo.size;
  }
}

export const planetsMap = new PlanetsMap();
