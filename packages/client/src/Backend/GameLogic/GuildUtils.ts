import { CONTRACT_PRECISION } from "@df/constants";
import { addressToHex, hexToEthAddress } from "@df/serde";
import type { EthAddress, Guild, GuildId, GuildRole } from "@df/types";
import { GuildStatus } from "@df/types";
import {
  type Entity,
  getComponentValue,
  getComponentValueStrict,
  Has,
  runQuery,
} from "@latticexyz/recs";
import { encodeEntity } from "@latticexyz/store-sync/recs";
import type { ClientComponents } from "@mud/createClientComponents";
import type { Hex } from "viem";

import { TickerUtils } from "./TickerUtils";
interface GuildUtilsConfig {
  components: ClientComponents;
}

export class GuildUtils {
  private components: ClientComponents;
  private tickerUtils: TickerUtils;

  public constructor({ components }: GuildUtilsConfig) {
    this.components = components;
    this.tickerUtils = new TickerUtils({ components });
  }

  public getCreateGuildFee(): bigint | undefined {
    const { GuildConfig } = this.components;
    const guildConfigEntity = encodeEntity(GuildConfig.metadata.keySchema, {});
    const guildConfig = getComponentValue(GuildConfig, guildConfigEntity);
    if (!guildConfig) return undefined;
    return guildConfig.createFee;
  }

  public getMaxGuildMembers(): number | undefined {
    const { GuildConfig } = this.components;
    const guildConfigEntity = encodeEntity(GuildConfig.metadata.keySchema, {});
    const guildConfig = getComponentValue(GuildConfig, guildConfigEntity);
    if (!guildConfig) return undefined;
    return Number(guildConfig.maxMembers);
  }

  public getGuildCooldownTicks(): number | undefined {
    const { GuildConfig } = this.components;
    const guildConfigEntity = encodeEntity(GuildConfig.metadata.keySchema, {});
    const guildConfig = getComponentValue(GuildConfig, guildConfigEntity);
    if (!guildConfig) return undefined;
    return Number(guildConfig.cooldownTicks);
  }

  public getGuildById(guildId?: GuildId): Guild | undefined {
    if (!guildId) return undefined;
    const { Guild, GuildMember, GuildName, Player, GuildCandidate } =
      this.components;
    const guildEntity = encodeEntity(Guild.metadata.keySchema, {
      id: guildId,
    });

    const guild = getComponentValue(Guild, guildEntity);
    if (!guild) return undefined;

    const guildOwnerEntity = encodeEntity(GuildMember.metadata.keySchema, {
      memberId: guild.owner,
    });
    const guildOwner = getComponentValue(GuildMember, guildOwnerEntity);
    if (!guildOwner) return undefined;

    const guildNameEntity = encodeEntity(GuildName.metadata.keySchema, {
      id: guildId,
    });
    const guildName = getComponentValue(GuildName, guildNameEntity);
    if (!guildName) return undefined;

    const registry = guild.registry;

    const members: EthAddress[] = [];

    for (let i = 1; i <= registry; i++) {
      const memberEntity = encodeEntity(GuildMember.metadata.keySchema, {
        memberId: (guildId << 16) + i,
      });
      const member = getComponentValue(GuildMember, memberEntity);
      if (!member) continue;
      if (member.leftAt !== 0n) continue;
      members.push(member.addr.toLowerCase() as EthAddress);
    }

    const players = [...runQuery([Has(Player)])];

    const invitees: EthAddress[] = [];
    const applicants: EthAddress[] = [];

    for (let i = 0; i < players.length; i++) {
      const addr = hexToEthAddress(players[i] as Hex);
      const candidateEntity = encodeEntity(GuildCandidate.metadata.keySchema, {
        player: addr,
      });
      const candidate = getComponentValue(GuildCandidate, candidateEntity);
      if (!candidate) continue;

      if (candidate.invitations.includes(guildId)) invitees.push(addr);
      if (candidate.applications.includes(guildId)) applicants.push(addr);
    }

    const result: Guild = {
      id: guildId,
      status: guild.status as GuildStatus,
      rank: guild.rank,
      number: guild.number,
      registry: guild.number,
      owner: guildOwner.addr.toLowerCase() as EthAddress,
      name: guildName.name as string,
      members: members,
      silver: Math.floor(Number(guild.silver) / CONTRACT_PRECISION),
      invitees: invitees,
      applicants: applicants,
    };

    return result;
  }

  public getGuildIds(): GuildId[] {
    const { Guild } = this.components;
    const guildIds = [...runQuery([Has(Guild)])];
    return guildIds.map((id) => Number(id.toString()) as GuildId);
  }

