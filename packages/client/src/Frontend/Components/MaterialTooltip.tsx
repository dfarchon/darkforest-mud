import React, { useState } from "react";
import styled from "styled-components";
import {
  getMaterialIcon,
  getMaterialName,
  getMaterialDescription,
  getMaterialColor,
} from "../Panes/PlanetMaterialsPane";
import type { MaterialType } from "@df/types";

interface MaterialTooltipProps {
  materialType: MaterialType;
  children: React.ReactNode;
}

const MaterialTooltip: React.FC<MaterialTooltipProps> = ({
  materialType,
  children,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseMove = (event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <TooltipContainer
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <Tooltip
        mouseX={mousePosition.x}
        mouseY={mousePosition.y}
        visible={isVisible}
      >
        <TooltipHeader>
          <TooltipIcon>{getMaterialIcon(materialType)}</TooltipIcon>
          <TooltipTitle color={getMaterialColor(materialType)}>
            {getMaterialName(materialType)}
          </TooltipTitle>
        </TooltipHeader>
        <TooltipDescription>
          {getMaterialDescription(materialType)}
        </TooltipDescription>
      </Tooltip>
    </TooltipContainer>
  );
};

// Styled components
const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
  cursor: help;

  &:hover {
    cursor: help;
  }
`;

const Tooltip = styled.div<{
  mouseX: number;
  mouseY: number;
  visible: boolean;
}>`
  position: fixed;
  top: ${(props) => props.mouseY + 10}px;
  left: ${(props) => props.mouseX + 10}px;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 12px;
  min-width: 200px;
  max-width: 280px;
  z-index: 1000;
  opacity: ${(props) => (props.visible ? 1 : 0)};
  visibility: ${(props) => (props.visible ? "visible" : "hidden")};
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const TooltipHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const TooltipIcon = styled.div`
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TooltipTitle = styled.div<{ color: string }>`
  color: ${(props) => props.color};
  font-weight: bold;
  font-size: 14px;
`;

const TooltipDescription = styled.div`
  color: #ccc;
  font-size: 12px;
  line-height: 1.4;
`;

export default MaterialTooltip;
