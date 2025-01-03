import type { LocationId, RevealedLocation, WorldLocation } from "@df/types";

import memo from "./memo";

export function toWorldLocation(location: WorldLocation): WorldLocation {
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

export function getWorldLocation(
  locationId: LocationId,
): WorldLocation | undefined {
  return memo.get(locationId)?.location;
}

export function setWorldLocation(
  locationId: LocationId,
  location: WorldLocation,
) {
  memo.set(locationId, { location: toWorldLocation(location) });
}

export function isRevealedLocation(
  location: WorldLocation | RevealedLocation,
): location is RevealedLocation {
  return (location as RevealedLocation).revealer !== undefined;
}
