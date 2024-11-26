// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { GuildStatus, GuildRole } from "../codegen/common.sol";
import { Counter } from "../codegen/tables/Counter.sol";
import { Ticker, TickerData } from "../codegen/tables/Ticker.sol";
import { Guild, GuildData } from "../codegen/tables/Guild.sol";
import { GuildName } from "../codegen/tables/GuildName.sol";
import { GuildMember, GuildMemberData } from "../codegen/tables/GuildMember.sol";
import { GuildHistory } from "../codegen/tables/GuildHistory.sol";
import { GuildCandidate } from "../codegen/tables/GuildCandidate.sol";
import { Planet } from "../lib/Planet.sol";
import { SpaceType, PlanetType } from "../codegen/common.sol";

contract GuildSystem is System {
  error NeedFundsToCreateGuild();
  error GuildIdOverflow();
  error NotGuildOwnerOrOfficer();
  error GuildNotActive();
  error AlreadyInGuild();
  error GuildNotInvited();
  error GuildNotApplied();

  function createGuild(string memory name) public {
    if (_msgValue() < 0.005 ether) {
      revert NeedFundsToCreateGuild();
    }

    uint256 id = uint256(Counter.getGuild()) + 1;
    if (id > 255) {
      revert GuildIdOverflow();
    }
    Counter.setGuild(uint8(id));

    address owner = _msgSender();

    Guild.set(uint8(id), GuildData({ status: GuildStatus.ACTIVE, rank: 1, number: 1, registry: 1, owner: owner }));
    GuildName.set(uint8(id), name);
    _joinGuild((id << 16) | 1, owner, GuildRole.OWNER);
  }

  function inviteToGuild(address invitee) public {
    address inviter = _msgSender();

    // Check if inviter is in a guild and get their memberId
    (bool inviterInGuild, uint256 inviterMemberId) = _isInGuild(inviter);
    if (!inviterInGuild) {
      revert NotGuildOwnerOrOfficer();
    }

    // Get inviter's guild role
    GuildMemberData memory inviterMembership = GuildMember.get(uint24(inviterMemberId));
    if (inviterMembership.role != GuildRole.OWNER && inviterMembership.role != GuildRole.OFFICER) {
      revert NotGuildOwnerOrOfficer();
    }

    // Check if invited player is already in a guild
    (bool inviteeInGuild, ) = _isInGuild(invitee);
    if (inviteeInGuild) {
      revert AlreadyInGuild();
    }

    // Add invitation to player's candidate record
    GuildCandidate.pushInvitations(invitee, uint8(inviterMemberId >> 16));
  }

  function acceptInvitation(uint8 guildId) public {
    address player = _msgSender();

    // Check player is not already in a guild
    (bool playerInGuild, ) = _isInGuild(player);
    if (playerInGuild) {
      revert AlreadyInGuild();
    }

    // Verify guild is active
    GuildData memory guild = Guild.get(guildId);
    if (guild.status != GuildStatus.ACTIVE) {
      revert GuildNotActive();
    }

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
    uint256 memberId = (uint256(guildId) << 16) | ++guild.registry;
    ++guild.number;
    Guild.set(guildId, guild);

    _joinGuild(memberId, player, GuildRole.MEMBER);

    // Clear all invitations and applications
    GuildCandidate.deleteRecord(player);
  }

  function _joinGuild(uint256 memberId, address player, GuildRole role) internal {
    GuildMember.set(
      uint24(memberId),
      GuildMemberData({ role: role, grant: GuildRole.NONE, joinedAt: uint64(_getCurrentTick()), leftAt: 0 })
    );
    GuildHistory.setCurMemberId(player, uint24(memberId));
    GuildHistory.pushMemberIds(player, uint24(memberId));
  }

  function _leaveGuild(uint256 memberId, address player) internal {
    GuildMember.setLeftAt(uint24(memberId), uint64(_getCurrentTick()));
    GuildHistory.setCurMemberId(player, 0);
  }

  function _getCurrentTick() internal view returns (uint256) {
    TickerData memory ticker = Ticker.get();
    if (ticker.paused) {
      return ticker.tickNumber;
    }
    return ticker.tickNumber + uint64((block.timestamp - ticker.timestamp) * ticker.tickRate);
  }

  function _isInGuild(address player) internal view returns (bool, uint256) {
    uint256 curMemberId = GuildHistory.getCurMemberId(player);
    return (curMemberId != 0, curMemberId);
  }
}
