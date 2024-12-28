import { weiToEth } from "@df/network";
import type { EthAddress, Guild, GuildId } from "@df/types";
import { GuildStatus } from "@df/types";
import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { Btn } from "../Components/Btn";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import { Blue, Green } from "../Components/Text";
import { formatDuration, TimeUntil } from "../Components/TimeUntil";
import { useAccount, usePlayer, useUIManager } from "../Utils/AppHooks";
import { GuildInfoPane } from "./GuildInfoPane";

const GuildDetailContent = styled.div`
  width: 600px;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
  /* text-align: justify; */
  margin-left: 1em;
  margin-right: 1em;
  margin-top: 1em;
  margin-bottom: 1em;
`;

export const GuildDetailSection = styled.div`
  padding: 0.5em 0;

  &:first-child {
    margin-top: -8px;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px; /* Set the spacing between buttons */
  margin-top: 0.5em;
`;

type setNumberFunction = (value: number) => void;
type SetStateFunction = (value: string) => void;

export function GuildDetailPane({
  _guildId,
  setSelectedGuildId,
  setActiveFrame,
}: {
  _guildId: GuildId;
  setSelectedGuildId: setNumberFunction;
  setActiveFrame: SetStateFunction;
}) {
  const uiManager = useUIManager();
  const gameManager = uiManager.getGameManager();
  const account = useAccount(uiManager);
  const player = usePlayer(uiManager).value;

  const [guild, setGuild] = useState<Guild>();
  const [isProcessing, setIsProcessing] = useState(false);

  const [guildRejoinCooldown, setGuildRejoinCooldown] = useState<number>();
  const [
    nextApplyGuildAvailableTimestamp,
    setNextApplyGuildAvailableTimestamp,
  ] = useState<number>();

  // Initial guild data fetch
  useEffect(() => {
    if (!gameManager) return;
    const guildId = _guildId;
    const guildState = gameManager.getGuild(guildId);
    setGuild(guildState);
  }, [_guildId, gameManager, account]);

  // Fetch configuration data
  useEffect(() => {
    const fetchConfig = async () => {
      if (!guild) return;
      const cooldown = gameManager.getGuildRejoinCooldownTime();
      setGuildRejoinCooldown(cooldown);

      const rawTimestamp = gameManager.getNextApplyGuildAvailableTimestamp();

      setNextApplyGuildAvailableTimestamp(rawTimestamp);
    };

    fetchConfig();
  }, [guild, gameManager, uiManager]);

  // Refresh guild data every 5 seconds
  useEffect(() => {
    if (!gameManager) return;

    const refreshGuild = () => {
      const guildId = _guildId;
      const guildState = gameManager.getGuild(guildId);
      if (guildState) setGuild(guildState);
    };

    const intervalId = setInterval(refreshGuild, 5_000);

    return () => {
      clearInterval(intervalId);
    };
  }, [_guildId, guild, gameManager, account]);

  // Utility functions
  const validGuild = (_guild: Guild): boolean => {
    if (!_guild) return false;
    return _guild.id !== 0 && _guild.status === GuildStatus.ACTIVE;
  };

  const isPlayerInGuild = (address: EthAddress): boolean => {
    const guildId = gameManager.getPlayerGuildId(address);
    if (!guildId) return false;
    const _guild = gameManager.getGuild(guildId);
    if (!_guild) return false;

    return validGuild(_guild);
  };

  const isLeader = (_guild: Guild, address: EthAddress): boolean => {
    if (!_guild) return false;
    return _guild.owner === address;
  };

  const isMember = (_guild: Guild, address: EthAddress): boolean => {
    if (!_guild) return false;
    return _guild.members.includes(address);
  };

  const isInvitee = (_guild: Guild, address: EthAddress): boolean => {
    if (!_guild) return false;
    return _guild.invitees.includes(address);
  };

  const isApplicant = (_guild: Guild, address: EthAddress): boolean => {
    if (!_guild) return false;
    return _guild.applicants.includes(address);
  };

  // Action handlers
  const handleLeaveGuild = async () => {
    if (!guild || !account) return;
    if (!validGuild(guild)) return;
    if (!isMember(guild, account)) return;
    setIsProcessing(true);
    try {
      await gameManager.leaveGuild();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!guild || !account) return;
    if (!validGuild(guild)) return;
    if (!isInvitee(guild, account)) return;
    setIsProcessing(true);
    try {
      await gameManager.acceptInvitation(guild.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const leaveGuildCooldownPassed =
    nextApplyGuildAvailableTimestamp &&
    Date.now() >= nextApplyGuildAvailableTimestamp;

  const handleSendApplication = async () => {
    if (!account || !guild || !validGuild(guild)) return;
    setIsProcessing(true);
    try {
      await gameManager.applyToGuild(guild.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading states
  if (!account || !player || !guild || !validGuild(guild))
    return (
      <GuildDetailContent>
        <LoadingSpinner
          initialText={"Please wait 12 s or contact the admin..."}
        />
      </GuildDetailContent>
    );

  if (!guildRejoinCooldown || !nextApplyGuildAvailableTimestamp)
    return (
      <GuildDetailContent>
        <LoadingSpinner initialText={"Loading..."} />
      </GuildDetailContent>
    );

  return (
    <>
      <ButtonContainer>
        <Btn onClick={() => setActiveFrame("list")}>Back To List</Btn>

        {!isMember(guild, account) && isPlayerInGuild(account) && (
          <Btn
            onClick={() => {
              const playerGuildId = gameManager.getPlayerGuildId(account);
              if (!playerGuildId) return;
              const playerGuild = gameManager.getGuild(playerGuildId);
              if (!playerGuild) return;
              setSelectedGuildId(playerGuild.id);
            }}
          >
            Jump To My Guild
          </Btn>
        )}

        {isLeader(guild, account) && (
          <Btn onClick={() => setActiveFrame("manage")}>Jump To Manage</Btn>
        )}
      </ButtonContainer>

      <GuildDetailContent>
        <GuildInfoPane guild={guild} uiManager={uiManager} />

        {isMember(guild, account) && !isLeader(guild, account) && (
          <GuildDetailContent>
            <p>You are a member of this guild.</p>
            <div>
              <Green>NOTE:</Green> After you leave one guild, you need to wait{" "}
              {formatDuration(guildRejoinCooldown * 1000)} before you can join a
              new guild again.{" "}
            </div>
            <Btn disabled={isProcessing} onClick={handleLeaveGuild}>
              Leave Guild
            </Btn>
          </GuildDetailContent>
        )}

        {isInvitee(guild, account) && (
          <GuildDetailContent>
            <p>
              <Blue>INFO: </Blue> Congratulations, you have been invited to join
              this guild!
            </p>
            {!leaveGuildCooldownPassed && (
              <p>
                <Blue>INFO: </Blue>
                You must wait{" "}
                <TimeUntil
                  timestamp={nextApplyGuildAvailableTimestamp}
                  ifPassed={"now!"}
                />{" "}
                to rejoin another guild
              </p>
            )}
            <Btn
              disabled={!leaveGuildCooldownPassed || isProcessing}
              onClick={handleAcceptInvite}
            >
              Accept Invitation
            </Btn>
          </GuildDetailContent>
        )}

        {isApplicant(guild, account) && (
          <GuildDetailContent>
            <p>
              <Blue>INFO: </Blue>You have applied to join this guild. Please
              wait patiently or contact the guild leader.
            </p>
            {!leaveGuildCooldownPassed && (
              <p>
                <Blue>INFO: </Blue> You must wait{" "}
                <TimeUntil
                  timestamp={nextApplyGuildAvailableTimestamp}
                  ifPassed={"now!"}
                />{" "}
                to rejoin another guild
              </p>
            )}
          </GuildDetailContent>
        )}

        {!isApplicant(guild, account) && !isPlayerInGuild(account) && (
          <GuildDetailContent>
            <p>
              <Blue>INFO: </Blue>You are not currently in a guild.
            </p>
            {!leaveGuildCooldownPassed && (
              <p>
                <Blue>INFO: </Blue> You must wait{" "}
                <TimeUntil
                  timestamp={nextApplyGuildAvailableTimestamp}
                  ifPassed={"now!"}
                />{" "}
                to rejoin another guild
              </p>
            )}
            <Btn
              disabled={!leaveGuildCooldownPassed || isProcessing}
              onClick={handleSendApplication}
            >
              Send Application to this guild
            </Btn>
          </GuildDetailContent>
        )}
      </GuildDetailContent>
    </>
  );
}
