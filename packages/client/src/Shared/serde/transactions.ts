import type {
  Transaction,
  TxIntent,
  UnconfirmedAcceptApplication,
  UnconfirmedAcceptInvite,
  UnconfirmedActivateArtifact,
  UnconfirmedAddMemberByAdmin,
  UnconfirmedBlue,
  UnconfirmedBurn,
  UnconfirmedBuyArtifact,
  UnconfirmedBuyHat,
  UnconfirmedBuyPlanet,
  UnconfirmedBuySpaceship,
  UnconfirmedCancelApplication,
  UnconfirmedCancelInvite,
  UnconfirmedCapturePlanet,
  UnconfirmedChangeArtifactImageType,
  UnconfirmedChangeUnionName,
  UnconfirmedClaim,
  UnconfirmedCreateUnion,
  UnconfirmedDeactivateArtifact,
  UnconfirmedDepositArtifact,
  UnconfirmedDisbandUnion,
  UnconfirmedDonate,
  UnconfirmedFindArtifact,
  UnconfirmedGetShips,
  UnconfirmedInit,
  UnconfirmedInvadePlanet,
  UnconfirmedInviteMember,
  UnconfirmedKardashev,
  UnconfirmedKickMember,
  UnconfirmedLeaveUnion,
  UnconfirmedLevelUpUnion,
  UnconfirmedMove,
  UnconfirmedPink,
  UnconfirmedPlanetTransfer,
  UnconfirmedProspectPlanet,
  UnconfirmedRefreshPlanet,
  UnconfirmedRejectApplication,
  UnconfirmedReveal,
  UnconfirmedSendApplication,
  UnconfirmedSetPlanetEmoji,
  UnconfirmedTransferLeaderRole,
  UnconfirmedUpgrade,
  UnconfirmedUseKey,
  UnconfirmedWithdrawArtifact,
  UnconfirmedWithdrawSilver,
} from "@df/types";

// @todo:
// - these `isUnconfirmedX` should be named something that matches the naming convention of the
//   `TxIntent` subtypes - `isXIntent`
// - these `isUnconfirmedX` should check something more than the method name

export function isUnconfirmedReveal(
  txIntent: TxIntent,
): txIntent is UnconfirmedReveal {
  return txIntent.methodName === "df__legacyRevealLocation";
}

export function isUnconfirmedClaim(
  txIntent: TxIntent,
): txIntent is UnconfirmedClaim {
  return txIntent.methodName === "claimLocation";
}

export function isUnconfirmedInit(
  txIntent: TxIntent,
): txIntent is UnconfirmedInit {
  return txIntent.methodName === "df__initializePlayer";
}

export function isUnconfirmedMove(
  txIntent: TxIntent,
): txIntent is UnconfirmedMove {
  return txIntent.methodName === "df__legacyMove";
}

export function isUnconfirmedRelease(
  txIntent: TxIntent,
): txIntent is UnconfirmedMove {
  return isUnconfirmedMove(txIntent) && txIntent.abandoning;
}

export function isUnconfirmedUpgrade(
  txIntent: TxIntent,
): txIntent is UnconfirmedUpgrade {
  return txIntent.methodName === "df__legacyUpgradePlanet";
}

export function isUnconfirmedRefreshPlanet(
  txIntent: TxIntent,
): txIntent is UnconfirmedRefreshPlanet {
  return txIntent.methodName === "refreshPlanet";
}

export function isUnconfirmedBuyHat(
  txIntent: TxIntent,
): txIntent is UnconfirmedBuyHat {
  return txIntent.methodName === "buySkin";
}

export function isUnconfirmedTransfer(
  txIntent: TxIntent,
): txIntent is UnconfirmedPlanetTransfer {
  return txIntent.methodName === "transferPlanet";
}

export function isUnconfirmedFindArtifact(
  txIntent: TxIntent,
): txIntent is UnconfirmedFindArtifact {
  return txIntent.methodName === "df__findArtifact";
}

export function isUnconfirmedDepositArtifact(
  txIntent: TxIntent,
): txIntent is UnconfirmedDepositArtifact {
  return txIntent.methodName === "depositArtifact";
}

