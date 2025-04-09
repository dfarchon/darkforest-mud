import { getNetworkConfig } from "@mud/getNetworkConfig";
import { useMUD } from "@mud/MUDContext";
// import { WalletPane } from "./WalletPane";
import styled from "styled-components";
import { useAccount, useDisconnect, useWalletClient } from "wagmi";
import { useEffect } from "react";

import { BluePillConnectButton } from "./BluePillConnectButton";
import { formatAddress } from "./utils";

const PinkButton = styled.button`
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 20px 40px;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 105, 180, 0.3);
  margin: 20px;
  min-width: 200px;

  &:hover {
    background-color: #ff1493;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 105, 180, 0.4);
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 2px 10px rgba(255, 105, 180, 0.3);
  }
`;

const NormalButton = styled.button`
  background-color: #4a5568;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 20px 40px;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(74, 85, 104, 0.3);
  margin: 20px;
  min-width: 200px;
  outline: none;

  &:hover {
    background-color: #2d3748;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(74, 85, 104, 0.4);
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 2px 10px rgba(74, 85, 104, 0.3);
  }

  &:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  &:focus {
    outline: none;
  }
`;

// Container for the wallet buttons group with flex layout
const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px;
`;

// Base compact button style with unified color scheme for all wallet buttons
const CompactButton = styled(NormalButton)`
  background-color: #4a5568; // Unified blue-gray background
  color: white;
  padding: 12px 24px;
  font-size: 18px;
  margin: 0;
  min-width: 150px;

  &:hover {
    background-color: #2d3748; // Darker shade on hover
  }
`;

// Network button - uses base style
const NetworkButton = styled(CompactButton)``;

// Address button - adds monospace font for better address display
const AddressButton = styled(CompactButton)`
  font-family: monospace;
  letter-spacing: 0.5px;
`;

// Log off button - uses base style
const LogOffButton = styled(CompactButton)``;

export const BluePillWalletButton: React.FC = () => {
  const { isConnected, address, chain } = useAccount();
  const { disconnect } = useDisconnect();

  const { data: externalWalletClient } = useWalletClient();

  const {
    network: { walletClient: burnerWalletClient },
  } = useMUD();

  const addNetwork = () => {
    const networkConfig = getNetworkConfig();
    const networkConfigChain = networkConfig.chain;

    if (networkConfigChain.id === 8453) {
      networkConfigChain.blockExplorers = {
        default: {
          name: "Base Explorer",
          url: "https://basescan.org/",
        },
      };
    } else if (networkConfigChain.id === 84532) {
      networkConfigChain.blockExplorers = {
        default: {
          name: "Base Sepolia Explorer",
          url: "https://sepolia.basescan.org/",
        },
      };
    } else if (networkConfigChain.id === 690) {
      networkConfigChain.blockExplorers = {
        default: {
          name: "Redstone Explorer",
          url: "https://explorer.redstone.xyz/",
        },
      };
    }

    externalWalletClient?.addChain({ chain: networkConfigChain });
  };

  useEffect(() => {
    console.log("adding network");
    addNetwork();
    console.log("network added");
  }, [isConnected, burnerWalletClient.chain?.id, chain?.id]);

  return (
    <div>
      <div
        style={{
          padding: "20px",
          background: "rgba(0, 0, 0, 0.8)",
          borderRadius: "8px",
          border: "1px solid #ff69b4",
          color: "#fff",
          textAlign: "left",
          margin: "20px 0",
          width: "500px",
          maxWidth: "90%",
        }}
      >
        <div
          style={{
            fontSize: "24px",
            marginBottom: "15px",
            color: "#ff69b4",
          }}
        >
          ⚡ NOTICE ⚡
        </div>
        <div style={{ marginBottom: "10px", fontSize: "18px" }}>
          Please use the same account to connect
        </div>
      </div>

      {/* Show connect button when wallet is not connected */}
      {!isConnected && <BluePillConnectButton />}

      {/* Show network add button when connected but on wrong network */}
      {isConnected && burnerWalletClient.chain?.id !== chain?.id && (
        <PinkButton onClick={addNetwork}>Add Network</PinkButton>
      )}

      {/* Show wallet info and logout when connected and on correct network */}
      {isConnected && burnerWalletClient.chain?.id === chain?.id && (
        <ButtonContainer>
          <NetworkButton>{chain?.name}</NetworkButton>
          <AddressButton>{formatAddress(address!)}</AddressButton>
          <LogOffButton onClick={() => disconnect()}>Log Off</LogOffButton>
        </ButtonContainer>
      )}
    </div>
  );
};
