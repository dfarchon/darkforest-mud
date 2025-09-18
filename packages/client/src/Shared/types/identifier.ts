import type { Abstract } from "./utility";

/**
 * a voyage UID. these start at 1 and auto-increment in the contract. this is
 * immutable and the only place a VoyageId should ever be created is on
 * initial deserialization of a QueuedArrival from contract data (see `serde`)
 */
export type VoyageId = Abstract<string, "VoyageId">;

/**
 * a unique identifier for a location in the universe (corresponding to some
 * underlying coordinates (x, y)). This is a 64-character lowercase hex string
 * not prefixed with 0x. LocationIDs should only be instantiated through
 * `locationIdFromHexStr`, `locationIdFromDecStr`, `locationIdFromBigInt`, and
 * `locationIdFromEthersBN` in `serde`.
 */
export type LocationId = Abstract<string, "LocationId">;

/**
 * This is expected to be a 40-character, lowercase hex string, prefixed with 0x
 * (so 42 characters in total). EthAddress should only ever be instantiated
 * through the `address` function in `serde`.
 */
export type EthAddress = Abstract<string, "EthAddress">;

/**
 * A unique identifier for a Dark Forest NFT artifact. This is a 64-character
 * lowercase hex string not prefixed with 0x. ArtifactIDs should only be
 * instantiated through ArtifactIDs should only be instantiated through
 * `artifactIdFromHexStr`, `artifactIdFromDecStr`, and `artifactIdFromEthersBN`
 * in `serde`.
 */
export type ArtifactId = Abstract<string, "ArtifactId">;

/**
 * a guild UID. these start at 1 and auto-increment in the contract. this is
 * immutable and the only place a GuildId should ever be created is on
 * initial deserialization of a Guild from contract data (see `serde`)
 */
export type GuildId = Abstract<number, "GuildId">;

/**
 * A struct describing transfer of a specific material.
 * A unique identifier for a material (uint8 onchain)
 * Matches Solidity struct: { uint8 materialId; uint64 amount; }
 */

export type MaterialId = Abstract<number, "MaterialId">;

/**
 * Amount of material transferred or stored (uint64 onchain)
 */
export type MaterialAmount = Abstract<number, "MaterialAmount">;

export type MaterialTransfer = {
  materialId: MaterialId;
  materialAmount: MaterialAmount;
};
