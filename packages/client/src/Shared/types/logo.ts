import type { Abstract } from "./utility";

export type LogoType = Abstract<number, "LogoType">;

/**
 * Enumeration of logo types.
 */
export const LogoType = {
  Unknown: 0 as LogoType,
  DarkForest: 1 as LogoType,
  DFARES: 2 as LogoType,
  DFArchon: 3 as LogoType,
  Redstone: 4 as LogoType,
  Lattice: 5 as LogoType,
  Mud: 6 as LogoType,
  Dear: 7 as LogoType,
  PixeLAW: 8 as LogoType,
  Biomes: 9 as LogoType,
  Mask: 10 as LogoType,
  AGLDDAO: 11 as LogoType,
  AWHouse: 12 as LogoType,
  OrdenGG: 13 as LogoType,
  Boys: 14 as LogoType,
  ZenbitVG: 15 as LogoType,
  DFDAO: 16 as LogoType,
  WASD: 17 as LogoType,
  FunCraft: 18 as LogoType,
  AWResearch: 19 as LogoType,
  ComposableLabs: 20 as LogoType,
  MetaCat: 21 as LogoType,
  WorldExplorers: 22 as LogoType,
  // Don't forget to update MIN_LOGO_TYPE and/or MAX_LOGO_TYPE in the `constants` package
};

/**
 * Mapping from LogoType to pretty-printed names.
 */
export const LogoTypeNames = {
  [LogoType.Unknown]: "Unknown",
  [LogoType.DarkForest]: "Dark Forest",
  [LogoType.DFARES]: "DFAres",
  [LogoType.DFArchon]: "DFArchon",
  [LogoType.Redstone]: "Redstone",
  [LogoType.Lattice]: "Lattice",
  [LogoType.Mud]: "MUD",
  [LogoType.Dear]: "Dear",
  [LogoType.PixeLAW]: "PixeLAW",
  [LogoType.Biomes]: "Biomes",
  [LogoType.Mask]: "Mask Network",
  [LogoType.AGLDDAO]: "AGLD DAO",
  [LogoType.AWHouse]: "AW House",
  [LogoType.OrdenGG]: "Orden GG",
  [LogoType.Boys]: "Boys",
  [LogoType.ZenbitVG]: "Zenbit VG",
  [LogoType.DFDAO]: "DFDAO",
  [LogoType.WASD]: "WASD",
  [LogoType.FunCraft]: "FunCraft",
  [LogoType.AWResearch]: "AWResearch",
  [LogoType.ComposableLabs]: "Composablelabs",
  [LogoType.MetaCat]: "MetaCat",
  [LogoType.WorldExplorers]: "World Explorers",
} as const;
