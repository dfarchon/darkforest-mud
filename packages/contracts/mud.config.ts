import { defineWorld } from "@latticexyz/world";

export default defineWorld({
  namespace: "df",
  enums: {
    PlanetType: ["PLANET", "SILVER_MINE", "RUINS", "TRADING_POST", "SILVER_BANK"],
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
        range: "uint64",
        speed: "uint64",
        defense: "uint64",
        populationCap: "uint64",
        populationGrowth: "uint64",
        silverCap: "uint64",
        silverGrowth: "uint64",
        level: "uint8",
        t: "PlanetType",
      },
      key: ["t", "level"],
    },
    Planet: {
      id: "bytes32",
      owner: "address",
      population: "uint64",
      silver: "uint64",
    },
    Ticker: {
      schema: {
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
