import type { LocationId, Planet } from "@df/types";
import type { ClientComponents } from "@mud/createClientComponents";
import bigInt, { BigInteger } from "big-integer";
import { LOCATION_ID_UB } from "@df/constants";

interface PlanetUtilsConfig {
  components: ClientComponents;
}

export class PlanetUtils {
  private components: ClientComponents;

  public constructor({ components }: PlanetUtilsConfig) {
    this.components = components;
  }

  public readPlanet(planetId: LocationId): Planet | undefined {
    return undefined;
  }

  public _validateHash(planet: Planet): boolean {
    const locationBI = bigInt(planet.locationId, 16);
    if (locationBI.geq(LOCATION_ID_UB)) {
      return false;
      // throw new Error("not a valid location");
    }
    return true;
  }

  public _initPlanet(planet: Planet): Planet | undefined {
    return undefined;
  }

  //TODO refer to the implementation logic of src/lib/Planet.sol
}
