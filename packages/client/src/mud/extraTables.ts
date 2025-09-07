// copied from latticexyz skystrife
import { resourceToHex } from "@latticexyz/common";
import { defineTable } from "@latticexyz/store/internal";
import type { SyncFilter } from "@latticexyz/store-sync";

export const syncFilters: SyncFilter[] = [
  {
    tableId: resourceToHex({
      type: "table",
      namespace: "atf.1",
      name: "ArtifactMetadata",
    }),
  },
  {
    tableId: resourceToHex({
      type: "table",
      namespace: "atf.4",
      name: "ArtifactMetadata",
    }),
  },
  {
    tableId: resourceToHex({
      type: "table",
      namespace: "atf.5",
      name: "ArtifactMetadata",
    }),
  },
  {
    tableId: resourceToHex({
      type: "table",
      namespace: "atf.6",
      name: "ArtifactMetadata",
    }),
  },
  {
    tableId: resourceToHex({
      type: "table",
      namespace: "atf.3",
      name: "ArtifactMetadata",
    }),
  },
];

export const tables = {
  PinkBombMetadata: defineTable({
    namespace: "atf.1",
    namespaceLabel: "atf.1",
    name: "ArtifactMetadata",
    label: "PinkBombMetadata",
    // tableId: resourceToHex({
    //   type: "table",
    //   namespace: "atf.1",
    //   name: "ArtifactMetadata",
    // }),
    key: ["rarity"],
    schema: {
      rarity: "uint8",
      genre: "uint8",
      charge: "uint32",
      cooldown: "uint32",
      durable: "bool",
      reusable: "bool",
      reqLevel: "uint16",
      reqPopulation: "uint64",
      reqSilver: "uint64",
    },
  }),
  BloomFilterMetadata: defineTable({
    namespace: "atf.4",
    namespaceLabel: "atf.4",
    name: "ArtifactMetadata",
    label: "BloomFilterMetadata",
    // tableId: resourceToHex({
    //   type: "table",
    //   namespace: "atf.4",
    //   name: "ArtifactMetadata",
    // }),
    key: ["rarity"],
    schema: {
      rarity: "uint8",
      genre: "uint8",
      charge: "uint32",
      cooldown: "uint32",
      durable: "bool",
      reusable: "bool",
      reqLevel: "uint16",
      reqPopulation: "uint64",
      reqSilver: "uint64",
    },
  }),
  WormholeMetadata: defineTable({
    namespace: "atf.5",
    namespaceLabel: "atf.5",
    name: "ArtifactMetadata",
    label: "WormholeMetadata",
    // tableId: resourceToHex({
    //   type: "table",
    //   namespace: "atf.5",
    //   name: "ArtifactMetadata",
    // }),
    key: ["rarity"],
    schema: {
      rarity: "uint8",
      genre: "uint8",
      charge: "uint32",
      cooldown: "uint32",
      durable: "bool",
      reusable: "bool",
      reqLevel: "uint16",
      reqPopulation: "uint64",
      reqSilver: "uint64",
    },
  }),
  CannonMetadata: defineTable({
    namespace: "atf.6",
    namespaceLabel: "atf.6",
    name: "ArtifactMetadata",
    label: "CannonMetadata",
    // tableId: resourceToHex({
    //   type: "table",
    //   namespace: "atf.6",
    //   name: "ArtifactMetadata",
    // }),
    key: ["rarity"],
    schema: {
      rarity: "uint8",
      genre: "uint8",
      charge: "uint32",
      cooldown: "uint32",
      durable: "bool",
      reusable: "bool",
      reqLevel: "uint16",
      reqPopulation: "uint64",
      reqSilver: "uint64",
    },
  }),
  SpaceshipMetadata: defineTable({
    namespace: "atf.3",
    namespaceLabel: "atf.3",
    name: "ArtifactMetadata",
    label: "SpaceshipMetadata",
    // tableId: resourceToHex({
    //   type: "table",
    //   namespace: "atf.3",
    //   name: "ArtifactMetadata",
    // }),
    key: ["rarity"],
    schema: {
      rarity: "uint8",
      genre: "uint8",
      charge: "uint32",
      cooldown: "uint32",
      durable: "bool",
      reusable: "bool",
      reqLevel: "uint16",
      reqPopulation: "uint64",
      reqSilver: "uint64",
    },
  }),
  WormholeDest: defineTable({
    namespace: "atf.5",
    namespaceLabel: "atf.5",
    name: "WormholeDest",
    label: "WormholeDest",
    key: ["wormholeId"],
    schema: {
      wormholeId: "uint32",
      to: "bytes32",
    },
  }),
  PinkBomb: defineTable({
    namespace: "atf.1",
    namespaceLabel: "atf.1",
    name: "PinkBomb",
    label: "PinkBomb",
    key: ["bombId"],
    schema: {
      bombId: "uint32",
      target: "bytes32",
      departureTick: "uint64",
      arrivalTick: "uint64",
    },
  }),
};
