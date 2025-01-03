import type { LocationId, WorldCoords } from "@df/types";

const coordsToLocationId = new Map<number, LocationId>();

export function coordsToKey(coords: WorldCoords): number {
  return coords.x * 300_001 + coords.y;
}

export function setCoordsToLocationId(
  coords: WorldCoords,
  location: LocationId,
) {
  const key = coordsToKey(coords);
  coordsToLocationId.set(key, location);
}

export function getCoordsToLocationId(
  coords: WorldCoords,
): LocationId | undefined {
  const key = coordsToKey(coords);
  return coordsToLocationId.get(key);
}