export function isUnconfirmedWithdrawArtifact(
  txIntent: TxIntent,
): txIntent is UnconfirmedWithdrawArtifact {
  return txIntent.methodName === "withdrawArtifact";
}

export function isUnconfirmedProspectPlanet(
  txIntent: TxIntent,
): txIntent is UnconfirmedProspectPlanet {
  return txIntent.methodName === "df__prospectPlanet";
}

export function isUnconfirmedActivateArtifact(
  txIntent: TxIntent,
): txIntent is UnconfirmedActivateArtifact {
  return txIntent.methodName === "activateArtifact";
}

export function isUnconfirmedDeactivateArtifact(
  txIntent: TxIntent,
): txIntent is UnconfirmedDeactivateArtifact {
  return txIntent.methodName === "deactivateArtifact";
}

export function isUnconfirmedChangeArtifactImageType(
  txIntent: TxIntent,
): txIntent is UnconfirmedChangeArtifactImageType {
  return txIntent.methodName === "changeArtifactImageType";
}

export function isUnconfirmedBuyArtifact(
  txIntent: TxIntent,
): txIntent is UnconfirmedBuyArtifact {
  return txIntent.methodName === "buyArtifact";
}

export function isUnconfirmedWithdrawSilver(
  txIntent: TxIntent,
): txIntent is UnconfirmedWithdrawSilver {
  return txIntent.methodName === "df__withdrawSilver";
}

export function isUnconfirmedSetPlanetEmoji(
  txIntent: TxIntent,
): txIntent is UnconfirmedWithdrawSilver {
  return txIntent.methodName === "df__setPlanetEmoji";
}

export function isUnconfirmedGetShips(
  txIntent: TxIntent,
): txIntent is UnconfirmedGetShips {
  return txIntent.methodName === "giveSpaceShips";
}

export function isUnconfirmedCapturePlanet(
  txIntent: TxIntent,
): txIntent is UnconfirmedCapturePlanet {
  return txIntent.methodName === "capturePlanet";
}

export function isUnconfirmedBurn(
  txIntent: TxIntent,
): txIntent is UnconfirmedBurn {
  return txIntent.methodName === "burnLocation";
}

export function isUnconfirmedPink(
  txIntent: TxIntent,
): txIntent is UnconfirmedPink {
  return txIntent.methodName === "pinkLocation";
}

export function isUnconfirmedKardashev(
  txIntent: TxIntent,
): txIntent is UnconfirmedKardashev {
  return txIntent.methodName === "kardashev";
}

export function isUnconfirmedBlue(
  txIntent: TxIntent,
): txIntent is UnconfirmedBlue {
  return txIntent.methodName === "blueLocation";
}

export function isUnconfirmedBuyPlanet(
  txIntent: TxIntent,
): txIntent is UnconfirmedBuyPlanet {
  return txIntent.methodName === "buyPlanet";
}

export function isUnconfirmedBuySpaceship(
  txIntent: TxIntent,
): txIntent is UnconfirmedBuySpaceship {
  return txIntent.methodName === "buySpaceship";
}

export function isUnconfirmedDonate(
  txIntent: TxIntent,
): txIntent is UnconfirmedDonate {
  return txIntent.methodName === "donate";
}

export function isUnconfirmedInvadePlanet(
  txIntent: TxIntent,
): txIntent is UnconfirmedInvadePlanet {
  return txIntent.methodName === "invadePlanet";
}

export function isUnconfirmedUseKey(
  txIntent: TxIntent,
): txIntent is UnconfirmedUseKey {
  return txIntent.methodName === "useKey";
}

export function isUnconfirmedAddMemberByAdmin(
  txIntent: TxIntent,
): txIntent is UnconfirmedAddMemberByAdmin {
  return txIntent.methodName === "addMemberByAdmin";
}

export function isUnconfirmedCreateUnion(
  txIntent: TxIntent,
): txIntent is UnconfirmedCreateUnion {
  return txIntent.methodName === "createUnion";
}

export function isUnconfirmedInviteMember(
  txIntent: TxIntent,
): txIntent is UnconfirmedInviteMember {
  return txIntent.methodName === "inviteMember";
}

