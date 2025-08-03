import { formatNumber } from "@df/gamelogic";
import type { LocationId, MaterialType } from "@df/types";
import React from "react";
import styled from "styled-components";

import {
  CenterBackgroundSubtext,
  Section,
  SectionHeader,
} from "../Components/CoreUI";
import { Sub, Text } from "../Components/Text";
import dfstyles from "../Styles/dfstyles";
import { usePlanet, useUIManager } from "../Utils/AppHooks";
import { useEmitterValue } from "../Utils/EmitterHooks";
import type { ModalHandle } from "../Views/ModalPane";
import { ModalPane } from "../Views/ModalPane";
import { PlanetCard, PlanetCardTitle } from "../Views/PlanetCard";

const MaterialsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;

const MaterialRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: ${dfstyles.colors.backgroundlighter};
  border: 1px solid ${dfstyles.colors.borderDarker};
  border-radius: 4px;
`;

const MaterialInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MaterialBar = styled.div<{ percentage: number }>`
  width: 100%;
  height: 8px;
  background-color: ${dfstyles.colors.borderDarker};
  border-radius: 4px;
  overflow: hidden;

  &::after {
    content: "";
    display: block;
    width: ${(props) => props.percentage}%;
    height: 100%;
    background-color: ${dfstyles.colors.dforange};
    transition: width 0.3s ease;
  }
`;

function getMaterialName(materialId: MaterialType): string {
  switch (materialId) {
    case 1:
      return "Water";
    case 2:
      return "Wood";
    case 3:
      return "Windsteel";
    case 4:
      return "Silver";
    case 5:
      return "Mycelium";
    case 6:
      return "Sunstone";
    case 7:
      return "Glacite";
    case 8:
      return "Scrapium";
    case 9:
      return "Pyrosteel";
    case 10:
      return "Blackalloy";
    default:
      return "Unknown";
  }
}

function getMaterialColor(materialId: MaterialType): string {
  switch (materialId) {
    case 1:
      return "#4A90E2"; // Blue for water
    case 2:
      return "#8B4513"; // Brown for wood
    case 3:
      return "#87CEEB"; // Light blue for windsteel
    case 4:
      return "#C0C0C0"; // Silver
    case 5:
      return "#8FBC8F"; // Green for mycelium
    case 6:
      return "#FFD700"; // Gold for sunstone
    case 7:
      return "#B0E0E6"; // Light blue for glacite
    case 8:
      return "#696969"; // Gray for scrapium
    case 9:
      return "#FF4500"; // Orange for pyrosteel
    case 10:
      return "#2F4F4F"; // Dark gray for blackalloy
    default:
      return dfstyles.colors.subtext;
  }
}

export function PlanetMaterialsPane({
  initialPlanetId,
  modal,
}: {
  initialPlanetId: LocationId | undefined;
  modal: ModalHandle;
}) {
  const uiManager = useUIManager();
  const planetId = useEmitterValue(
    uiManager.selectedPlanetId$,
    initialPlanetId,
  );
  const planet = usePlanet(uiManager, planetId).value;

  if (!planet) {
    return (
      <CenterBackgroundSubtext width="100%" height="200px">
        No planet selected
      </CenterBackgroundSubtext>
    );
  }

  const activeMaterials =
    planet.materials?.filter((mat) => mat.materialId !== 0 && mat.amount > 0) ||
    [];

  return (
    <ModalPane
      title="Materials"
      visible={true}
      onClose={() => {
        /* close logic here */
      }}
      id="PlanetMaterials" // or a unique ModalId string
    >
      <Section>
        <SectionHeader>Materials</SectionHeader>
        {activeMaterials.length === 0 ? (
          <CenterBackgroundSubtext width="100%" height="100px">
            No materials found on this planet
          </CenterBackgroundSubtext>
        ) : (
          <MaterialsContainer>
            {activeMaterials.map((mat) => {
              const percentage = mat.cap > 0 ? (mat.amount / mat.cap) * 100 : 0;
              const materialColor = getMaterialColor(mat.materialId);

              return (
                <MaterialRow key={mat.materialId}>
                  <MaterialInfo>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          backgroundColor: materialColor,
                          borderRadius: "2px",
                        }}
                      />
                      <Text
                        style={{ color: materialColor, fontWeight: "bold" }}
                      >
                        {getMaterialName(mat.materialId)}
                      </Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.8em",
                      }}
                    >
                      <Sub>
                        {formatNumber(mat.amount)} / {formatNumber(mat.cap)}
                      </Sub>
                      <Sub>+{formatNumber(mat.growthRate)}/tick</Sub>
                    </div>
                    <MaterialBar percentage={percentage} />
                  </MaterialInfo>
                </MaterialRow>
              );
            })}
          </MaterialsContainer>
        )}
      </Section>
    </ModalPane>
  );
}
