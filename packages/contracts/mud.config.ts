import { defineWorld } from "@latticexyz/world";

export default defineWorld({
  namespace: "df",
  enums: {
    PlanetType: ["UNKNOWN", "PLANET", "ASTEROID_FIELD", "FOUNDRY", "SPACETIME_RIP", "QUASAR"],
    SpaceType: ["UNKNOWN", "NEBULA", "SPACE", "DEEP_SPACE", "DEAD_SPACE"],
  },
  systems: {
    TickSystem: {
      openAccess: true,
    },
    InitializeSystem: {
      openAccess: false,
    },
    TestOnlySystem: {
      openAccess: true,
    },
    DfDelegationControlSystem: {
      name: "DfDelegationCtrl",
    },
  },
  tables: {
    Counter: {
      schema: {
        player: "uint64",
      },
      key: [],
    },
    Player: {
      schema: {
        owner: "address",
        burner: "address",
        index: "uint32",
        createdAt: "uint64",
        name: "string",
      },
      key: ["owner"],
    },
    BurnerToPlayer: "address",
    NameToPlayer: "address",
    SpawnPlanet: {
      schema: {
        player: "address",
        planet: "uint256",
      },
      key: ["player"],
    },
    TempConfigSet: {
      schema: {
        biomeCheck: "bool",
        skipProofCheck: "bool",
        playerLimit: "uint32",
        spawnPerlinMin: "uint8",
        spawnPerlinMax: "uint8",
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
        thresholds: "uint16[]",
      },
      key: ["spaceType", "level"],
    },
    UpgradeConfig: {
      schema: {
        populationCapMultiplier: "uint8",
        populationGrowthMultiplier: "uint8",
        rangeMultiplier: "uint8",
        speedMultiplier: "uint8",
        defenseMultiplier: "uint8",
        maxSingleLevel: "uint8",
        maxTotalLevel: "uint32", // per space type, dead space | deep space | space | nebula
        silverCost: "uint80", // percentage of silver cap, lvl max | ... | lvl 0
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
      key: [],
    },
    // we restrict the type length of speed, defense, so that all fiels fit into one slot
    // if we need larger values, we can make the PlanetInitialResource table be the second
    // metadata table, and benefit from the 2nd slot.
    PlanetMetadata: {
      schema: {
        range: "uint32",
        speed: "uint16",
        defense: "uint16",
        populationCap: "uint64",
        populationGrowth: "uint32",
        silverCap: "uint64",
        silverGrowth: "uint32",
        level: "uint8",
        planetType: "PlanetType",
        spaceType: "SpaceType",
      },
      key: ["spaceType", "planetType", "level"],
    },
    PlanetInitialResource: {
      schema: {
        population: "uint64",
        silver: "uint64",
        level: "uint8",
        planetType: "PlanetType",
        spaceType: "SpaceType",
      },
      key: ["spaceType", "planetType", "level"],
    },
    Planet: {
      id: "bytes32",
      lastUpdateTick: "uint64",
      perlin: "uint8", // not sure if this suffices
      level: "uint8",
      planetType: "PlanetType",
      spaceType: "SpaceType",
      population: "uint64",
      silver: "uint64",
      upgrades: "uint24", // uint8 range | uint8 speed | uint8 defense
    },
    PlanetOwner: "address",
    PendingMove: {
      schema: {
        to: "bytes32",
        head: "uint8",
        number: "uint8",
        indexes: "uint240",
      },
      key: ["to"],
    },
    Move: {
      schema: {
        to: "bytes32",
        index: "uint8",
        from: "bytes32",
        captain: "address",
        departureTime: "uint64",
        arrivalTime: "uint64",
        population: "uint64",
        silver: "uint64",
        artifact: "uint256",
      },
      key: ["to", "index"],
    },
    Ticker: {
      schema: {
        tickNumber: "uint64",
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
    },
  },
});
