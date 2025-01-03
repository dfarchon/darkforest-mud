import type { LocationId, WorldCoords } from "@df/types";
export class WorldCoordsMap {
  constructor() {
    throw new Error("WorldCoordsMap is a singleton and can't be initialized");
  }

  static #coordsToLocationId = new Map<number, LocationId>();

  static coordsToKey(coords: WorldCoords): number {
    return coords.x * 300_001 + coords.y;
  }

  static setCoordsToLocationId(coords: WorldCoords, location: LocationId) {
    const key = this.coordsToKey(coords);
    this.#coordsToLocationId.set(key, location);
  }

  static getCoordsToLocationId(coords: WorldCoords): LocationId | undefined {
    const key = this.coordsToKey(coords);
    return this.#coordsToLocationId.get(key);
  }
}
