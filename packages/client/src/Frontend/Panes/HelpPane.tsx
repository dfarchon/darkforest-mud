import {
  BLOCK_EXPLORER_URL,
  PLAYER_GUIDE,
  WIN_CONDITION_AND_PRIZES,
} from "@df/constants";
import { ModalName } from "@df/types";
import React from "react";
import styled from "styled-components";

import { Link, Section, SectionHeader } from "../Components/CoreUI";
import { Pink } from "../Components/Text";
import dfstyles from "../Styles/dfstyles";
import { useUIManager } from "../Utils/AppHooks";
import { ModalPane } from "../Views/ModalPane";

const HelpContent = styled.div`
  width: 500px;
  height: 700px;
  max-height: 700px;
  max-width: 500px;
  overflow-y: scroll;
  text-align: justify;
  color: ${dfstyles.colors.text};
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
`;

const StyledTh = styled.th`
  border: 1px solid #dddddd;
  padding: 8px;
  text-align: center;
  /* background-color: #f2f2f2; */
`;

const StyledTd = styled.td`
  border: 1px solid #dddddd;
  padding: 8px;
  text-align: center;
`;

interface RowData {
  hotkey: string;
  intro: string;
}

interface TableProps {
  data: RowData[];
}

export function HelpPane({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const uiManager = useUIManager();

  // // const silverScoreValue = uiManager.getSilverScoreValue();
  // const artifactPointValues = uiManager.getArtifactPointValues();
  // const captureZonePointValues = uiManager.getCaptureZonePointValues();

  const DFArchonLinks = {
    twitter: "https://twitter.com/DFArchon",
    email: "mailto:dfarchon@gmail.com",
    blog: "https://mirror.xyz/dfarchon.eth",
    discord: "https://discord.com/invite/XpBPEnsvgX",
    github: "https://github.com/dfarchon",
    wiki: "https://dfwiki.net/wiki/Main_Page",
    plugins: "https://dfares-plugins.netlify.app/",
  };

  const data = [
    { hotkey: "n", intro: "toggle terminal" },
    { hotkey: "m", intro: "toggle around-screen panes" },
    { hotkey: ",", intro: "toggle bottom hotkey pane" },
    // { hotkey: "g", intro: "you can buy planet & spaceship here" }, // PUNK
    { hotkey: "p", intro: "toggle wallet pane" },
    { hotkey: "h", intro: "help pane" },
    { hotkey: "j", intro: "settings pane" },
    { hotkey: "k", intro: "plugins pane" },
    // { hotkey: "l", intro: "your artifacts pane" },
    { hotkey: ";", intro: "your planets pane" },
    { hotkey: "'", intro: "transactions pane" },
    { hotkey: "i", intro: "diagnostics pane" },
    { hotkey: "g", intro: "toggle guild pane" },
  ];

  const Table: React.FC<TableProps> = ({ data }) => {
    return (
      <StyledTable>
        <thead>
          <tr>
            <StyledTh>Hotkey</StyledTh>
            <StyledTh>Intro</StyledTh>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <StyledTd>{row.hotkey}</StyledTd>
              <StyledTd>{row.intro}</StyledTd>
            </tr>
          ))}
        </tbody>
      </StyledTable>
    );
  };

  return (
    <ModalPane
      id={ModalName.Help}
      title="Help"
      visible={visible}
      onClose={onClose}
    >
      <HelpContent>
        {uiManager.isRoundOver() && (
          <Section>
            <SectionHeader>Dark Forest MUD Complete</SectionHeader>
            Dark Forest MUD v0.1.2 is now complete! Scores are being compiled
            and winners will be announced shortly. Also, Artifacts will no
            longer be mintable. Thanks for playing!
          </Section>
        )}
        <Section>
          <SectionHeader>Hotkeys Intro</SectionHeader>
          <Table data={data} />
        </Section>

        <Section>
          <SectionHeader>Dark Forest MUD v0.1.2 🦑</SectionHeader>
          {/* The game is a vast universe, obfuscated by zero-knowledge cryptography. Your{' '}
          <White>explorer</White> (bottom left) explores the universe, searching for{' '}
          <White>Planets</White> and other players.
          <EmSpacer height={1} />
          All planets produce <White>Energy</White>. You can click-drag to move energy from planets
          you own to new planets to conquer them.
          <EmSpacer height={1} />
          Also scattered through the universe are <White>Asteroid Fields</White>, which produce{' '}
          <White>Silver</White>. Silver can be sent to planets and can be spent on{' '}
          <White>Upgrades</White>.
          <EmSpacer height={1} /> Some planets contain <White>Artifacts</White> - ERC721 tokens that
          can be traded with other players. Artifacts can be harvested and deposited onto planets,
          buffing their stats. */}
          <div>
            Please read{" "}
            <Link to={PLAYER_GUIDE} color="pink">
              Dark Forest MUD guide
            </Link>{" "}
            to know how to play.
          </div>
          <br />

          <div>
            <Link
              to="https://twitter.com/DFArchon"
              color={dfstyles.colors.dfpink}
            >
              DFArchon team
            </Link>{" "}
            hosts{" "}
            <Link
              to="https://twitter.com/darkforest_mud"
              color={dfstyles.colors.dfpink}
            >
              Dark Forest MUD
            </Link>{" "}
            on{" "}
            <Link to={BLOCK_EXPLORER_URL} color={"rgb(243,66,66)"}>
              Redstone
            </Link>
            .
          </div>
          <br />
          <div>
            <Pink>Dark Forest MUD</Pink> is community-driven deployment of{" "}
            <Link to="https://zkga.me" color={dfstyles.colors.dfgreen}>
              Dark Forest
            </Link>{" "}
            based on MUD engine.
          </div>
        </Section>

        <Section>
          <SectionHeader>Prizes and Scoring</SectionHeader>
          Please read{" "}
          <Link to={WIN_CONDITION_AND_PRIZES} color="pink">
            Win Conditions/Prizes
          </Link>{" "}
          to know the prizes.
        </Section>

        <Section>
          <SectionHeader>More Useful Links</SectionHeader>

          <Link to={"https://twitter.com/darkforest_mud"}>
            Dark Forest MUD Twitter
          </Link>
          <br />
          <Link to={DFArchonLinks.blog}>DFArchon&apos;s Blog</Link>
          <br />
          <Link to={DFArchonLinks.twitter}>DFArchon&apos;s Twitter</Link>
          <br />
          <Link to={DFArchonLinks.discord}>DFArchon&apos;s Discord Server</Link>
          <br />
          <br />
        </Section>

        {/* <Section>
          <SectionHeader>Prizes and Scoring</SectionHeader>A snapshot of scores will be taken on{' '}
          <White>February 28, 2022</White> at 9PM Pacific Time. At that time, the top 63
          highest-scoring players will be awarded prizes from a pool 63 prize planets. You can see
          the current rankings by scrolling down on the landing page of the game.
          <EmSpacer height={1} />
          Scoring this round is made up of three parts: finding artifacts using you Gear ship,
          withdrawing silver from Spacetime Rips, and invading and capturing planets inside of
          Capture Zones. For more information about capture zones, hover over the 'Capture Zones'
          sections at the top of the screen.
          <EmSpacer height={1} />
          The values for each scoring type are provided below:
        </Section> */}

        {/* <Section>
          <SectionHeader>Scoring values</SectionHeader>
          Each single <Gold>silver</Gold> you withdraw increases your score by{' '}
          {silverScoreValue / 100}.
          <EmSpacer height={1} />
          Discovering an artifact increases your score based on its rarity:
          <br />
          <ArtifactRarityLabel rarity={ArtifactRarity.Common} />:{' '}
          {artifactPointValues[ArtifactRarity.Common]}
          <br />
          <ArtifactRarityLabel rarity={ArtifactRarity.Rare} />:{' '}
          {artifactPointValues[ArtifactRarity.Rare]}
          <br />
          <ArtifactRarityLabel rarity={ArtifactRarity.Epic} />:{' '}
          {artifactPointValues[ArtifactRarity.Epic]}
          <br />
          <ArtifactRarityLabel rarity={ArtifactRarity.Legendary} />:{' '}
          {artifactPointValues[ArtifactRarity.Legendary]}
          <br />
          <ArtifactRarityLabel rarity={ArtifactRarity.Mythic} />:{' '}
          {artifactPointValues[ArtifactRarity.Mythic]}
          <EmSpacer height={1} />
          Capturing an invaded planet increases your score based on its level:
          <br />
          Level {PlanetLevel.ZERO}: {captureZonePointValues[PlanetLevel.ZERO]}
          <br />
          Level {PlanetLevel.ONE}: {captureZonePointValues[PlanetLevel.ONE]}
          <br />
          Level {PlanetLevel.TWO}: {captureZonePointValues[PlanetLevel.TWO]}
          <br />
          Level {PlanetLevel.THREE}: {captureZonePointValues[PlanetLevel.THREE]}
          <br />
          Level {PlanetLevel.FOUR}: {captureZonePointValues[PlanetLevel.FOUR]}
          <br />
          Level {PlanetLevel.FIVE}: {captureZonePointValues[PlanetLevel.FIVE]}
          <br />
          Level {PlanetLevel.SIX}: {captureZonePointValues[PlanetLevel.SIX]}
          <br />
          Level {PlanetLevel.SEVEN}: {captureZonePointValues[PlanetLevel.SEVEN]}
          <br />
          Level {PlanetLevel.EIGHT}: {captureZonePointValues[PlanetLevel.EIGHT]}
          <br />
          Level {PlanetLevel.NINE}: {captureZonePointValues[PlanetLevel.NINE]}
        </Section> */}
      </HelpContent>
    </ModalPane>
  );
}
