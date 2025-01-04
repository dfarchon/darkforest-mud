import type {
  Biome,
  LocationId,
  Planet,
  PlanetLevel,
  PlanetType,
  SpaceType,
  WorldLocation,
} from "@df/types";

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

////////////////////////
/// Planet
///////////////////////

type PlanetState = {
  location: WorldLocation;

  /**
   * Properties Metadata
   * - properties[0] => biome
   * - properties[1] => perlin
   * - properties[2] => planetLevel
   * - properties[3] => planetType
   * - properties[4] => SpaceType
   */
  properties: Uint8Array & { length: 5 };
};

export class PlanetImpl implements Planet {
  #state: PlanetState;

  constructor(state: PlanetState) {
    this.#state = state;
  }

  get locationId() {
    return this.#state.location.hash;
  }

  get biome() {
    return this.#state.properties[0] as Biome;
  }

  get perlin() {
    return this.#state.properties[1];
  }

  get planetLevel() {
    return this.#state.properties[2] as PlanetLevel;
  }

  get planetType() {
    return this.#state.properties[3] as PlanetType;
  }

  get spaceType() {
    return this.#state.properties[4] as SpaceType;
  }
}
