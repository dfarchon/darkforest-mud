import type { Contract } from "ethers";
import type { Abi, Hex } from "viem";

import type { ArtifactId, EthAddress, LocationId, UnionId } from "./identifier";
import type { WorldLocation } from "./world";

// import type { LiteralUnion } from "type-fest";
//
type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>);

export type ContractMethodName =
  | "df__legacyRevealLocation"
  | "claimLocation"
  | "df__initializePlayer"
  | "df__legacyMove"
  | "df__legacyUpgradePlanet"
  | "buySkin"
  | "transferPlanet"
  | "df__findArtifact"
  | "df__prospectPlanet"
  | "depositArtifact"
  | "withdrawArtifact"
  | "activateArtifact"
  | "deactivateArtifact"
  | "changeArtifactImageType"
  | "buyArtifact"
  | "df__withdrawSilver"
  | "df__setPlanetEmoji"
  | "useKey"
  | "adminUseKey"
  | "addKeys"
  | "giveSpaceShips"
  | "createLobby"
  | "invadePlanet"
  | "capturePlanet"
  | "claimReward"
  | "burnLocation"
  | "pinkLocation"
  | "kardashev"
  | "blueLocation"
  | "refreshPlanet"
  | "buyPlanet"
  | "buySpaceship"
  | "donate"
  | "addMemberByAdmin"
  | "createUnion"
  | "inviteMember"
  | "cancelInvite"
  | "acceptInvite"
  | "sendApplication"
  | "cancelApplication"
  | "rejectApplication"
  | "acceptApplication"
  | "leaveUnion"
  | "kickMember"
  | "transferLeaderRole"
  | "changeUnionName"
  | "disbandUnion"
  | "levelUpUnion"
  | "df__buyGPTTokens"
  | "df__spendGPTTokens"
  | "df__sendGPTTokens";

export type EthTxStatus =
  | "Init"
  | "Processing"
  | "Prioritized"
  | "Submit"
  | "Confirm"
  | "Fail"
  | "Cancel";

/**
 * The intent of this type is to represent a transaction that will occur on the blockchain in a way
 * that the game understands. This should usually be accessed as a member of {@link Transaction}.
 * @hidden
 */
export type TxIntent = {
  contract: Contract;
  methodName: LiteralUnion<ContractMethodName, string>;
  args: Promise<unknown[]>;
  delegator: EthAddress;
};

/**
 * @hidden
 */
export type UnconfirmedInit = TxIntent & {
  methodName: "df__initializePlayer";
  locationId: LocationId;
  location: WorldLocation;
};

/**
 * @hidden
 */
export type UnconfirmedMove = TxIntent & {
  methodName: "df__legacyMove";
  from: LocationId;
  to: LocationId;
  forces: number;
  silver: number;
  abandoning: boolean;
  artifact?: ArtifactId;
};

/**
 * @hidden
 */
export type UnconfirmedFindArtifact = TxIntent & {
  methodName: "df__findArtifact";
  planetId: LocationId;
};

/**
 * @hidden
 */
export type UnconfirmedProspectPlanet = TxIntent & {
  methodName: "df__prospectPlanet";
  planetId: LocationId;
};

/**
 * @hidden
 */
export type UnconfirmedPlanetTransfer = TxIntent & {
  methodName: "transferPlanet";
  planetId: LocationId;
  newOwner: EthAddress;
};

/**
 * @hidden
 */
export type UnconfirmedClaimReward = TxIntent & {
  methodName: "claimReward";
  sortedPlayerAddresses: EthAddress[];
  sortedScores: number[];
};

/**
 * @hidden
 */
export type UnconfirmedUpgrade = TxIntent & {
  methodName: "df__legacyUpgradePlanet";
  locationId: LocationId;
  upgradeBranch: number; // 0, 1, or 2
};

/**
 * @hidden
 */
