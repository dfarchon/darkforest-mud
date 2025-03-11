// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { GuildHistory } from "codegen/tables/GuildHistory.sol";
import { GuildMember, GuildMemberData } from "codegen/tables/GuildMember.sol";
import { GuildRole } from "codegen/common.sol";

library GuildUtils {
  /**
   * Get player's guild ID at specific tick
   * @param player The player's address
   * @param tick The target tick to query
   * @return guildId (0 if not in any guild)
   */
  function getPlayerGuildIdAt(address player, uint64 tick) internal view returns (uint8) {
    // Get player's guild history
    uint24[] memory memberIds = GuildHistory.getMemberIds(player);

    // If no history, return 0
    if (memberIds.length == 0) {
      return 0;
    }

    // Find the valid membership at given tick
    for (uint256 i = memberIds.length; i > 0; i--) {
      uint24 memberId = memberIds[i - 1];
      GuildMemberData memory memberData = GuildMember.get(memberId);

      // Check if this membership was active at the given tick
      if (memberData.joinedAt <= tick && (memberData.leftAt == 0 || memberData.leftAt > tick)) {
        return uint8(uint256(memberId) >> 16);
      }
    }

    // No valid membership found at the given tick
    return 0;
  }

  /**
   * Check if two players were in the same guild at specific tick
   * @param player1 First player's address
   * @param player2 Second player's address
   * @param tick The target tick to query
   * @return bool True if both players were in the same guild
   */
  function inSameGuild(address player1, address player2, uint64 tick) internal view returns (bool) {
    uint8 guildId1 = getPlayerGuildIdAt(player1, tick);
    uint8 guildId2 = getPlayerGuildIdAt(player2, tick);

    // Both must be in a guild and have the same guildId
    return (guildId1 != 0) && (guildId1 == guildId2);
  }

  /**
   * Get player's current guild ID
   * @param player The player's address
   * @return guildId (0 if not in any guild)
   */
  function getCurrentGuildId(address player) internal view returns (uint8) {
    uint24 curMemberId = GuildHistory.getCurMemberId(player);
    if (curMemberId == 0) return 0;

    // Extract guildId from memberId (top 8 bits)
    return uint8(uint256(curMemberId) >> 16);
  }

  /**
   * Check if two players are currently in the same guild
   * @param player1 First player's address
   * @param player2 Second player's address
   * @return bool True if both players are in the same guild
   */
  function inSameGuildNow(address player1, address player2) internal view returns (bool) {
    uint8 guildId1 = getCurrentGuildId(player1);
    uint8 guildId2 = getCurrentGuildId(player2);

    // Both must be in a guild and have the same guildId
    return (guildId1 != 0) && (guildId1 == guildId2);
  }

  /**
   * Check if a grantee meets the permission requirement set by the grantor in the same guild
   * @param grantor The player who sets permission requirements (the one giving permission)
   * @param grantee The player requesting to act as proxy (the one receiving permission)
   * @return bool True if grantee meets the grantor's permission requirement
   */
  function meetGrantRequirement(address grantor, address grantee) internal view returns (bool) {
    if (grantor == grantee) return true;

    // First check if they are in the same guild
    if (!inSameGuildNow(grantor, grantee)) {
      return false;
    }

    // Get current memberIds
    uint24 grantorMemberId = GuildHistory.getCurMemberId(grantor);
    uint24 granteeMemberId = GuildHistory.getCurMemberId(grantee);

    // Get member data
    GuildMemberData memory grantorData = GuildMember.get(grantorMemberId);
    GuildMemberData memory granteeData = GuildMember.get(granteeMemberId);

    if (grantorData.grant == GuildRole.NONE) return false;

    return uint8(grantorData.grant) <= uint8(granteeData.role);
  }
}
