import { resourceToHex } from "@latticexyz/common";
import ArtifactCreateSystemAbi from "contracts/out/ArtifactCreateSystem.sol/ArtifactCreateSystem.abi.json";
import ArtifactSystemAbi from "contracts/out/ArtifactSystem.sol/ArtifactSystem.abi.json";
import GuildSystemAbi from "contracts/out/GuildSystem.sol/GuildSystem.abi.json";
import MoveSystemAbi from "contracts/out/MoveSystem.sol/MoveSystem.abi.json";
import PinkBombSystemAbi from "contracts/out/PinkBombSystem.sol/PinkBombSystem.abi.json";
import PlanetEmojiSystemAbi from "contracts/out/PlanetEmojiSystem.sol/PlanetEmojiSystem.abi.json";
import PlanetRevealSystemAbi from "contracts/out/PlanetRevealSystem.sol/PlanetRevealSystem.abi.json";
import PlanetUpgradeSystemAbi from "contracts/out/PlanetUpgradeSystem.sol/PlanetUpgradeSystem.abi.json";
import PlanetWithdrawSilverSystemAbi from "contracts/out/PlanetWithdrawSilverSystem.sol/PlanetWithdrawSilverSystem.abi.json";
import PlayerSystemAbi from "contracts/out/PlayerSystem.sol/PlayerSystem.abi.json";
import TestOnlySystemAbi from "contracts/out/TestOnlySystem.sol/TestOnlySystem.abi.json";
import TickSystemAbi from "contracts/out/TickSystem.sol/TickSystem.abi.json";
import type { Abi } from "viem";

export const MOVE_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "MoveSystem",
});

export const MOVE_SYSTEM_ABI: Abi = MoveSystemAbi;

export const PLANET_REVEAL_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "PlanetRevealSystem",
});

export const PLANET_REVEAL_SYSTEM_ABI: Abi = PlanetRevealSystemAbi;

export const PLANET_UPGRADE_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "PlanetUpgradeSystem",
});

export const PLANET_UPGRADE_SYSTEM_ABI: Abi = PlanetUpgradeSystemAbi;

export const PLANET_WITHDRAW_SILVER_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "PlanetWithdrawSilverSystem",
});

export const PLANET_EMOJI_SYSTEM_ABI: Abi = PlanetEmojiSystemAbi;

export const PLANET_EMOJI_SYATEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "PlanetEmojiSystem",
});

export const PLANET_WITHDRAW_SILVER_SYSTEM_ABI: Abi =
  PlanetWithdrawSilverSystemAbi;

export const PLAYER_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "PlayerSystem",
});

export const PLAYER_SYSTEM_ABI: Abi = PlayerSystemAbi;

export const TEST_ONLY_SYSTEM_ABI: Abi = TestOnlySystemAbi;

export const TEST_ONLY_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "TestOnlySystem",
});

export const TICK_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "TickSystem",
});

export const TICK_SYSTEM_ABI: Abi = TickSystemAbi;

export const ARTIFACT_SYSTEM_ABI: Abi = ArtifactSystemAbi;

export const ARTIFACT_CREATE_SYSTEM_ABI: Abi = ArtifactCreateSystemAbi;

export const ARTIFACT_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "ArtifactSystem",
});

export const ARTIFACT_CREATE_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "ArtifactCreateSystem",
});

export const PINK_BOMB_SYSTEM_ABI: Abi = PinkBombSystemAbi;

export const PINK_BOMB_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "atf.1",
  name: "ProxySystem",
});
export const GUILD_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "GuildSystem",
});

export const GUILD_SYSTEM_ABI: Abi = GuildSystemAbi;