export type UnconfirmedRefreshPlanet = TxIntent & {
  methodName: "refreshPlanet";
  locationId: LocationId;
};

/**
 * @hidden
 */
export type UnconfirmedBuyHat = TxIntent & {
  methodName: "buySkin";
  locationId: LocationId;
  hatType: number;
};

/**
 * @hidden
 */
export type UnconfirmedDepositArtifact = TxIntent & {
  methodName: "depositArtifact";
  locationId: LocationId;
  artifactId: ArtifactId;
};

/**
 * @hidden
 */
export type UnconfirmedWithdrawArtifact = TxIntent & {
  methodName: "withdrawArtifact";
  locationId: LocationId;
  artifactId: ArtifactId;
};

/**
 * @hidden
 */
export type UnconfirmedActivateArtifact = TxIntent & {
  methodName: "activateArtifact";
  locationId: LocationId;
  artifactId: ArtifactId;
  linkTo?: LocationId;
};

/**
 * @hidden
 */
export type UnconfirmedDeactivateArtifact = TxIntent & {
  methodName: "deactivateArtifact";
  locationId: LocationId;
  artifactId: ArtifactId;
  linkTo: LocationId | undefined;
};

/**
 * @hidden
 */
export type UnconfirmedChangeArtifactImageType = TxIntent & {
  methodName: "changeArtifactImageType";
  locationId: LocationId;
  artifactId: ArtifactId;
  newImageType: number;
};

/**
 * @hidden
 */
export type UnconfirmedBuyArtifact = TxIntent & {
  methodName: "buyArtifact";
  locationId: LocationId;
  artifactId: ArtifactId;
};

/**
 * @hidden
 */
export type UnconfirmedWithdrawSilver = TxIntent & {
  methodName: "df__withdrawSilver";
  locationId: LocationId;
  amount: number;
};

/**
 * @hidden
 */
export type UnconfirmedSetPlanetEmoji = TxIntent & {
  methodName: "df__setPlanetEmoji";
  locationId: LocationId;
  emoji: string;
};

/**
 * @hidden
 */
export type UnconfirmedReveal = TxIntent & {
  methodName: "df__legacyRevealLocation";
  locationId: LocationId;
  location: WorldLocation;
};

/**
 * @hidden
 */
export type UnconfirmedClaim = TxIntent & {
  methodName: "claimLocation";
  locationId: LocationId;
  location: WorldLocation;
};

/**
 * @hidden
 */
export type UnconfirmedAddKeys = TxIntent & {
  methodName: "addKeys";
};

/**
 * @hidden
 */
export type UnconfirmedUseKey = TxIntent & {
  methodName: "useKey";
};

/**
 * @hidden
 */
export type UnconfirmedAdminUseKey = TxIntent & {
  methodName: "adminUseKey";
};

/**
 * @hidden
 */
export type UnconfirmedGetShips = TxIntent & {
  methodName: "giveSpaceShips";
  locationId: LocationId;
};

/**
 * @hidden
 */
export type UnconfirmedCreateLobby = TxIntent & {
  methodName: "createLobby";
};

/**
 * @hidden
 */
export type UnconfirmedInvadePlanet = TxIntent & {
  methodName: "invadePlanet";
  locationId: LocationId;
};

/**
 * @hidden
 */
export type UnconfirmedCapturePlanet = TxIntent & {
  methodName: "capturePlanet";
  locationId: LocationId;
};

/**
 * @hidden
 */
export type UnconfirmedBurn = TxIntent & {
  methodName: "burnLocation";
  locationId: LocationId;
  location: WorldLocation;
};

/**
 * @hidden
 */
export type UnconfirmedPink = TxIntent & {
  methodName: "pinkLocation";
  locationId: LocationId;
  location: WorldLocation;
};

/**
 * @hidden
 */
export type UnconfirmedKardashev = TxIntent & {
  methodName: "kardashev";
  locationId: LocationId;
  location: WorldLocation;
};