export function isUnconfirmedCancelInvite(
  txIntent: TxIntent,
): txIntent is UnconfirmedCancelInvite {
  return txIntent.methodName === "cancelInvite";
}

export function isUnconfirmedAcceptInvite(
  txIntent: TxIntent,
): txIntent is UnconfirmedAcceptInvite {
  return txIntent.methodName === "acceptInvite";
}

export function isUnconfirmedSendApplication(
  txIntent: TxIntent,
): txIntent is UnconfirmedSendApplication {
  return txIntent.methodName === "sendApplication";
}

export function isUnconfirmedCancelApplication(
  txIntent: TxIntent,
): txIntent is UnconfirmedCancelApplication {
  return txIntent.methodName === "cancelApplication";
}

export function isUnconfirmedRejectApplication(
  txIntent: TxIntent,
): txIntent is UnconfirmedCancelApplication {
  return txIntent.methodName === "rejectApplication";
}

export function isUnconfirmedAcceptApplication(
  txIntent: TxIntent,
): txIntent is UnconfirmedAcceptApplication {
  return txIntent.methodName === "acceptApplication";
}

export function isUnconfirmedLeaveUnion(
  txIntent: TxIntent,
): txIntent is UnconfirmedLeaveUnion {
  return txIntent.methodName === "leaveUnion";
}

export function isUnconfirmedKickMember(
  txIntent: TxIntent,
): txIntent is UnconfirmedKickMember {
  return txIntent.methodName === "kickMember";
}

export function isUnconfirmedTransferLeaderRole(
  txIntent: TxIntent,
): txIntent is UnconfirmedTransferLeaderRole {
  return txIntent.methodName === "transferLeaderRole";
}

export function isUnconfirmedChangeUnionName(
  txIntent: TxIntent,
): txIntent is UnconfirmedChangeUnionName {
  return txIntent.methodName === "changeUnionName";
}

export function isUnconfirmedDisbandUnion(
  txIntent: TxIntent,
): txIntent is UnconfirmedDisbandUnion {
  return txIntent.methodName === "disbandUnion";
}

export function isUnconfirmedLevelUpUnion(
  txIntent: TxIntent,
): txIntent is UnconfirmedLevelUpUnion {
  return txIntent.methodName === "levelUpUnion";
}

export function isUnconfirmedRevealTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedReveal> {
  return isUnconfirmedReveal(tx.intent);
}

export function isUnconfirmedClaimTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedReveal> {
  return isUnconfirmedClaim(tx.intent);
}

export function isUnconfirmedInitTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedInit> {
  return isUnconfirmedInit(tx.intent);
}

export function isUnconfirmedMoveTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedMove> {
  return isUnconfirmedMove(tx.intent);
}

export function isUnconfirmedReleaseTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedMove> {
  return isUnconfirmedRelease(tx.intent);
}

export function isUnconfirmedUpgradeTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedUpgrade> {
  return isUnconfirmedUpgrade(tx.intent);
}

export function isUnconfirmedRefreshPlanetTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedRefreshPlanet> {
  return isUnconfirmedRefreshPlanet(tx.intent);
}

export function isUnconfirmedBuyHatTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedBuyHat> {
  return isUnconfirmedBuyHat(tx.intent);
}

export function isUnconfirmedTransferTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedPlanetTransfer> {
  return isUnconfirmedTransfer(tx.intent);
}

export function isUnconfirmedFindArtifactTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedFindArtifact> {
  return isUnconfirmedFindArtifact(tx.intent);
}

export function isUnconfirmedDepositArtifactTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedDepositArtifact> {
  return isUnconfirmedDepositArtifact(tx.intent);
}

export function isUnconfirmedWithdrawArtifactTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedWithdrawArtifact> {
  return isUnconfirmedWithdrawArtifact(tx.intent);
}

export function isUnconfirmedProspectPlanetTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedProspectPlanet> {
  return isUnconfirmedProspectPlanet(tx.intent);
}

export function isUnconfirmedActivateArtifactTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedActivateArtifact> {
  return isUnconfirmedActivateArtifact(tx.intent);
}

export function isUnconfirmedDeactivateArtifactTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedDeactivateArtifact> {
  return isUnconfirmedDeactivateArtifact(tx.intent);
}

