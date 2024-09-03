import type { Abstract } from "./utility";

export type AvatarType = Abstract<number, "AvatarType">;

/**
 * Enumeration of avatar types.
 */
export const AvatarType = {
  Unknown: 0 as AvatarType,
  Cathy: 1 as AvatarType,
  BaliGee: 2 as AvatarType,
  Christine: 3 as AvatarType,
  Ddy: 4 as AvatarType,
  Flicka: 5 as AvatarType,
  Gink: 6 as AvatarType,
  Hope: 7 as AvatarType,
  Modukon: 8 as AvatarType,
  Wesely: 9 as AvatarType,
  Zeroxlau: 10 as AvatarType,
  Hooks: 11 as AvatarType,
  k1ic: 12 as AvatarType,
  zknevermore: 13 as AvatarType,
  ZOOJOO: 14 as AvatarType,
  ZT: 15 as AvatarType,
  Skoon: 16 as AvatarType,
  MUDAI: 17 as AvatarType,
  Xiaoyifu: 18 as AvatarType,
  Yuppie: 19 as AvatarType,
  Snow: 20 as AvatarType,
  Gubsheep: 21 as AvatarType,
  Ivan: 22 as AvatarType,
  Biscaryn: 23 as AvatarType,
  One470: 24 as AvatarType,
  // Don't forget to update MIN_AVATAR_TYPE and/or MAX_AVATAR_TYPE in the `constants` package
};

/**
 * Mapping from AvatarType to pretty-printed names.
 */
export const AvatarTypeNames = {
  [AvatarType.Unknown]: "Unknown",
  [AvatarType.Cathy]: "Cathy",
  [AvatarType.BaliGee]: "Bali Gee",
  [AvatarType.Christine]: "Christine",
  [AvatarType.Ddy]: "ddy",
  [AvatarType.Flicka]: "Flicka",
  [AvatarType.Gink]: "Gink",
  [AvatarType.Hope]: "Hope",
  [AvatarType.Modukon]: "Modukon",
  [AvatarType.Wesely]: "Wesely",
  [AvatarType.Zeroxlau]: "0xlau",
  [AvatarType.Hooks]: "hooks",
  [AvatarType.k1ic]: "k1ic",
  [AvatarType.zknevermore]: "zknevermore",
  [AvatarType.ZOOJOO]: "ZOOJOO",
  [AvatarType.ZT]: "ZT",
  [AvatarType.Skoon]: "Skoon",
  [AvatarType.MUDAI]: " MUD AI",
  [AvatarType.Xiaoyifu]: "Xiaoyifu",
  [AvatarType.Yuppie]: "yuppie",
  [AvatarType.Snow]: "snow",
  [AvatarType.Gubsheep]: "gubsheep",
  [AvatarType.Ivan]: "ivan",
  [AvatarType.Biscaryn]: "biscaryn",
  [AvatarType.One470]: "1470",
} as const;
