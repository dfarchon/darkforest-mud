import { defineWorld } from "@latticexyz/world";

export default defineWorld({
  namespace: "df",
  enums: {
    PlanetType: ["UNKNOWN", "PLANET", "ASTEROID_FIELD", "FOUNDRY", "SPACETIME_RIP", "QUASAR"],
    SpaceType: ["UNKNOWN", "NEBULA", "SPACE", "DEEP_SPACE", "DEAD_SPACE"],
  },
  tables: {
    // todo remove this table and corresponding increment system
    Counter: {
      schema: {
        value: "uint32",
      },
      key: [],
    },
    TempConfigSet: {
      schema: {
        biomeCheck: "bool",
        skipProofCheck: "bool",
      },
      key: [],
    },
    UniverseConfig: {
      schema: {
        sparsity: "uint64",
        radius: "uint64",
      },
      key: [],
    },
    SpaceTypeConfig: {
      schema: {
        perlinThresholds: "uint32[]",
        planetLevelLimits: "uint8[]",
        planetLevelBonus: "int8[]",
      },
      key: [],
    },
    UniverseZoneConfig: {
      schema: {
        borders: "uint64[]",
        planetLevelLimits: "uint8[]",
        planetLevelBonus: "int8[]",
      },
      key: [],
    },
    PlanetLevelConfig: {
      schema: {
        // default level is 0
        // 9 elements indicates 9 levels, from level 1 to level 9
        // ex: [100, 500, 4000, 8000, 30000, 65520, 262128, 1048561, 4194292]
        thresholds: "uint32[]",
      },
      key: [],
    },
    PlanetTypeConfig: {
      schema: {
        spaceType: "SpaceType",
        level: "uint8",
        // length = number of planet types. ex: [253, 0, 2, 0, 1]
        // 253 PLANET, 0 ASTEROID_FIELD, 2 FOUNDRY, 0 SPACETIME_RIP, 1 QUASAR
        thresholds: "uint8[]",
      },
      key: ["spaceType", "level"],
    },
    SnarkConfig: {
      schema: {
        planetHashKey: "uint64",
        biomeBaseKey: "uint64",
        spaceTypeKey: "uint64",
        perlinLengthScale: "uint64",
        // use 1 instead of true
        perlinMirrorX: "uint8",
        // use 1 instead of true
        perlinMirrorY: "uint8",
      },
      key: []
    },
    PlanetMetadata: {
      schema: {
        range: "uint32",
        speed: "uint32",
        defense: "uint32",
        populationCap: "uint64",
        populationGrowth: "uint64",
        silverCap: "uint64",
        silverGrowth: "uint64",
        level: "uint8",
        planetType: "PlanetType",
        spaceType: "SpaceType",
      },
      key: ["spaceType", "planetType", "level"],
    },
    PlanetInitialValue: {
      schema: {
        silver: "uint64",
        population: "uint64",
        level: "uint8",
        planetType: "PlanetType",
        spaceType: "SpaceType",
      },
      key: ["spaceType", "planetType", "level"],
    },
    Planet: {
      id: "bytes32",
      lastUpdateTick: "uint96",
      perlin: "uint8", // not sure if this suffices
      level: "uint8",
      planetType: "PlanetType",
      spaceType: "SpaceType",
      population: "uint64",
      silver: "uint64",
    },
    PlanetOwner: "address",
    Ticker: {
      schema: {
        tickNumber: "uint96",
        tickRate: "uint64", // per block
        blockNumber: "uint64",
        paused: "bool",
      },
      key: [],
    },
    InnerCircle: {
      schema: {
        radius: "uint64",
        speed: "uint64",
      },
      key: [],
    }
  },
});
