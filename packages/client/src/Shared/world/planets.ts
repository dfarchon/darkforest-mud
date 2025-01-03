import type { LocationId, Planet } from "@df/types";

export class PlanetsMap {
  constructor() {
    throw new Error("PlanetsMap is a singleton and can't be initialized");
  }

  static #planets = new Map<LocationId, Planet>();

  static hasPlanet(locationId: LocationId): boolean {
    return this.#planets.has(locationId);
  }

  static getPlanet(locationId: LocationId): Planet | undefined {
    return this.#planets.get(locationId);
  }

  static setPlanet(locationId: LocationId, planet: Planet) {
    this.#planets.set(locationId, planet);
  }

  static getPlanetMap(): Map<LocationId, Planet> {
    return this.#planets;
  }
}
