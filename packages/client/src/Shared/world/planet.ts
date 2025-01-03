import type { LocationId, Planet } from "@df/types";

const memo = new Map<LocationId, Planet>();

export function hasPlanet(locationId: LocationId): boolean {
  return getPlanet(locationId) !== undefined;
}

export function getPlanet(locationId: LocationId): Planet | undefined {
  return memo.get(locationId);
}

export function setPlanet(locationId: LocationId, planet: Planet) {
  memo.set(locationId, planet);
}

export function getPlanetMap(): Map<LocationId, Planet> {
  return memo;
}
