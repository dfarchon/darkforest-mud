import type { Abstract } from "./utility";

export type HatType = Abstract<number, "HatType">;

/**
 * Enumeration of hat types.
 */
export const HatType = {
  Unknown: 0 as HatType,
  GraduationCap: 1 as HatType,
  PartyHat: 2 as HatType,
  Fish: 3 as HatType,
  TopHat: 4 as HatType,
  Fez: 5 as HatType,
  ChefHat: 6 as HatType,
  CowboyHat: 7 as HatType,
  PopeHat: 8 as HatType,
  Squid: 9 as HatType,
  SantaHat: 10 as HatType,

  // Don't forget to update MIN_HAT_TYPE and/or MAX_HAT_TYPE in the `constants` package
};

/**
 * Mapping from HatType to pretty-printed names.
 */
export const HatTypeNames = {
  [HatType.Unknown]: "Unknown",
  [HatType.GraduationCap]: "GraduationCap",
  [HatType.PartyHat]: "PartyHat",
  [HatType.Fish]: "Fish",
  [HatType.TopHat]: "TopHat",
  [HatType.Fez]: "Fez",
  [HatType.ChefHat]: "ChefHat",
  [HatType.CowboyHat]: "CoyboyHat",
  [HatType.PopeHat]: "PopeHat",
  [HatType.Squid]: "Squid",
  [HatType.SantaHat]: "SantaHat",
} as const;