  public getGuildIdByPlayer(playerAddr: EthAddress): GuildId | undefined {
    const { GuildHistory } = this.components;
    const historyEntity = encodeEntity(GuildHistory.metadata.keySchema, {
      player: addressToHex(playerAddr) as Hex,
    });
    const history = getComponentValue(GuildHistory, historyEntity);
    if (!history) return undefined;
    const guildId = Number(history.curMemberId >> 16);
    if (guildId === 0) return undefined;
    return guildId as GuildId;
  }

  public getGuildRole(playerAddr: EthAddress): GuildRole | undefined {
    if (this.getGuildIdByPlayer(playerAddr) === undefined) return undefined;

    const { GuildHistory, GuildMember } = this.components;

    const guildHistoryEntity = encodeEntity(GuildHistory.metadata.keySchema, {
      player: addressToHex(playerAddr) as Hex,
    });

    const guildHistory = getComponentValue(GuildHistory, guildHistoryEntity);
    if (!guildHistory) return undefined;

    const guildMemberEntity = encodeEntity(GuildMember.metadata.keySchema, {
      memberId: guildHistory.curMemberId,
    });
    const guildMember = getComponentValue(GuildMember, guildMemberEntity);
    if (!guildMember) return undefined;
    return guildMember.role as GuildRole;
  }

  public getPlayerGrant(playerAddr: EthAddress): GuildRole | undefined {
    if (this.getGuildIdByPlayer(playerAddr) === undefined) return undefined;

    const { GuildHistory, GuildMember } = this.components;

    const guildHistoryEntity = encodeEntity(GuildHistory.metadata.keySchema, {
      player: addressToHex(playerAddr) as Hex,
    });

    const guildHistory = getComponentValue(GuildHistory, guildHistoryEntity);
    if (!guildHistory) return undefined;

    const guildMemberEntity = encodeEntity(GuildMember.metadata.keySchema, {
      memberId: guildHistory.curMemberId,
    });
    const guildMember = getComponentValue(GuildMember, guildMemberEntity);
    if (!guildMember) return undefined;
    return guildMember.grant as GuildRole;
  }

  public isInvitedToGuild(playerAddr: EthAddress, guildId: GuildId): boolean {
    const { GuildCandidate } = this.components;

    const candidateEntity = encodeEntity(GuildCandidate.metadata.keySchema, {
      player: addressToHex(playerAddr) as Hex,
    });

    const candidate = getComponentValue(GuildCandidate, candidateEntity);
    if (!candidate) return false;

    // PUNK check here
    // console.log(candidate.invitations);
    return candidate.invitations.includes(guildId);
  }

  public getPlayerLastLeaveTick(playerAddr: EthAddress): bigint | undefined {
    const { GuildHistory, GuildMember } = this.components;

    // Get player's member history
    const historyEntity = encodeEntity(GuildHistory.metadata.keySchema, {
      player: addressToHex(playerAddr) as Hex,
    });

    const history = getComponentValue(GuildHistory, historyEntity);
    if (!history || !history.memberIds.length) return undefined;

    // Get the last membership (excluding current if any)
    let lastIndex = history.memberIds.length - 1;
    const currentMemberId = history.curMemberId;

    if (currentMemberId !== 0) {
      lastIndex--;
    }

    if (lastIndex < 0) return undefined;

    // Get the last leave timestamp
    const lastMemberId = history.memberIds[lastIndex];
    const memberEntity = encodeEntity(GuildMember.metadata.keySchema, {
      memberId: lastMemberId,
    });

    const member = getComponentValue(GuildMember, memberEntity);
    if (!member) return undefined;

    if (member.kicked) return undefined;

    return member.leftAt;
  }

  public getGuildRejoinCooldownTicks(): number {
    const { GuildConfig } = this.components;
    // Get cooldown period from config
    const configEntity = encodeEntity(
      GuildConfig.metadata.keySchema,
      {},
    ) as Entity;
    const config = getComponentValueStrict(GuildConfig, configEntity);
    return Number(config.cooldownTicks);
  }

  public getPlayerLastLeaveGuildTick(
    playerAddr: EthAddress,
  ): number | undefined {
    const lastLeaveTick = this.getPlayerLastLeaveTick(playerAddr);
    if (!lastLeaveTick) return undefined;

    return Number(lastLeaveTick);
  }

  public checkGuildLeaveCooldown(playerAddr: EthAddress): boolean {
    const { GuildConfig } = this.components;

    const lastLeaveTick = this.getPlayerLastLeaveTick(playerAddr);
    if (!lastLeaveTick) return true; // No previous guild means no cooldown

    const currentTick = this.tickerUtils.getCurrentTick();

    // Get cooldown period from config
    const configEntity = encodeEntity(
      GuildConfig.metadata.keySchema,
      {},
    ) as Entity;
    const config = getComponentValueStrict(GuildConfig, configEntity);

    return (
      Number(currentTick) - Number(lastLeaveTick) >=
      Number(config.cooldownTicks)
    );
  }

