import type { EthAddress, Guild } from "@df/types";
import React, { useEffect, useState } from "react";
import styled from "styled-components";

import type { GameUIManager } from "../../Backend/GameLogic/GameUIManager";
import {
  AlignCenterHorizontally,
  EmSpacer,
  SpreadApart,
} from "../Components/CoreUI";
import dfstyles, { snips } from "../Styles/dfstyles";
import { SortableTable } from "../Views/SortableTable";

export const GuildDetailSection = styled.div`
  padding: 0.5em 0;

  &:first-child {
    margin-top: -8px;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const GuildInfoContent = styled.div`
  margin-left: 1em;
  margin-right: 1em;
`;

const InfoHead = styled.div`
  text-align: left;
  font-size: 120%;
  font-weight: bold;
  color: yellow;
`;

const ElevatedContainer = styled.div`
  ${snips.roundedBordersWithEdge}
  border-color: ${dfstyles.colors.borderDarker};
  background-color: ${dfstyles.colors.backgroundlight};
  margin-top: 8px;
  margin-bottom: 8px;
  font-size: 100%;
`;

const StatRow = styled(AlignCenterHorizontally)`
  ${snips.roundedBorders}
  display: inline-block;
  box-sizing: border-box;
  width: 100%;

  /* Set the Icon color to something a little dimmer */
  --df-icon-color: ${dfstyles.colors.subtext};
`;

const HalfRow = styled.div`
  border: 1px solid ${dfstyles.colors.borderDarker};
  border-top: none;
  border-left: none;
  width: 50%;
`;

const LeaderRow = styled.div`
  border: 1px solid ${dfstyles.colors.borderDarker};
  border-top: none;
  display: flex;
  /* flex-direction: row;
  justify-content: space-between; */
  align-items: center;
  width: 100%;
`;

type GuildMemberInfo = {
  address: EthAddress;
  role: string; // 'leader' or ''
  silver: number;
};

export const GuildInfoPane: React.FC<{
  guild: Guild;
  uiManager: GameUIManager;
}> = ({ guild, uiManager }) => {
  const gameManager = uiManager.getGameManager();
  const [guildMemberInfos, setGuildMemberInfos] = useState<GuildMemberInfo[]>(
    [],
  );

  useEffect(() => {
    if (!uiManager || !gameManager) return;

    let isMounted = true;

    const refreshData = async () => {
      const infoArrays: GuildMemberInfo[] = [];
      for (let i = 0; i < guild.members.length; i++) {
        const address = guild.members[i];
        const player = gameManager.getPlayer(address);
        if (!player) continue;
        const role_number = gameManager.getGuildRole(address);
        let role = "member";
        if (role_number === 3) role = "leader";
        if (role_number === 2) role = "officer";
        const silver = player.silver ? player.silver : 0;

        const info: GuildMemberInfo = {
          address: address,
          role: role,
          silver: silver,
        };
        infoArrays.push(info);
      }

      if (isMounted) {
        setGuildMemberInfos(infoArrays);
      }
    };
    refreshData();
    return () => {
      isMounted = false;
    };
  }, [guild, uiManager, gameManager]);

  // refresh infos every 10 seconds

  useEffect(() => {
    if (!uiManager || !gameManager) return;

    const refreshData = async () => {
      const infoArrays: GuildMemberInfo[] = [];
      for (let i = 0; i < guild.members.length; i++) {
        const address = guild.members[i];
        const player = gameManager.getPlayer(address);
        if (!player) continue;
        const role = address === guild.owner ? "leader" : "";
        const silver = player.silver ? player.silver : 0;

        const info: GuildMemberInfo = {
          address: address,
          role: role,
          silver: silver,
        };
        infoArrays.push(info);
      }
      setGuildMemberInfos(infoArrays);
    };

    const intervalId = setInterval(refreshData, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [guild, uiManager, gameManager]);

  const headers = ["address", "role", "silver"];
  const alignments: Array<"r" | "c" | "l"> = ["l", "r", "r"];
  const columns = [
    //address
    (guildMemberInfo: GuildMemberInfo) => (
      <span> {guildMemberInfo.address}</span>
    ),
    (guildMemberInfo: GuildMemberInfo) => <span> {guildMemberInfo.role}</span>,

    (guildMemberInfo: GuildMemberInfo) => (
      <span> {Math.floor(guildMemberInfo.silver / 1000).toLocaleString()}</span>
    ),
  ];

  const sortingFunctions = [
    //address
    (_a: GuildMemberInfo, _b: GuildMemberInfo) => (_a < _b ? 1 : -1),
    (_a: GuildMemberInfo, _b: GuildMemberInfo) =>
      // eslint-disable-next-line no-nested-ternary
      _a.role === "leader" ? -1 : _b.role === "leader" ? -1 : 0,

    (_a: GuildMemberInfo, _b: GuildMemberInfo) => _b.silver - _a.silver,
  ];

  return (
    <GuildInfoContent>
      <InfoHead>
        {guild.name && guild.name.length !== 0
          ? "✨✨✨ " +
            guild.name.toUpperCase() +
            " GUILD (ID:" +
            guild.id +
            ") ✨✨✨"
          : "✨✨✨ ANONYMOUS GUILD (ID:" + guild.id + ") ✨✨✨"}
      </InfoHead>

      <ElevatedContainer>
        <StatRow>
          <SpreadApart>
            <HalfRow>
              <SpreadApart>
                <AlignCenterHorizontally>
                  <EmSpacer width={1} />
                  Members Total
                </AlignCenterHorizontally>
                <AlignCenterHorizontally>
                  {guild.members.length}
                  <EmSpacer width={1} />
                </AlignCenterHorizontally>
              </SpreadApart>
            </HalfRow>
            <HalfRow>
              <SpreadApart>
                <AlignCenterHorizontally>
                  <EmSpacer width={1} />
                  Memebers Max
                </AlignCenterHorizontally>
                <AlignCenterHorizontally>
                  {gameManager
                    .getContractAPI()
                    .getGuildUtils()
                    .getMaxGuildMembers()}
                  <EmSpacer width={1} />
                </AlignCenterHorizontally>
              </SpreadApart>
            </HalfRow>
          </SpreadApart>
        </StatRow>

        <StatRow>
          <SpreadApart>
            <HalfRow>
              <SpreadApart>
                <AlignCenterHorizontally>
                  <EmSpacer width={1} />
                  Guild Silver
                </AlignCenterHorizontally>
                <AlignCenterHorizontally>
                  {guild.silver.toLocaleString()}
                  <EmSpacer width={1} />
                </AlignCenterHorizontally>
              </SpreadApart>
            </HalfRow>
            <HalfRow>
              <SpreadApart>
                <AlignCenterHorizontally>
                  <EmSpacer width={1} />
                  {""}
                </AlignCenterHorizontally>
                <AlignCenterHorizontally>
                  {""}
                  <EmSpacer width={1} />
                </AlignCenterHorizontally>
              </SpreadApart>
            </HalfRow>
          </SpreadApart>
        </StatRow>

        <SortableTable
          paginated={true}
          rows={guildMemberInfos}
          headers={headers}
          columns={columns}
          sortFunctions={sortingFunctions}
          alignments={alignments}
        ></SortableTable>
      </ElevatedContainer>
    </GuildInfoContent>
  );
};
