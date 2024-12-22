import type { EthAddress, GuildId } from "./identifier";
import type { Abstract } from "./utility";

export type GuildStatus = Abstract<number, "GuildStatus">;

export const GuildStatus = {
  UNEXIST: 0 as GuildStatus,
  ACTIVE: 1 as GuildStatus,
  DISBANDED: 2 as GuildStatus,
} as const;

export const GuildStatusNames = {
  [GuildStatus.UNEXIST]: "Unexist",
  [GuildStatus.ACTIVE]: "Active",
  [GuildStatus.DISBANDED]: "Disbanded",
} as const;

/**
 * Represents a Guild; corresponds fairly closely with the analogous contract
 * struct
 */
export type Guild = {
  id: GuildId;
  status: GuildStatus;
  rank: number;
  number: number;
  registry: number;
  owner: EthAddress;
  name: string;
  members: EthAddress[];
};

export type GuildRole = Abstract<number, "GuildRole">;

export const GuildRole = {
  NONE: 0 as GuildRole,
  MEMBER: 1 as GuildRole,
  OFFICER: 2 as GuildRole,
  LEADER: 3 as GuildRole,
} as const;
