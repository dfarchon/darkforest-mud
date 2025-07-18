// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { GuildStatus, GuildRole } from "codegen/common.sol";
import { Counter } from "codegen/tables/Counter.sol";
import { Guild, GuildData } from "codegen/tables/Guild.sol";
import { GuildName } from "codegen/tables/GuildName.sol";
import { GuildMember, GuildMemberData } from "codegen/tables/GuildMember.sol";
import { GuildHistory } from "codegen/tables/GuildHistory.sol";
import { GuildCandidate } from "codegen/tables/GuildCandidate.sol";
import { DFUtils } from "libraries/DFUtils.sol";
import { GuildConfig } from "codegen/tables/GuildConfig.sol";
import { Player } from "codegen/tables/Player.sol";
import { IBaseWorld } from "@latticexyz/world/src/codegen/interfaces/IBaseWorld.sol";
import { AccessControl } from "@latticexyz/world/src/AccessControl.sol";
import { SystemRegistry } from "@latticexyz/world/src/codegen/tables/SystemRegistry.sol";
import { Balances } from "@latticexyz/world/src/codegen/tables/Balances.sol";
import { PlayerWithdrawSilver } from "codegen/tables/PlayerWithdrawSilver.sol";
import { RevenueStats } from "codegen/tables/RevenueStats.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { GlobalStats } from "codegen/tables/GlobalStats.sol";