  /**
   * Check if two accounts meet the delegation conditions
   * @param delegator The address of the delegator
   * @param delegate The address of the delegate
   * @returns {boolean} Whether the delegation conditions are met
   */
  public checkDelegateCondition(
    delegator?: EthAddress,
    delegate?: EthAddress,
  ): boolean {
    if (!delegator || !delegate) return false;

    if (delegator === delegate) return true;
    try {
      // Check if accounts are the same (self-delegation is not allowed)
      if (delegator.toLowerCase() === delegate.toLowerCase()) {
        throw new Error("cannot delegate to yourself");
      }

      // Get guild IDs for both accounts
      const delegatorGuildId = this.getGuildIdByPlayer(delegator);
      const delegateGuildId = this.getGuildIdByPlayer(delegate);

      // Check if both accounts are in a guild
      if (!delegatorGuildId || !delegateGuildId) {
        return false;
        throw new Error("one or both players are not in a guild");
      }

      // Check if they are in the same guild
      if (delegatorGuildId !== delegateGuildId) {
        return false;
        throw new Error("players must be in the same guild");
      }

      // Check if the guild is active
      const guild = this.getGuildById(delegatorGuildId);
      if (!guild || guild.status !== GuildStatus.ACTIVE) {
        throw new Error("guild is not active");
      }

      const delegatorGrant = this.getPlayerGrant(delegator);
      const delegateRole = this.getGuildRole(delegate);

      if (!delegatorGrant || !delegateRole) {
        throw new Error("delegator grant or delegate role is wrong");
        return false;
      }

      if (delegatorGrant > delegateRole) {
        throw new Error("delegator has higher grant role than delegate");
        return false;
      }

      return true;
    } catch (e) {
      console.log("Delegate condition check failed:", (e as Error).message);
      return false;
    }
  }

  /**
   * Get player's guild ID at a specific tick
   * @param playerAddr Player's address
   * @param tick Target tick
   * @returns Guild ID or undefined if not in a guild
   */
  public getPlayerGuildIdAtTick(
    playerAddr: EthAddress,
    tick: number,
  ): GuildId | undefined {
    const { GuildHistory, GuildMember } = this.components;

    // Get player's member history
    const historyEntity = encodeEntity(GuildHistory.metadata.keySchema, {
      player: addressToHex(playerAddr) as Hex,
    });

    const history = getComponentValue(GuildHistory, historyEntity);
    if (!history || !history.memberIds.length) return undefined;

    // Go through member history to find the guild at the given tick
    for (let i = history.memberIds.length - 1; i >= 0; i--) {
      const memberId = history.memberIds[i];
      const memberEntity = encodeEntity(GuildMember.metadata.keySchema, {
        memberId: memberId,
      });

      const member = getComponentValue(GuildMember, memberEntity);
      if (!member) continue;

      // If member joined before or at the tick and either hasn't left or left after the tick
      if (
        Number(member.joinedAt) <= tick &&
        (member.leftAt === 0n || Number(member.leftAt) > tick)
      ) {
        return Number(memberId >> 16) as GuildId;
      }
    }

    return undefined;
  }

  /**
   * Check if two players were in the same guild at a specific tick
   * @param player1 First player's address
   * @param player2 Second player's address
   * @param tick Target tick
   * @returns {boolean} True if players were in the same guild, false otherwise
   */
  public inSameGuildAtTick(
    player1?: EthAddress,
    player2?: EthAddress,
    tick?: number,
  ): boolean {
    if (!player1 || !player2) return false;
    if (!tick) return false;
    try {
      // Get guild IDs for both players at the specified tick
      const guild1 = this.getPlayerGuildIdAtTick(player1, tick);
      const guild2 = this.getPlayerGuildIdAtTick(player2, tick);

      // If either player wasn't in a guild, return false
      if (!guild1 || !guild2) {
        return false;
      }

      // Check if guild IDs match
      return guild1 === guild2;
    } catch (e) {
      console.log("Error checking same guild at tick:", (e as Error).message);
      return false;
    }
  }

  /**
   * Check if two players are currently in the same guild
   * @param player1 First player's address
   * @param player2 Second player's address
   * @returns {boolean} True if players are in the same guild, false otherwise
   */
  public inSameGuildRightNow(
    player1?: EthAddress,
    player2?: EthAddress,
  ): boolean {
    if (!player1 || !player2) return false;
    try {
      // Get current guild IDs for both players
      const guild1 = this.getGuildIdByPlayer(player1);
      const guild2 = this.getGuildIdByPlayer(player2);

      // If either player is not in a guild, return false
      if (!guild1 || !guild2) {
        return false;
      }

      // Check if guild IDs match
      return guild1 === guild2;
    } catch (e) {
      console.log("Error checking same guild:", (e as Error).message);
      return false;
    }
  }
}
