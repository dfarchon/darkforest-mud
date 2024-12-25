import type { EthAddress, Guild } from "@df/types";
import { GuildStatus, Setting } from "@df/types";
import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { Btn } from "../Components/Btn";
import { SectionHeader, Spacer } from "../Components/CoreUI";
import type { DarkForestTextInput } from "../Components/Input";
import { TextInput } from "../Components/Input";
import dfstyles from "../Styles/dfstyles";
import { useAccount, usePlayer, useUIManager } from "../Utils/AppHooks";
import { useBooleanSetting } from "../Utils/SettingsHooks";
import { GuildInfoPane } from "./GuildInfoPane";

const GuildManageContent = styled.div`
  width: 600px;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
  /* text-align: justify; */
  margin-left: 1em;
  margin-right: 1em;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-left: 1em;
  margin-right: 1em;

  & > span:first-child {
    flex-grow: 1;
  }
`;

const BtnSet = styled.div`
  display: flex;
  justify-content: space-around;
`;

export const GuildManageSection = styled.div`
  padding: 0.5em 0;

  &:first-child {
    margin-top: -8px;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const Actions = styled.div`
  float: right;

  .blue {
    --df-button-hover-background: ${dfstyles.colors.dfblue};
    --df-button-hover-border: 1px solid ${dfstyles.colors.dfblue};
  }

  .red {
    --df-button-hover-background: ${dfstyles.colors.dfred};
    --df-button-hover-border: 1px solid ${dfstyles.colors.dfred};
  }

  .green {
    --df-button-hover-background: ${dfstyles.colors.dfgreen};
    --df-button-hover-border: 1px solid ${dfstyles.colors.dfgreen};
  }