/**
 * @hidden
 */
export type UnconfirmedBlue = TxIntent & {
  methodName: "blueLocation";
  locationId: LocationId;
  location: WorldLocation;
};

/**
 * @hidden
 */
export type UnconfirmedBuyPlanet = TxIntent & {
  methodName: "buyPlanet";
  locationId: LocationId;
  location: WorldLocation;
};

/**
 * @hidden
 */
export type UnconfirmedBuySpaceship = TxIntent & {
  methodName: "buySpaceship";
  locationId: LocationId;
  location: WorldLocation;
};

/**
 * @hidden
 */
export type UnconfirmedDonate = TxIntent & {
  methodName: "donate";
  amount: number;
};

/**
 * @hidden
 */
export type UnconfirmedAddMemberByAdmin = TxIntent & {
  methodName: "addMemberByAdmin";
  unionId: UnionId;
  member: EthAddress;
};

/**
 * @hidden
 *
 */
export type UnconfirmedCreateUnion = TxIntent & {
  methodName: "createUnion";
  name: string;
};

/**
 * @hidden
 */
export type UnconfirmedInviteMember = TxIntent & {
  methodName: "inviteMember";
  unionId: UnionId;
  invitee: EthAddress;
};

/**
 * @hidden
 */
export type UnconfirmedCancelInvite = TxIntent & {
  methodName: "cancelInvite";
  unionId: UnionId;
  invitee: EthAddress;
};

/**
 * @hidden
 */
export type UnconfirmedSendApplication = TxIntent & {
  methodName: "sendApplication";
  unionId: UnionId;
};

/**
 * @hidden
 */
export type UnconfirmedCancelApplication = TxIntent & {
  methodName: "cancelApplication";
  unionId: UnionId;
};

/**
 * @hidden
 */
export type UnconfirmedRejectApplication = TxIntent & {
  methodName: "rejectApplication";
  unionId: UnionId;
  applicant: EthAddress;
};

/**
 * @hidden
 */
export type UnconfirmedAcceptApplication = TxIntent & {
  methodName: "acceptApplication";
  unionId: UnionId;
  applicant: EthAddress;
};

/**
 * @hidden
 */
export type UnconfirmedAcceptInvite = TxIntent & {
  methodName: "acceptInvite";
  unionId: UnionId;
};

/**
 * @hidden
 */
export type UnconfirmedLeaveUnion = TxIntent & {
  methodName: "leaveUnion";
  unionId: UnionId;
};

/**
 * @hidden
 */
export type UnconfirmedKickMember = TxIntent & {
  methodName: "kickMember";
  unionId: UnionId;
  member: EthAddress;
};

/**
 * @hidden
 */
export type UnconfirmedTransferLeaderRole = TxIntent & {
  methodName: "transferLeaderRole";
  unionId: UnionId;
  newLeader: EthAddress;
};

/**
 * @hidden
 */
export type UnconfirmedChangeUnionName = TxIntent & {
  methodName: "changeUnionName";
  unionId: UnionId;
  newName: string;
};

/**
 * @hidden
 */
export type UnconfirmedDisbandUnion = TxIntent & {
  methodName: "disbandUnion";
  unionId: UnionId;
};

/**
 * @hidden
 */
export type UnconfirmedLevelUpUnion = TxIntent & {
  methodName: "levelUpUnion";
  unionId: UnionId;
};

/**
 * @hidden
 */
export type UnconfirmedBuyGPTTokens = TxIntent & {
  methodName: "df__buyGPTTokens";
  amount: number;
};

/**
 * @hidden
 */
export type UnconfirmedSpendGPTTokens = TxIntent & {
  methodName: "df__spendGPTTokens";
};

/**
 * @hidden
 */
export type UnconfirmedSendGPTTokens = TxIntent & {
  methodName: "df__sendGPTTokens";
  player: EthAddress;
  amount: number;
};
