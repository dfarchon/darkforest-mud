import { addressToHex } from "@df/serde";
import type {
  EthAddress,
  Guild,
  GuildId,
  GuildRole,
  GuildStatus,
} from "@df/types";
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
    const { Guild, GuildMember, GuildName } = this.components;
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

    const result: Guild = {
      id: guildId,
      status: guild.status as GuildStatus,
      rank: guild.rank,
      number: guild.number,
      registry: guild.number,
      owner: guildOwner.addr.toLowerCase() as EthAddress,
      name: guildName.name as string,
      members: members,
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

  public isInvitedToGuild(playerAddr: EthAddress, guildId: GuildId): boolean {
    const { GuildCandidate } = this.components;

    const candidateEntity = encodeEntity(GuildCandidate.metadata.keySchema, {
      player: addressToHex(playerAddr) as Hex,
    });

    const candidate = getComponentValue(GuildCandidate, candidateEntity);
    if (!candidate) return false;

    // PUNK check here
    console.log(candidate.invitations);
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

    return member.leftAt;
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
}
