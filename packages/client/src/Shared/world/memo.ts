import type { LocationId, Planet, WorldLocation } from "@df/types";

type MemoItem = {
  planet: Planet;
  location: WorldLocation;
};

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
  const item = memo.get(locationId) ?? ({} as MemoItem);

  // use provided value or default to previous values / undefined
  item.planet = values.planet ?? item.planet;
  item.location = values.location ?? item.location;

  memo.set(locationId, item);
}

export default {
  all,
  get,
  set,
};