`;

export function GuildManagePane() {
  const uiManager = useUIManager();
  const gameManager = uiManager.getGameManager();
  const account = useAccount(uiManager);
  const player = usePlayer(uiManager).value;

  const [guild, setGuild] = useState<Guild>();
  const [isProcessing, setIsProcessing] = useState(false);

  const [inviteAddressText, setInviteAddressText] = useState("");
  const [savedSettingValue, setSavedSettingValue] = useState(false);
  const [settingValue, setSettingValue] = useBooleanSetting(
    uiManager,
    Setting.DisableDefaultShortcuts,
  );

  useEffect(() => {
    if (!account || !gameManager) return;
    const guildId = gameManager.getPlayerGuildId(account);
    const guildState = gameManager.getGuild(guildId);
    setGuild(guildState);
    setSavedSettingValue(settingValue);
  }, [account, uiManager]);

  // Refresh guilds every 10 seconds
  useEffect(() => {
    if (!account || !uiManager) return;

    const refreshGuild = () => {
      if (!account || !gameManager) return;
      const guildId = gameManager.getPlayerGuildId(account);
      const guildState = gameManager.getGuild(guildId);
      setGuild(guildState);
    };

    const intervalId = setInterval(refreshGuild, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [account, uiManager]);

  const handleKeyDown = () => {
    console.log("handle key down");
    console.log(settingValue);
    setSettingValue(true);
    console.log("become true");
  };

  const handleKeyUp = () => {
    console.log("handle key up");
    console.log(savedSettingValue);
    setSettingValue(savedSettingValue);
  };

  const validGuild = (_guild: Guild | undefined): boolean => {
    if (!_guild) return false;
    return _guild.id !== 0 && _guild.status === GuildStatus.ACTIVE;
  };

  const isLeader = (
    _guild: Guild | undefined,
    address: EthAddress | undefined,
  ): boolean => {
    if (!_guild || !address) return false;
    return _guild.owner === address;
  };

  const handleKickMember = async (memberAddress: EthAddress) => {
    if (!account || !guild) return;
    if (!validGuild(guild)) return;

    setIsProcessing(true);
    try {
      await gameManager.kickMember(memberAddress);
    } catch (err) {
      console.error("Error kicking member:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransferLeaderRole = async (newAdminAddress: EthAddress) => {
    if (!account || !guild || !validGuild(guild)) return;

    setIsProcessing(true);

    try {
      await gameManager.transferGuildLeadership(newAdminAddress);
    } catch (err) {
      console.error("Error transferring leader role:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInviteToGuild = async () => {
    if (!account || !guild || !validGuild(guild)) return;

    setIsProcessing(true);

    try {
      await gameManager.inviteToGuild(inviteAddressText as EthAddress);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelInvite = async (newAdminAddress: EthAddress) => {
    if (!account || !guild || !validGuild(guild)) return;
    setIsProcessing(true);

    try {
      // await gameManager.cancelInvite(guild.guildId, newAdminAddress);
    } catch (err) {
      console.error("Error canceling Invite:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Round 4 Todo add functions here
  const handleRejectApplication = async (applicant: EthAddress) => {
    if (!account || !guild || !validGuild(guild)) return;
    setIsProcessing(true);
    try {
      // await gameManager.rejectApplication(guild.guildId, applicant);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptApplication = async (applicant: EthAddress) => {
    if (!account || !guild || !validGuild(guild)) return;
    setIsProcessing(true);
    try {
      // await gameManager.acceptApplication(applicant);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisbandGuild = async () => {
    if (!account || !guild || !validGuild(guild)) return;
    setIsProcessing(true);
    try {
      await gameManager.disbandGuild();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLevelupGuild = async () => {
    if (!account || !guild || !validGuild(guild)) return;
    setIsProcessing(true);
    try {
      // await gameManager.levelUpGuild(guild.guildId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!account || !player || !guild)
    return (
      <GuildManageContent>You haven't joined a guild yet</GuildManageContent>
    );
  if (!validGuild(guild))
    return (
      <GuildManageContent>You haven't joined a guild yet</GuildManageContent>
    );
  if (!isLeader(guild, account))
    return (
      <GuildManageContent>
        You are not the leader of one guild
      </GuildManageContent>
    );

  return (
    <GuildManageContent>
      {/* Basic Guild Info */}
      <GuildInfoPane guild={guild} uiManager={uiManager} />

      <Row>
        <Actions>
          <Btn className="red" onClick={handleDisbandGuild}>
            Disband This Guild
          </Btn>
        </Actions>
      </Row>

      <GuildManageSection>
        <SectionHeader> Members </SectionHeader>
        <ul>
          {guild.members.map((member) => (
            <li key={member}>
              <BtnSet>
                {member}
                <Actions>
                  <Btn className="red" onClick={() => handleKickMember(member)}>
                    Kick
                  </Btn>
                  <Spacer width={4} />
                  <Btn
                    className="button"
                    onClick={() => handleTransferLeaderRole(member)}
                  >
                    Transfer Admin
                  </Btn>
                </Actions>
              </BtnSet>
            </li>
          ))}
        </ul>
      </GuildManageSection>

      <GuildManageSection>
        <SectionHeader> Invitees </SectionHeader>

        <div style={{ padding: "10px" }}>
          <Row>
            <span>
              <TextInput
                placeholder="Player Address"
                value={inviteAddressText ?? ""}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onChange={(
                  e: Event & React.ChangeEvent<DarkForestTextInput>,
                ) => {
                  setInviteAddressText(e.target.value);
                }}
              />
            </span>

            <Btn disabled={isProcessing} onClick={handleInviteToGuild}>
              Send Invite
            </Btn>
          </Row>
        </div>

        <ul>
          {guild.invitees.map((invitee) => (
            <li key={invitee}>
              <BtnSet>
                {invitee}
                <Btn
                  disabled={isProcessing}
                  onClick={() => handleCancelInvite(invitee)}
                >
                  <span> Cancel Invition</span>
                </Btn>
              </BtnSet>
            </li>
          ))}
        </ul>
      </GuildManageSection>

      <GuildManageSection>
        <SectionHeader> Applicants </SectionHeader>

        <ul>
          {guild.applicants.map((applicant) => (
            <li key={applicant}>
              <BtnSet>
                {applicant}
                <Btn
                  disabled={isProcessing}
                  onClick={() => handleRejectApplication(applicant)}
                >
                  Reject
                </Btn>
                <Spacer width={4} />
                <Btn
                  disabled={isProcessing}
                  onClick={() => handleAcceptApplication(applicant)}
                >
                  Accept
                </Btn>
              </BtnSet>
            </li>
          ))}
        </ul>
      </GuildManageSection>
    </GuildManageContent>
  );
}
