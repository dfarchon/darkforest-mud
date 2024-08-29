import type { EthAddress, UnionId } from "./identifier";

/**
 * Represents a Union; corresponds fairly closely with the analogous contract
 * struct
 */
export type Union = {
  unionId: UnionId;
  name: string;
  leader: EthAddress;
  level: number;
  members: EthAddress[];
  invitees: EthAddress[];
  applicants: EthAddress[];
  score: number;
  highestRank?: number;
};
