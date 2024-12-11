// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { GuildStatus, GuildRole } from "../codegen/common.sol";
import { Counter } from "../codegen/tables/Counter.sol";
import { Guild, GuildData } from "../codegen/tables/Guild.sol";
import { GuildName } from "../codegen/tables/GuildName.sol";
import { GuildMember, GuildMemberData } from "../codegen/tables/GuildMember.sol";
import { GuildHistory } from "../codegen/tables/GuildHistory.sol";
import { GuildCandidate } from "../codegen/tables/GuildCandidate.sol";
import { Planet } from "../lib/Planet.sol";
import { SpaceType, PlanetType } from "../codegen/common.sol";
import { DFUtils } from "../lib/DFUtils.sol";

contract GuildSystem is System {
  error NeedFundsToCreateGuild(); // 0xce43bd9e
  error GuildIdOverflow(); // 0x46aea226
  error GuildRoleUnexpected(); // 0x26f8cb41
  error GuildNotActive(); // 0x4db8e461
  error GuildNotInvited(); // 0x10d249a5
  error GuildNotApplied(); // 0x1a6d3a07
  error GuildHasMembers(); // 0xabb7f52d

  function createGuild(string memory name) public {
    if (_msgValue() < 0.005 ether) {
      revert NeedFundsToCreateGuild();
    }

    uint256 id = uint256(Counter.getGuild()) + 1;
    if (id > 255) {
      revert GuildIdOverflow();
    }
    Counter.setGuild(uint8(id));

    _createGuild(id, _msgSender());
    GuildName.set(uint8(id), name);
  }

  function inviteToGuild(address invitee) public {
    address inviter = _msgSender();

    // Get inviter's guild role
    (GuildRole role, uint256 inviterMemberId) = _getGuildRole(inviter);
    if (role < GuildRole.OFFICER) {
      revert GuildRoleUnexpected();
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

    // Check invitation exists
    bool invitationFound = false;
    uint8[] memory invitations = GuildCandidate.getInvitations(player);
    for (uint i = 0; i < invitations.length; i++) {
      if (invitations[i] == guildId) {
        invitationFound = true;
      }
    }
    if (!invitationFound) {
      revert GuildNotInvited();
    }

    // Join guild as member
    _joinGuild(guildId, player);
  }

  function applyToGuild(uint8 guildId) public {
    address player = _msgSender();

    // Check player is not already in a guild
    (bool playerInGuild, ) = _isInGuild(player);
    if (playerInGuild) {
      revert GuildRoleUnexpected();
    }

    // Verify guild is active
    if (Guild.getStatus(guildId) != GuildStatus.ACTIVE) {
      revert GuildNotActive();
    }

    // Add application to player's candidate record
    GuildCandidate.pushApplications(player, guildId);
  }

  function approveApplication(address player) public {
    address operator = _msgSender();

    // Check operator has permission
    (GuildRole role, uint256 operatorMemberId) = _getGuildRole(operator);
    if (role < GuildRole.OFFICER) {
      revert GuildRoleUnexpected();
    }
    uint256 guildId = uint8(operatorMemberId >> 16);

    // Check application exists
    bool applicationFound = false;
    uint8[] memory applications = GuildCandidate.getApplications(player);
    for (uint i = 0; i < applications.length; i++) {
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

    // Check player is in a guild and not the owner
    (GuildRole role, uint256 memberId) = _getGuildRole(player);
    if (role == GuildRole.NONE || role == GuildRole.OWNER) {
      revert GuildRoleUnexpected();
    }

    // Leave guild
    _leaveGuild(uint8(memberId >> 16), memberId, player);
  }

  function transferOwnership(address newOwner) public {
    address player = _msgSender();
    (GuildRole role, uint256 memberId) = _getGuildRole(player);
    if (role != GuildRole.OWNER) {
      revert GuildRoleUnexpected();
    }
    uint256 guildId = uint8(memberId >> 16);
    (, uint256 newOwnerMemberId) = _isInGuild(newOwner);
    if (newOwnerMemberId >> 16 != guildId) {
      revert GuildRoleUnexpected();
    }

    _transferOwnership(guildId, newOwnerMemberId);
  }

  function disbandGuild() public {
    address player = _msgSender();
    (GuildRole role, uint256 memberId) = _getGuildRole(player);
    if (role != GuildRole.OWNER) {
      revert GuildRoleUnexpected();
    }
    uint256 guildId = uint8(memberId >> 16);
    GuildData memory guild = Guild.get(uint8(guildId));
    if (guild.number > 1) {
      revert GuildHasMembers();
    }

    // Disband guild
    guild.status = GuildStatus.DISBANDED;
    guild.number = 0;
    Guild.set(uint8(guildId), guild);
  }

  function _createGuild(uint256 guildId, address owner) internal returns (uint256 memberId) {
    memberId = (guildId << 16) | 1;
    GuildData memory guild = GuildData({
      status: GuildStatus.ACTIVE,
      rank: 1,
      number: 1,
      registry: 1,
      owner: uint24(memberId)
    });
    Guild.set(uint8(guildId), guild);

    GuildMember.set(
      uint24(memberId),
      GuildMemberData({
        role: GuildRole.OWNER,
        grant: GuildRole.NONE,
        joinedAt: uint64(DFUtils.getCurrentTick()),
        leftAt: 0,
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
    GuildMember.setRole(uint24(newOwnerMemberId), GuildRole.OWNER);
    GuildMember.setRole(uint24(oldOwnerMemberId), GuildRole.MEMBER);
  }

  function _getGuildRole(address player) internal view returns (GuildRole, uint256) {
    (bool inGuild, uint256 memberId) = _isInGuild(player);
    if (!inGuild) {
      return (GuildRole.NONE, 0);
    }
    return (GuildMember.getRole(uint24(memberId)), memberId);
  }

  function _isInGuild(address player) internal view returns (bool, uint256) {
    uint256 curMemberId = GuildHistory.getCurMemberId(player);
    return (curMemberId != 0, curMemberId);
  }
}