export const get_ABI_from_FunctionName = (functionName: string) => {
  if (functionName === "move" || functionName === "legacyMove") {
    return MOVE_SYSTEM_ABI;
  }
  if (
    functionName === "revealLocation" ||
    functionName === "legacyRevealLocation"
  ) {
    return PLANET_REVEAL_SYSTEM_ABI;
  } else if (
    functionName === "upgradePlanet" ||
    functionName === "legacyUpgradePlanet"
  ) {
    return PLANET_UPGRADE_SYSTEM_ABI;
  } else if (functionName === "withdrawSilver") {
    return PLANET_WITHDRAW_SILVER_SYSTEM_ABI;
  } else if (functionName === "setPlanetEmoji") {
    return PLANET_EMOJI_SYSTEM_ABI;
  } else if (functionName === "initializePlayer") {
    return PLAYER_SYSTEM_ABI;
  } else if (
    functionName === "createPlanet" ||
    functionName === "revealPlanetByAdmin" ||
    functionName === "safeSetOwner"
  ) {
    return TEST_ONLY_SYSTEM_ABI;
  } else if (
    functionName === "pause" ||
    functionName === "unpause" ||
    functionName === "updateTickRate"
  ) {
    return TICK_SYSTEM_ABI;
  } else if (
    functionName === "registerArtifact" ||
    functionName === "chargeArtifact" ||
    functionName === "shutdownArtifact" ||
    functionName === "activateArtifact"
  ) {
    return ARTIFACT_SYSTEM_ABI;
  } else if (
    functionName === "prospectPlanet" ||
    functionName === "findingArtifact" ||
    functionName === "findArtifact"
  ) {
    return ARTIFACT_CREATE_SYSTEM_ABI;
  } else if (functionName === "destroy") {
    return PINK_BOMB_SYSTEM_ABI;
  } else if (
    functionName === "createGuild" ||
    functionName === "inviteToGuild" ||
    functionName === "acceptInvitation" ||
    functionName === "applyToGuild" ||
    functionName === "approveApplication" ||
    functionName === "leaveGuild" ||
    functionName === "transferGuildLeadership" ||
    functionName === "disbandGuild" ||
    functionName === "setGrant" ||
    functionName === "setMemberRole" ||
    functionName === "kickMember"
  ) {
    return GUILD_SYSTEM_ABI;
  } else {
    // NOTE:  shouldn't reach here
    return MOVE_SYSTEM_ABI;
  }
};

export const get_SystemId_from_FunctionName = (functionName: string) => {
  if (functionName === "move" || functionName === "legacyMove") {
    return MOVE_SYSTEM_ID;
  }
  if (
    functionName === "revealLocation" ||
    functionName === "legacyRevealLocation"
  ) {
    return PLANET_REVEAL_SYSTEM_ID;
  } else if (
    functionName === "upgradePlanet" ||
    functionName === "legacyUpgradePlanet"
  ) {
    return PLANET_UPGRADE_SYSTEM_ID;
  } else if (functionName === "setPlanetEmoji") {
    return PLANET_EMOJI_SYATEM_ID;
  } else if (functionName === "withdrawSilver") {
    return PLANET_WITHDRAW_SILVER_SYSTEM_ID;
  } else if (functionName === "initializePlayer") {
    return PLAYER_SYSTEM_ID;
  } else if (
    functionName === "createPlanet" ||
    functionName === "revealPlanetByAdmin" ||
    functionName === "safeSetOwner"
  ) {
    return TEST_ONLY_SYSTEM_ID;
  } else if (
    functionName === "pause" ||
    functionName === "unpause" ||
    functionName === "updateTickRate"
  ) {
    return TICK_SYSTEM_ID;
  } else if (
    functionName === "registerArtifact" ||
    functionName === "chargeArtifact" ||
    functionName === "shutdownArtifact" ||
    functionName === "activateArtifact"
  ) {
    return ARTIFACT_SYSTEM_ID;
  } else if (
    functionName === "prospectPlanet" ||
    functionName === "findingArtifact" ||
    functionName === "findArtifact"
  ) {
    return ARTIFACT_CREATE_SYSTEM_ID;
  } else if (functionName === "destroy") {
    return PINK_BOMB_SYSTEM_ID;
  } else if (
    functionName === "createGuild" ||
    functionName === "inviteToGuild" ||
    functionName === "acceptInvitation" ||
    functionName === "applyToGuild" ||
    functionName === "approveApplication" ||
    functionName === "leaveGuild" ||
    functionName === "transferGuildLeadership" ||
    functionName === "disbandGuild" ||
    functionName === "setGrant" ||
    functionName === "setMemberRole" ||
    functionName === "kickMember"
  ) {
    return GUILD_SYSTEM_ID;
  } else {
    // NOTE:  shouldn't reach here
    return MOVE_SYSTEM_ID;
  }
};
