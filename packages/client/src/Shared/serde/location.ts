import { LOCATION_ID_UB } from "@df/constants";
import type { LocationId } from "@df/types";
import bigInt, { type BigInteger } from "big-integer";
import type { BigNumber as EthersBN } from "ethers";

/**
 * Validate a location id whether it's a valid location id.
 *
 * @param location `LocationId` representation of a location ID.
 */
export function validLocationHash(locationId: LocationId): boolean {
  const locationBI = bigInt(locationId, 16);
  return locationBI.lt(LOCATION_ID_UB);
}

/**
 * Converts a BigInteger representation of location ID into a LocationID: a
 * non-0x-prefixed all lowercase hex string of exactly 64 hex characters
 * (0-padded). LocationIDs should only be instantiated through
 * `locationIdFromHexStr`, `locationIdFromDecStr`, `locationIdFromBigInt`, and
 * `locationIdFromEthersBN`.
 *
 * @param location `BigInteger` representation of a location ID.
 */
export function locationIdFromBigInt(location: BigInteger): LocationId {
  if (location.geq(LOCATION_ID_UB)) {
    throw new Error("not a valid location");
  }

  return location.toString(16).toLowerCase().padStart(64, "0") as LocationId;
}

/**
 * Converts a possibly 0x-prefixed string of hex digits to a `LocationId`: a
 * non-0x-prefixed all lowercase hex string of exactly 64 hex characters
 * (0-padded if necessary). LocationIDs should only be instantiated through
 * `locationIdFromHexStr`, `locationIdFromDecStr`, `locationIdFromBigInt`, and
 * `locationIdFromEthersBN`.
 *
 * @param location A possibly 0x-prefixed `string` of hex digits representing a
 * location ID.
 */
export function locationIdFromHexStr(location: string): LocationId {
  return locationIdFromBigInt(
    bigInt(location.startsWith("0x") ? location.slice(2) : location, 16),
  );
}

/**
 * Converts a string representing a decimal number into a LocationID: a
 * non-0x-prefixed all lowercase hex string of exactly 64 hex characters
 * (0-padded if necessary). LocationIDs should only be instantiated through
 * `locationIdFromHexStr`, `locationIdFromDecStr`, `locationIdFromBigInt`, and
 * `locationIdFromEthersBN`.
 *
 * @param location `string` of decimal digits, the base 10 representation of a
 * location ID.
 */
export function locationIdFromDecStr(location: string) {
  return locationIdFromBigInt(bigInt(location));
}

/**
 * Converts a LocationID to a decimal string with the same numerical value; can
 * be used if you need to pass an artifact ID into a web3 call.
 *
 * @param locationId LocationID to convert into a `string` of decimal digits
 */
export function locationIdToDecStr(locationId: LocationId): string {
  return bigInt(locationId, 16).toString(10);
}

/**
 * Converts a LocationID: to 0x-prefixed hex string
 */
export function locationIdToHexStr(locationId: LocationId): string {
  return "0x" + locationId;
}

/**
 * @deprecated Not in use anywhere currently
 *
 * Converts an ethers.js BigNumber (type aliased here as `EthersBN`)
 * representation of a location ID into a LocationID: a non-0x-prefixed all
 * lowercase hex string of exactly 64 hex characters (0-padded). LocationIDs
 * should only be instantiated through `locationIdFromHexStr`,
 * `locationIdFromDecStr`, `locationIdFromBigInt`, and `locationIdFromEthersBN`.
 *
 * @param location ethers.js `BigNumber` representation of a locationID.
 */
export function locationIdFromEthersBN(location: EthersBN): LocationId {
  return locationIdFromDecStr(location.toString());
}
