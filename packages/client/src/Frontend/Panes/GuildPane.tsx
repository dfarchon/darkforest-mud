import type { Guild, GuildId } from "@df/types";
import { ModalName } from "@df/types";
import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { Btn } from "../Components/Btn";
import { useAccount, useUIManager } from "../Utils/AppHooks";
import { ModalPane } from "../Views/ModalPane"; // Import ModalPane and ModalHandle
import { GuildCreatePane } from "./GuildCreatePane";
import { GuildDetailPane } from "./GuildDetailPane";
import { GuildListPane } from "./GuildListPane";
import { GuildManagePane } from "./GuildManagePane";

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px; /* Set the spacing between buttons */
`;

const Frame = styled.div<{ visible: boolean }>`
  display: ${(props) => (props.visible ? "block" : "none")};
`;

export default function GuildContextPane({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const uiManager = useUIManager();
  const gameManager = uiManager.getGameManager();
  const account = useAccount(uiManager);
  const [activeFrame, setActiveFrame] = useState("list"); // State to manage active frame

  const [guild, setGuild] = useState<Guild>();

  const [selectedGuildId, setSelectedGuildId] = useState(0);

  // update planet list on open / close
  useEffect(() => {
    if (!visible) return;
    if (!account || !gameManager) return;

    const guildId = gameManager.getPlayerGuildId(account);
    if (guildId) setSelectedGuildId(guildId);

    const myGuild = gameManager.getGuild(guildId);

    setGuild(myGuild);

    const player = uiManager.getPlayer(account);
    if (player && guildId === 0) setActiveFrame("create");
  }, [visible, account, gameManager]);

  useEffect(() => {
    if (!visible) return;
    if (!account || !gameManager) return;
    const refreshGuild = () => {
      if (!account || !gameManager) return;
      const myGuildId = gameManager.getPlayerGuildId(account);
      const myGuild = gameManager.getGuild(myGuildId);
      setGuild(myGuild);
    };

    const intervalId = setInterval(refreshGuild, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [visible, account, gameManager]);

  if (!account) return <></>;

  const handleFrameChange = async (frame: string) => {
    setActiveFrame(frame);

    const myGuildId = gameManager.getPlayerGuildId(account);
    const myGuild = gameManager.getGuild(myGuildId);
    setGuild(myGuild);
  };

  const inGuild = (): boolean => {
    const guildId = gameManager.getPlayerGuildId(account);

    return guildId !== undefined;
  };

  return (
    <ModalPane
      id={ModalName.GuildContextPane}
      title={"Guild System"}
      visible={visible}
      onClose={onClose}
    >
      <ButtonContainer>
        {!inGuild() && (
          <Btn onClick={() => handleFrameChange("create")}>Create</Btn>
        )}
        <Btn onClick={() => handleFrameChange("list")}> List</Btn>
        <Btn onClick={() => handleFrameChange("detail")}> Detail</Btn>
        <Btn onClick={() => handleFrameChange("manage")}>Manage</Btn>
      </ButtonContainer>

      <Frame visible={activeFrame === "create"}>
        <GuildCreatePane
          setSelectedGuildId={setSelectedGuildId}
          setActiveFrame={setActiveFrame}
        />
      </Frame>

      <Frame visible={activeFrame === "list"}>
        <GuildListPane
          setSelectedGuildId={setSelectedGuildId}
          setActiveFrame={setActiveFrame}
        />
      </Frame>

      <Frame visible={activeFrame === "detail"}>
        <GuildDetailPane
          _guildId={selectedGuildId as GuildId}
          setSelectedGuildId={setSelectedGuildId}
          setActiveFrame={setActiveFrame}
        />
      </Frame>

      <Frame visible={activeFrame === "manage"}>
        <GuildManagePane />
      </Frame>
    </ModalPane>
  );
}