export function isUnconfirmedChangeArtifactImageTypeTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedDeactivateArtifact> {
  return isUnconfirmedChangeArtifactImageType(tx.intent);
}

export function isUnconfirmedBuyArtifactTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedBuyArtifact> {
  return isUnconfirmedBuyArtifact(tx.intent);
}

export function isUnconfirmedWithdrawSilverTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedWithdrawSilver> {
  return isUnconfirmedWithdrawSilver(tx.intent);
}

export function isUnconfirmedSetPlanetEmojiTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedSetPlanetEmoji> {
  return isUnconfirmedSetPlanetEmoji(tx.intent);
}

export function isUnconfirmedGetShipsTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedGetShips> {
  return isUnconfirmedGetShips(tx.intent);
}

export function isUnconfirmedInvadePlanetTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedInvadePlanet> {
  return isUnconfirmedInvadePlanet(tx.intent);
}

export function isUnconfirmedCapturePlanetTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedCapturePlanet> {
  return isUnconfirmedCapturePlanet(tx.intent);
}

export function isUnconfirmedBurnTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedBurn> {
  return isUnconfirmedBurn(tx.intent);
}

export function isUnconfirmedPinkTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedPink> {
  return isUnconfirmedPink(tx.intent);
}

export function isUnconfirmedUseKeyTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedUseKey> {
  return isUnconfirmedUseKey(tx.intent);
}

export function isUnconfirmedKardashevTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedKardashev> {
  return isUnconfirmedKardashev(tx.intent);
}

export function isUnconfirmedBlueTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedBlue> {
  return isUnconfirmedBlue(tx.intent);
}

export function isUnconfirmedBuyPlanetTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedBuyPlanet> {
  return isUnconfirmedBuyPlanet(tx.intent);
}

export function isUnconfirmedBuySpaceshipTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedBuySpaceship> {
  return isUnconfirmedBuySpaceship(tx.intent);
}

export function isUnconfirmedDonateTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedDonate> {
  return isUnconfirmedDonate(tx.intent);
}

export function isUnconfirmedAddMemberByAdminTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedAddMemberByAdmin> {
  return isUnconfirmedAddMemberByAdmin(tx.intent);
}

export function isUnconfirmedCreateUnionTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedCreateUnion> {
  return isUnconfirmedCreateUnion(tx.intent);
}

export function isUnconfirmedInviteMemberTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedInviteMember> {
  return isUnconfirmedInviteMember(tx.intent);
}

export function isUnconfirmedCancelInviteTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedCancelInvite> {
  return isUnconfirmedCancelInvite(tx.intent);
}

export function isUnconfirmedAcceptInviteTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedAcceptInvite> {
  return isUnconfirmedAcceptInvite(tx.intent);
}

export function isUnconfirmedSendApplicationTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedSendApplication> {
  return isUnconfirmedSendApplication(tx.intent);
}

export function isUnconfirmedCancelApplicationTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedCancelApplication> {
  return isUnconfirmedCancelApplication(tx.intent);
}

export function isUnconfirmedRejectApplicationTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedRejectApplication> {
  return isUnconfirmedRejectApplication(tx.intent);
}

export function isUnconfirmedAcceptApplicationTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedAcceptApplication> {
  return isUnconfirmedAcceptApplication(tx.intent);
}

export function isUnconfirmedLeaveUnionTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedLeaveUnion> {
  return isUnconfirmedLeaveUnion(tx.intent);
}

export function isUnconfirmedKickMemberTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedKickMember> {
  return isUnconfirmedKickMember(tx.intent);
}

export function isUnconfirmedTransferLeaderRoleTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedTransferLeaderRole> {
  return isUnconfirmedTransferLeaderRole(tx.intent);
}

export function isUnconfirmedChangeUnionNameTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedChangeUnionName> {
  return isUnconfirmedChangeUnionName(tx.intent);
}

export function isUnconfirmedDisbandUnionTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedDisbandUnion> {
  return isUnconfirmedDisbandUnion(tx.intent);
}

export function isUnconfirmedLevelUpUnionTx(
  tx: Transaction,
): tx is Transaction<UnconfirmedLevelUpUnion> {
  return isUnconfirmedLevelUpUnion(tx.intent);
}
