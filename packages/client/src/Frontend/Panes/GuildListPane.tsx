import { formatNumber } from "@df/gamelogic";
import type { Guild } from "@df/types";
import React from "react";
import styled from "styled-components";

import { Btn } from "../Components/Btn";
import { CenterBackgroundSubtext, Spacer } from "../Components/CoreUI";
import { Sub } from "../Components/Text";
import { TextPreview } from "../Components/TextPreview";
import dfstyles from "../Styles/dfstyles";
import { useGuilds, useUIManager } from "../Utils/AppHooks";
import { SortableTable } from "../Views/SortableTable";

const GuildListContent = styled.div`
  width: 600px;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
  /* text-align: justify; */
  margin-top: 1em;
  margin-left: 1em;
  margin-right: 1em;
`;

const TableContainer = styled.div`
  overflow-y: scroll;
`;

type SetNumberFunction = (value: number) => void;
type SetStateFunction = (value: string) => void;

export function GuildListPane({
  setSelectedGuildId,
  setActiveFrame,
}: {
  setSelectedGuildId: SetNumberFunction;
  setActiveFrame: SetStateFunction;
}) {
  const uiManager = useUIManager();
  const guilds = useGuilds(uiManager).value.sort(
    (_a: Guild, _b: Guild): number => {
      return _b.silver - _a.silver;

      //   if (_a.silver !== _b.silver) return _b.silver - _a.silver;
      //   else {
      //     if (_a.highestRank === undefined) return 1;
      //     if (_b.highestRank === undefined) return -1;
      //     return _a.highestRank - _b.highestRank;
      //   }
    },
  );

  const headers = [
    "Id",
    "Name",
    "Leader",
    "Level",
    "Amount",
    "topPlayer",
    "unionScore",
    "Details",
  ];
  const alignments: Array<"r" | "c" | "l"> = [
    "r",
    "r",
    "r",
    "r",
    "r",
    "r",
    "r",
    "r",
  ];

  const columns = [
    //Id
    (guild: Guild) => <span style={{ width: "25px" }}> {guild.id} </span>,
    //Name
    (guild: Guild) => (
      <TextPreview
        style={{ color: dfstyles.colors.text }}
        text={guild.name}
        focusedWidth={"75px"}
        unFocusedWidth={"75px"}
      />
    ),
    //Leader
    (guild: Guild) => (
      <TextPreview
        style={{ color: dfstyles.colors.text }}
        text={guild.owner}
        focusedWidth={"100px"}
        unFocusedWidth={"100px"}
      />
    ),
    //Level
    (guild: Guild) => <Sub> {formatNumber(guild.number)}</Sub>,

    //Amount
    (guild: Guild) => <Sub> {formatNumber(guild.members.length)}</Sub>,

    //topPlayer
    (guild: Guild) => (
      <Sub> {"top player"}</Sub>
      //   <Sub> {guild.highestRank ? "rank #" + union.highestRank : "n/a"}</Sub>
    ),

    //unionScore
    (guild: Guild) => <Sub>{formatNumber(guild.silver)} </Sub>,

    //Details
    (guild: Guild) => (
      <span>
        <Btn
          onClick={() => {
            setSelectedGuildId(guild.id);
            setActiveFrame("detail");
          }}
        >
          Detail
        </Btn>
      </span>
    ),
  ];

  const sortingFunctions = [
    //Id
    (_a: Guild, _b: Guild): number => Number(_a.id) - Number(_b.id),
    //Name
    (_a: Guild, _b: Guild): number => {
      const [nameA, nameB] = [_a.name, _b.name];
      return nameA.localeCompare(nameB);
    },
    //Leader
    (_a: Guild, _b: Guild): number => {
      const [leaderA, leaderB] = [_a.owner, _b.owner];
      return leaderA.localeCompare(leaderB);
    },
    //Level
    //PUNK fix here
    (_a: Guild, _b: Guild): number =>
      Number(_a.members.length) - Number(_b.members.length),

    //Amount
    (_a: Guild, _b: Guild): number => _a.members.length - _b.members.length,

    // topPlayer
    (_a: Guild, _b: Guild): number => {
      //PUNK fix here
      return 1;

      if (_a.highestRank === undefined) return 1;
      if (_b.highestRank === undefined) return -1;
      return _a.highestRank - _b.highestRank;
    },

    //unionScore
    (_a: Guild, _b: Guild): number => {
      //PUNK fix here
      if (_a.silver !== _b.silver) return _b.silver - _a.silver;

      //   if (_a.score !== _b.score) return _b.score - _a.score;
      //   else {
      //     if (_a.highestRank === undefined) return 1;
      //     if (_b.highestRank === undefined) return -1;
      //     return _a.highestRank - _b.highestRank;
      //   }
    },

    //Details
    (_a: Guild, _b: Guild): number => 0,
  ];

  let content;
  if (guilds.length === 0) {
    content = (
      <CenterBackgroundSubtext width="600px" height="100px">
        There is no union right now.
      </CenterBackgroundSubtext>
    );
  } else {
    content = (
      <TableContainer>
        <SortableTable
          paginated={true}
          rows={guilds}
          headers={headers}
          columns={columns}
          sortFunctions={sortingFunctions}
          alignments={alignments}
        />
        <br />
      </TableContainer>
    );
  }

  return (
    <GuildListContent>
      {content}
      <Spacer height={8} />
    </GuildListContent>
  );
}
