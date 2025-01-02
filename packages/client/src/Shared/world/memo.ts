import type { LocationId, Planet, WorldLocation } from "@df/types";

type MemoItem = [
  Planet | undefined,
  WorldLocation | undefined,
  boolean | undefined,
];

const memo = new Map<LocationId, MemoItem>();

function all(): Iterable<MemoItem> {
  return memo.values();
}

function get(locationId: LocationId): MemoItem | undefined {
  return memo.get(locationId);
}

function set(
  locationId: LocationId,
  values: {
    planet?: Planet;
    location?: WorldLocation;
    touched?: boolean;
  },
) {
  const oldValues = memo.get(locationId);

  // use provided value or default to oldValue/undefined
  const planet = values.planet ?? oldValues?.[0];
  const location = values.location ?? oldValues?.[1];
  const touched = values.touched ?? oldValues?.[2];

  memo.set(locationId, [planet, location, touched]);
}

export default {
  all,
  get,
  set,
};
