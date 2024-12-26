import type { EthAddress, Guild, GuildRole } from "@df/types";
import { GuildStatus } from "@df/types";
import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { Btn } from "../Components/Btn";
import { SectionHeader } from "../Components/CoreUI";
import dfstyles from "../Styles/dfstyles";
import { useAccount, usePlayer, useUIManager } from "../Utils/AppHooks";

const GuildDelegationContent = styled.div`
  width: 600px;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
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
  justify-content: flex-start;
  margin-left: 1em;
  gap: 1em;
`;

export const GuildDelegationSection = styled.div`
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
`;

export function GuildDelegationPane() {
  const uiManager = useUIManager();
  const gameManager = uiManager.getGameManager();
  const account = useAccount(uiManager);
  const player = usePlayer(uiManager).value;

  const [guild, setGuild] = useState<Guild>();
  const [memberRole, setMemberRole] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [grantedAddresses, setGrantedAddresses] = useState<EthAddress[]>([]);
  const [authorizedByAddresses, setAuthorizedByAddresses] = useState<
    EthAddress[]
  >([]);

  // Load guild, role and grant info
  useEffect(() => {
    if (!account || !gameManager) return;

    const refreshGuildInfo = () => {
      // Refresh guild info
      const guildId = gameManager.getPlayerGuildId(account);
      const guildState = gameManager.getGuild(guildId);

      // Refresh role info
      const role_number = gameManager.getGuildRole(account);
      let role = "Member";
      if (role_number === 3) role = "Leader";
      if (role_number === 2) role = "Officer";

      // Refresh granted addresses
      const granted = gameManager.getGrantedAddresses(account);

      setGuild(guildState);
      setMemberRole(role);
      setGrantedAddresses(granted);
    };

    // Initial load
    refreshGuildInfo();

    // Set up interval for refresh every 5 seconds
    const intervalId = setInterval(refreshGuildInfo, 5000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [account, gameManager]);

  // Add effect to load and refresh addresses that authorized you
  useEffect(() => {
    if (!account || !gameManager) return;

    const refreshAuthorizedByAddresses = () => {
      // TODO: Replace with actual API call
      const authorizedBy = gameManager.getAuthorizedByAddresses(account);
      setAuthorizedByAddresses(authorizedBy);
    };

    refreshAuthorizedByAddresses();
    const intervalId = setInterval(refreshAuthorizedByAddresses, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [account, gameManager]);

  const handleGrant = async (roleLevel: number) => {
    if (!account) return;
    setIsProcessing(true);

    try {
      // TODO: Replace with actual grant API call
      await gameManager.setGrant(roleLevel as GuildRole);
      // Refresh granted addresses
      const granted = gameManager.getGrantedAddresses(account);
      setGrantedAddresses(granted);
    } catch (error) {
      console.error("Failed to grant:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const validGuild = (_guild: Guild | undefined): boolean => {
    if (!_guild) return false;
    return _guild.id !== 0 && _guild.status === GuildStatus.ACTIVE;
  };

  if (!account || !player || !guild)
    return (
      <GuildDelegationContent>
        You haven't joined a guild yet
      </GuildDelegationContent>
    );
  if (!validGuild(guild))
    return (
      <GuildDelegationContent>
        You haven't joined a guild yet
      </GuildDelegationContent>
    );

  return (
    <GuildDelegationContent>
      <GuildDelegationSection>
        <SectionHeader>Your Guild Information</SectionHeader>
        <Row>
          <span>Your Address:</span>
          <span>{account}</span>
        </Row>
        <Row>
          <span>Guild ID:</span>
          <span>{guild?.id.toString()}</span>
        </Row>
        <Row>
          <span>Guild Name:</span>
          <span>{guild?.name}</span>
        </Row>
        <Row>
          <span>Your Role:</span>
          <span>{memberRole}</span>
        </Row>
      </GuildDelegationSection>

      <GuildDelegationSection>
        <SectionHeader>Current Granted Addresses</SectionHeader>
        {grantedAddresses.length > 0 ? (
          grantedAddresses.map((address) => (
            <Row key={address}>
              <span>{address}</span>
            </Row>
          ))
        ) : (
          <Row>
            <span>No addresses currently granted access</span>
          </Row>
        )}
      </GuildDelegationSection>

      <GuildDelegationSection>
        <SectionHeader>Delegation Management</SectionHeader>
        <BtnSet>
          <Btn disabled={isProcessing} onClick={() => handleGrant(1)}>
            Grant Members
          </Btn>
          <Btn disabled={isProcessing} onClick={() => handleGrant(2)}>
            Grant Officers
          </Btn>
          <Btn disabled={isProcessing} onClick={() => handleGrant(3)}>
            Grant Leaders
          </Btn>
          <Btn
            className="red"
            disabled={isProcessing}
            onClick={() => handleGrant(0)}
          >
            Revoke All
          </Btn>
        </BtnSet>
      </GuildDelegationSection>

      <GuildDelegationSection>
        <SectionHeader>Addresses You Can Operate</SectionHeader>
        {authorizedByAddresses.length > 0 ? (
          authorizedByAddresses.map((address) => (
            <Row key={address}>
              <span>{address}</span>
            </Row>
          ))
        ) : (
          <Row>
            <span>No addresses you can currently operate</span>
          </Row>
        )}
      </GuildDelegationSection>
    </GuildDelegationContent>
  );
}