contract GuildSystem is BaseSystem {
  error NeedFundsToCreateGuild(); // 0xce43bd9e
  error GuildIdOverflow(); // 0x46aea226
  error GuildRoleUnexpected(); // 0x26f8cb41
  error GuildNotActive(); // 0x4db8e461
  error GuildNotInvited(); // 0x10d249a5
  error GuildNotApplied(); // 0x1a6d3a07
  error GuildHasMembers(); // 0xabb7f52d
  error GuildLeaveCooldownNotExpired(); // 0x293bd9fc
  error GuildMemberLimitReached(); // 0x6c65c706

  function _requireOwner() internal view {
    AccessControl.requireOwner(SystemRegistry.get(address(this)), _msgSender());
  }

  function withdraw() public {
    _requireOwner();
    uint256 balance = Balances.get(DFUtils.getDFNamespace());
    IBaseWorld(_world()).transferBalanceToAddress(DFUtils.getDFNamespace(), _msgSender(), balance);
  }

  function _isPlayerRegistered(address player) internal view returns (bool) {
    return Player.getIndex(player) != 0;
  }

  function _isInGuild(address player) internal view returns (bool, uint256) {
    uint256 curMemberId = GuildHistory.getCurMemberId(player);
    return (curMemberId != 0, curMemberId);
  }

  function _getGuildRole(address player) internal view returns (GuildRole, uint256) {
    (bool inGuild, uint256 memberId) = _isInGuild(player);
    if (!inGuild) {
      return (GuildRole.NONE, 0);
    }
    return (GuildMember.getRole(uint24(memberId)), memberId);
  }

  function _getLastGuildLeaveTick(address player) internal view returns (uint64) {
    uint24[] memory memberIds = GuildHistory.getMemberIds(player);
    if (memberIds.length == 0) {
      return 0;
    }

    // Check the last guild membership (excluding current if any)
    uint256 lastIndex = memberIds.length - 1;
    if (GuildHistory.getCurMemberId(player) != 0) {
      lastIndex--;
    }

    if (lastIndex < 0) {
      return 0;
    }

    return GuildMember.getLeftAt(memberIds[lastIndex]);
  }

  function _getLastGuildIfKicked(address player) internal view returns (bool) {
    uint24[] memory memberIds = GuildHistory.getMemberIds(player);
    if (memberIds.length == 0) {
      return false;
    }

    // Check the last guild membership (excluding current if any)
    uint256 lastIndex = memberIds.length - 1;
    if (GuildHistory.getCurMemberId(player) != 0) {
      lastIndex--;
    }

    if (lastIndex < 0) {
      return false;
    }

    return GuildMember.getKicked(memberIds[lastIndex]);
  }

  function _checkGuildLeaveCooldown(address player) internal view {
    uint64 lastLeaveTick = _getLastGuildLeaveTick(player);
    if (lastLeaveTick == 0) return;
    bool kicked = _getLastGuildIfKicked(player);
    if (kicked) return;

    uint64 currentTick = uint64(DFUtils.getCurrentTick());
    if (currentTick - lastLeaveTick < GuildConfig.getCooldownTicks()) {
      revert GuildLeaveCooldownNotExpired();
    }
  }

  function _createGuild(uint256 guildId, address owner) internal returns (uint256 memberId) {
    memberId = (guildId << 16) | 1;

    uint playerSilver = PlayerWithdrawSilver.get(owner);

    GuildData memory guild = GuildData({
      status: GuildStatus.ACTIVE,
      rank: 1,
      number: 1,
      registry: 1,
      owner: uint24(memberId),
      silver: playerSilver
    });
    Guild.set(uint8(guildId), guild);

    GuildMember.set(
      uint24(memberId),
      GuildMemberData({
        role: GuildRole.LEADER,
        grant: GuildRole.NONE,
        joinedAt: uint64(DFUtils.getCurrentTick()),
        leftAt: 0,
        kicked: false,
        addr: owner
      })
    );
    GuildHistory.setCurMemberId(owner, uint24(memberId));
    // Add memberId to player's history
    GuildHistory.pushMemberIds(owner, uint24(memberId));
    // Clear all invitations and applications
    GuildCandidate.deleteRecord(owner);
  }

  function _joinGuild(uint256 guildId, address player) internal returns (uint256 memberId) {
    GuildData memory guild = Guild.get(uint8(guildId));
    // Verify guild is active
    if (guild.status != GuildStatus.ACTIVE) {
      revert GuildNotActive();
    }

    // Check if guild has reached max members
    if (guild.number >= GuildConfig.getMaxMembers()) {
      revert GuildMemberLimitReached();
    }

    uint playerSilver = PlayerWithdrawSilver.get(player);
    uint guildSilver = guild.silver + playerSilver;
    guild.silver = guildSilver;

    memberId = (guildId << 16) | ++guild.registry;
    ++guild.number;
    Guild.set(uint8(guildId), guild);

    GuildMember.set(
      uint24(memberId),
      GuildMemberData({
        role: GuildRole.MEMBER,
        grant: GuildRole.NONE,
        joinedAt: uint64(DFUtils.getCurrentTick()),
        leftAt: 0,
        kicked: false,
        addr: player
      })
    );
    GuildHistory.setCurMemberId(player, uint24(memberId));
    // Add memberId to player's history
    GuildHistory.pushMemberIds(player, uint24(memberId));
    // Clear all invitations and applications
    GuildCandidate.deleteRecord(player);
  }

  function _leaveGuild(uint256 guildId, uint256 memberId, address player) internal {
    uint guildSilver = Guild.getSilver(uint8(guildId));
    uint playerSilver = PlayerWithdrawSilver.get(player);
    Guild.setSilver(uint8(guildId), guildSilver - playerSilver);

    Guild.setNumber(uint8(guildId), Guild.getNumber(uint8(guildId)) - 1);
    GuildMember.setLeftAt(uint24(memberId), uint64(DFUtils.getCurrentTick()));
    GuildHistory.setCurMemberId(player, 0);
  }

  function _transferOwnership(uint256 guildId, uint256 newOwnerMemberId) internal {
    GuildData memory guild = Guild.get(uint8(guildId));
    // Verify guild is active
    if (guild.status != GuildStatus.ACTIVE) {
      revert GuildNotActive();
    }
    uint256 oldOwnerMemberId = guild.owner;
    Guild.setOwner(uint8(guildId), uint24(newOwnerMemberId));
    GuildMember.setRole(uint24(oldOwnerMemberId), GuildRole.MEMBER);
    GuildMember.setRole(uint24(newOwnerMemberId), GuildRole.LEADER);
  }

  function createGuild(string memory name) public payable {
    address owner = _msgSender();

    GlobalStats.setCreateGuildCount(GlobalStats.getCreateGuildCount() + 1);

    // Check if the creation fee is sufficient
    if (_msgValue() < GuildConfig.getCreateFee()) {
      revert NeedFundsToCreateGuild();
    }

    // Check if the player is registered
    if (!_isPlayerRegistered(owner)) {
      revert NotRegistered();
    }

    // Check if creator is already in another guild
    (bool inGuild, ) = _isInGuild(_msgSender());
    if (inGuild) {
      revert GuildRoleUnexpected();
    }

    // Check if the guild name is already taken
    uint256 guildId = uint256(Counter.getGuild()) + 1;
    if (guildId > 255) {
      revert GuildIdOverflow();
    }
    Counter.setGuild(uint8(guildId));

    _createGuild(guildId, owner);

    GuildName.set(uint8(guildId), name);

    ResourceId resourceId = SystemRegistry.get(address(this));
    bytes32 key = ResourceId.unwrap(resourceId);
    uint256 amount = RevenueStats.get(key) + _msgValue();
    RevenueStats.set(key, amount);
  }

  function inviteToGuild(address invitee) public {
    address inviter = _msgSender();

    // Check if the inviter is registered
    if (!_isPlayerRegistered(inviter)) {
      revert NotRegistered();
    }

    // Get inviter's guild role
    (GuildRole role, uint256 inviterMemberId) = _getGuildRole(inviter);
    if (role < GuildRole.OFFICER) {
      revert GuildRoleUnexpected();
    }

    // Check if invited player is registered
    if (!_isPlayerRegistered(invitee)) {
      revert NotRegistered();
    }

    // Check if invited player is already in a guild
    (bool inviteeInGuild, ) = _isInGuild(invitee);
    if (inviteeInGuild) {
      revert GuildRoleUnexpected();
    }

    // Add invitation to player's candidate record
    GuildCandidate.pushInvitations(invitee, uint8(inviterMemberId >> 16));
  }

  function acceptInvitation(uint8 guildId) public {
    address player = _msgSender();

    // Check if the player is registered
    if (!_isPlayerRegistered(player)) {
      revert NotRegistered();
    }

    // Check if player is already in another guild
    (bool inGuild, ) = _isInGuild(player);
    if (inGuild) {
      revert GuildRoleUnexpected();
    }
    if (Guild.getStatus(guildId) != GuildStatus.ACTIVE) {
      revert GuildNotActive();
    }

    // Check invitation exists
    bool invitationFound = false;
    uint8[] memory invitations = GuildCandidate.getInvitations(player);
    for (uint256 i = 0; i < invitations.length; i++) {
      if (invitations[i] == guildId) {
        invitationFound = true;
      }
    }
    if (!invitationFound) {
      revert GuildNotInvited();
    }

    _checkGuildLeaveCooldown(player);
    // Join guild as member
    _joinGuild(guildId, player);
  }

  function applyToGuild(uint8 guildId) public {
    address player = _msgSender();

    // Check if the player is registered
    if (!_isPlayerRegistered(player)) {
      revert NotRegistered();
    }

    // Check player is not already in a guild
    (bool playerInGuild, ) = _isInGuild(player);
    if (playerInGuild) {
      revert GuildRoleUnexpected();
    }

    // Verify guild is active
    if (Guild.getStatus(guildId) != GuildStatus.ACTIVE) {
      revert GuildNotActive();
    }

    _checkGuildLeaveCooldown(player);
    // Add application to player's candidate record
    GuildCandidate.pushApplications(player, guildId);
  }

  function approveApplication(address player) public {
    address operator = _msgSender();

    if (!_isPlayerRegistered(operator)) {
      revert NotRegistered();
    }

    if (!_isPlayerRegistered(player)) {
      revert NotRegistered();
    }

    // Check operator has permission
    (GuildRole role, uint256 operatorMemberId) = _getGuildRole(operator);
    if (role < GuildRole.OFFICER) {
      revert GuildRoleUnexpected();
    }
    uint8 guildId = uint8(operatorMemberId >> 16);

    // Check if player is already in another guild
    (bool inGuild, ) = _isInGuild(player);
    if (inGuild) {
      revert GuildRoleUnexpected();
    }

    if (Guild.getStatus(guildId) != GuildStatus.ACTIVE) {
      revert GuildNotActive();
    }

    // Check application exists
    bool applicationFound = false;
    uint8[] memory applications = GuildCandidate.getApplications(player);
    for (uint256 i = 0; i < applications.length; i++) {
      if (applications[i] == guildId) {
        applicationFound = true;
      }
    }
    if (!applicationFound) {
      revert GuildNotApplied();
    }

    // Join guild as member
    _joinGuild(guildId, player);
  }

  function leaveGuild() public {
    address player = _msgSender();

    if (!_isPlayerRegistered(player)) {
      revert NotRegistered();
    }

    // Check player is in a guild and not the owner
    (GuildRole role, uint256 memberId) = _getGuildRole(player);
    if (role == GuildRole.NONE || role == GuildRole.LEADER) {
      revert GuildRoleUnexpected();
    }

    // Leave guild
    _leaveGuild(uint8(memberId >> 16), memberId, player);
  }

  function transferGuildLeadership(address newOwner) public {
    address player = _msgSender();

    if (!_isPlayerRegistered(player)) {
      revert NotRegistered();
    }

    if (!_isPlayerRegistered(newOwner)) {
      revert NotRegistered();
    }

    (GuildRole role, uint256 memberId) = _getGuildRole(player);
    if (role != GuildRole.LEADER) {
      revert GuildRoleUnexpected();
    }

    uint8 guildId = uint8(memberId >> 16);

    // Verify guild is active
    if (Guild.getStatus(guildId) != GuildStatus.ACTIVE) {
      revert GuildNotActive();
    }

    (, uint256 newOwnerMemberId) = _isInGuild(newOwner);
    if (newOwnerMemberId >> 16 != guildId) {
      revert GuildRoleUnexpected();
    }

    _transferOwnership(guildId, newOwnerMemberId);
  }

  function disbandGuild() public {
    address player = _msgSender();

    if (!_isPlayerRegistered(player)) {
      revert NotRegistered();
    }

    (GuildRole role, uint256 memberId) = _getGuildRole(player);
    if (role != GuildRole.LEADER) {
      revert GuildRoleUnexpected();
    }

    uint256 guildId = uint8(memberId >> 16);
    GuildData memory guild = Guild.get(uint8(guildId));
    if (guild.number > 1) {
      revert GuildHasMembers();
    }

    // Disband guild
    guild.status = GuildStatus.DISBANDED;
    Guild.set(uint8(guildId), guild);

    // Leave guild
    _leaveGuild(uint8(memberId >> 16), memberId, player);
  }

  function setGrant(GuildRole newGrant) public {
    address player = _msgSender();

    // Check if player is registered
    if (!_isPlayerRegistered(player)) {
      revert NotRegistered();
    }

    // Get player's current guild role and memberId
    (GuildRole currentRole, uint256 memberId) = _getGuildRole(player);
    if (currentRole == GuildRole.NONE) {
      revert GuildRoleUnexpected();
    }

    if (
      newGrant == GuildRole.MEMBER ||
      newGrant == GuildRole.OFFICER ||
      newGrant == GuildRole.LEADER ||
      newGrant == GuildRole.NONE
    ) {
      // Update the grant role
      GuildMember.setGrant(uint24(memberId), newGrant);
    } else {
      revert GuildRoleUnexpected();
    }
  }

  function setMemberRole(address member, GuildRole newRole) public {
    address operator = _msgSender();

    // Check if operator is registered
    if (!_isPlayerRegistered(operator)) {
      revert NotRegistered();
    }

    // Check if target member is registered
    if (!_isPlayerRegistered(member)) {
      revert NotRegistered();
    }

    // Get operator's role and memberId
    (GuildRole operatorRole, uint256 operatorMemberId) = _getGuildRole(operator);
    if (operatorRole != GuildRole.LEADER) {
      revert GuildRoleUnexpected();
    }

    // Get member's role and memberId
    (GuildRole memberRole, uint256 memberMemberId) = _getGuildRole(member);
    if (memberRole == GuildRole.NONE) {
      revert GuildRoleUnexpected();
    }

    // Check they are in the same guild
    if ((operatorMemberId >> 16) != (memberMemberId >> 16)) {
      revert GuildRoleUnexpected();
    }

    // Cannot set LEADER role or NONE role
    if (newRole == GuildRole.LEADER || newRole == GuildRole.NONE) {
      revert GuildRoleUnexpected();
    }

    // Cannot change role of current leader
    if (memberRole == GuildRole.LEADER) {
      revert GuildRoleUnexpected();
    }

    // Set the member's role
    GuildMember.setRole(uint24(memberMemberId), newRole);
  }

  function kickMember(address member) public {
    address operator = _msgSender();

    // Check if operator is registered
    if (!_isPlayerRegistered(operator)) {
      revert NotRegistered();
    }

    // Check if target member is registered
    if (!_isPlayerRegistered(member)) {
      revert NotRegistered();
    }

    // Get operator's role and memberId
    (GuildRole operatorRole, uint256 operatorMemberId) = _getGuildRole(operator);
    if (operatorRole != GuildRole.LEADER) {
      revert GuildRoleUnexpected();
    }

    // Get member's role and memberId
    (GuildRole memberRole, uint256 memberMemberId) = _getGuildRole(member);
    if (memberRole == GuildRole.NONE || memberRole == GuildRole.LEADER) {
      revert GuildRoleUnexpected();
    }

    // Check they are in the same guild
    if ((operatorMemberId >> 16) != (memberMemberId >> 16)) {
      revert GuildRoleUnexpected();
    }

    // Kick member from guild
    _leaveGuild(uint8(memberMemberId >> 16), memberMemberId, member);
    GuildMember.setKicked((uint24(memberMemberId)), true);
  }
}
