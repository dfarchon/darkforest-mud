import { formatCompact, formatEtherToNumber } from "@df/gamelogic";
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

const MaterialBar = styled.div<{
  percentage: number;
  materialID: MaterialType;
}>`
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
    background-color: ${(props) => getMaterialColor(props.materialID)};
    transition: width 0.3s ease;
  }
`;

export function getMaterialName(materialId: MaterialType): string {
  switch (materialId) {
    case 1:
      return "WATER CRYSTALS";
    case 2:
      return "LIVING WOOD";
    case 3:
      return "WINDSTEEL";
    case 4:
      return "GLACITE";
    case 5:
      return "MYCELIUM GEL";
    case 6:
      return "SANDGLASS";
    case 7:
      return "CRYOSTONE";
    case 8:
      return "SCRAPIUM";
    case 9:
      return "PYROSTEEL";
    case 10:
      return "BLACKALLOY";
    case 11:
      return "CORRUPTED CRYSTAL";
    default:
      return "Unknown";
  }
}

export function getMaterialColor(materialId: MaterialType): string {
  switch (materialId) {
    case 1:
      return "#4A90E2"; // Blue for water
    case 2:
      return "#8B4513"; // Brown for wood
    case 3:
      return "#87CEEB"; // Light blue for windsteel
    case 4:
      return "#C0C0C0"; // Glacium
    case 5:
      return "#8b55c1ff"; // Violet for mycelium
    case 6:
      return "#FFD700"; // Gold for sunstone
    case 7:
      return "#80e5f3ff"; // Light blue for glacite
    case 8:
      return "#696969"; // Gray for scrapium
    case 9:
      return "#FF4500"; // Orange for pyrosteel
    case 10:
      return "#2F4F4F"; // Dark gray for blackalloy
    case 11:
      return "#0df000df"; // Dark Green for Currapted Crystals
    default:
      return dfstyles.colors.subtext;
  }
}

export function getMaterialDescription(id: number): string {
  switch (id) {
    case 1:
      return "A shimmering liquid harvested from deep ocean wells, used in cooling systems, fluidic shields, and hydro-reactive engines.";
    case 2:
      return "An organic, flexible biofiber that forms the core of regenerative hull plating and photosynthetic tech modules.";
    case 3:
      return "Lightweight and highly conductive alloy spun from atmospheric windsteel veins; vital for turbine propulsion and trade ship frames.";
    case 4:
      return "Rare crystalline ice harvested from Tundra zones, used in cryo-core technology, memory arrays, and reflective armor.";
    case 5:
      return "Pulsating fungal gel infused with life essence; powers alchemical reactors and mycelial growth algorithms.";
    case 6:
      return "Sharp, granular shards capable of storing temporal energy—used in chrono-sensors and time-slowing projectiles.";
    case 7:
      return "Frozen mineral forged in vacuum conditions, used in advanced refrigeration, stasis chambers, and cryo-lasers.";
    case 8:
      return "Junk-forged alloy made from Wasteland scraps, restructured into modular components for rough industrial builds.";
    case 9:
      return "Ultra-dense alloy mined from volcanic zones, ideal for magma engines, high-heat armor, and thermal weapon cores.";
    case 10:
      return "A forbidden dark alloy synthesized from corrupted zones. Dense, unstable, and extremely powerful in shadow-tech applications.";
    case 11:
      return "Crystallized corruption extracted from reality-warped biomes. Essential for ZK-reactors, entropy drives, and unstable modules.";
    default:
      return "Unknown material of mysterious origin.";
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
    planet.materials?.filter(
      (mat) => mat.materialId !== 0 && mat.materialAmount > 0,
    ) || [];

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
              const percentage =
                Number(mat.cap) > 0
                  ? (Number(mat.materialAmount) / Number(mat.cap)) * 100
                  : 0;
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
                        width: "fill",
                      }}
                    >
                      <Sub>
                        {formatCompact(Number(mat.materialAmount) / 1e18)}/
                        {formatCompact(Number(mat.cap) / 1e18)}
                      </Sub>
                      {""}
                      <Sub> +{formatEtherToNumber(mat.growthRate)}</Sub>
                    </div>
                    <MaterialBar
                      percentage={percentage}
                      materialID={mat.materialId}
                    />
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
