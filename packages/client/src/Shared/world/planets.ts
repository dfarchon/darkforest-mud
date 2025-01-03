import type { LocationId, Planet } from "@df/types";

////////////////////////
/// Planets Map
///////////////////////
class PlanetsMap {
  #planets = new Map<LocationId, Planet>();

  hasPlanet(locationId: LocationId): boolean {
    return this.#planets.has(locationId);
  }

  getPlanet(locationId: LocationId): Planet | undefined {
    return this.#planets.get(locationId);
  }

  setPlanet(locationId: LocationId, planet: Planet) {
    this.#planets.set(locationId, planet);
  }

  getPlanetMap(): Map<LocationId, Planet> {
    return this.#planets;
  }
}

export const planetsMap = new PlanetsMap();
