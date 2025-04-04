import React from "react";
import styled from "styled-components";

const SelectionPrompt = styled.div`
  color: #4caf50;
  font-size: 32px;
  font-weight: bold;
  margin: 20px 0;
  text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
`;

const ClickInstruction = styled.div`
  color: #ff69b4;
  font-size: 28px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 10px;
`;

const BlueHighlight = styled.span`
  color: #00bfff;
  font-weight: bold;
  font-size: 28px;
  text-shadow: 0 0 15px rgba(0, 191, 255, 0.7);
`;

const SpawnText = styled.span`
  color: #ff1493;
  font-weight: bold;
  font-size: 32px;
  text-shadow: 0 0 20px rgba(255, 20, 147, 0.8);
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% {
      text-shadow: 0 0 20px rgba(255, 20, 147, 0.8);
    }
    50% {
      text-shadow: 0 0 30px rgba(255, 20, 147, 1);
    }
    100% {
      text-shadow: 0 0 20px rgba(255, 20, 147, 0.8);
    }
  }
`;

const GuideContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

export const BluePillMapGuide: React.FC = () => {
  return (
    <GuideContainer>
      <SelectionPrompt>Select Your Home Planet 🪐</SelectionPrompt>
      <ClickInstruction>
        Click <BlueHighlight>blue squares</BlueHighlight> to{" "}
        <SpawnText>spawn 👉</SpawnText>
      </ClickInstruction>
    </GuideContainer>
  );
};
