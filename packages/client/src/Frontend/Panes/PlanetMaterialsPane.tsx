import { formatCompact, formatCompact2 } from "@df/gamelogic";
import type { LocationId, MaterialType } from "@df/types";
import { ModalName } from "@df/types";
import { useState } from "react";
import styled from "styled-components";

import {
  CenterBackgroundSubtext,
  Section,
  SectionHeader,
} from "../Components/CoreUI";
import { Btn } from "../Components/Btn";
import { NumberInput } from "../Components/Input";
// import { Sub, Text } from "../Components/Text";
import dfstyles from "../Styles/dfstyles";
import { usePlanet, useUIManager } from "../Utils/AppHooks";
import { useEmitterValue } from "../Utils/EmitterHooks";
import type { ModalHandle } from "../Views/ModalPane";
import { ModalPane } from "../Views/ModalPane";
import SpaceshipCraftingPane from "./SpaceshipCraftingPane";
import { useFoundryCrafting } from "../../hooks/useFoundryCrafting";
import { useFoundryCraftingCount } from "../../hooks/useFoundryCraftingCount";
import MaterialTooltip from "../Components/MaterialTooltip";

const MaterialsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MaterialCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px;
  background-color: ${dfstyles.colors.backgroundlighter};
  border: 1px solid ${dfstyles.colors.borderDarker};
  border-radius: 6px;
  gap: 8px;
  cursor: help;
`;

const MaterialHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MaterialIcon = styled.div<{ color: string }>`
  width: 20px;
  height: 20px;
  background-color: ${(props) => props.color};
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
`;

const MaterialName = styled.div<{ color: string }>`
  color: ${(props) => props.color};
  font-weight: bold;
  font-size: 14px;
`;

const MaterialStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: ${dfstyles.colors.subtext};
`;

const SliderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Slider = styled.input`
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: ${dfstyles.colors.borderDarker};
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${dfstyles.colors.dfblue};
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${dfstyles.colors.dfblue};
    cursor: pointer;
    border: none;
  }
`;

const SliderValue = styled.div`
  min-width: 40px;
  text-align: right;
  font-size: 12px;
  color: ${dfstyles.colors.text};
`;

const SliderButtons = styled.div`
  display: flex;
  gap: 4px;
`;

const SliderButton = styled.button`
  width: 20px;
  height: 20px;
  border: 1px solid ${dfstyles.colors.borderDarker};
  background: ${dfstyles.colors.backgroundlighter};
  color: ${dfstyles.colors.text};
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;

  &:hover {
    background: ${dfstyles.colors.borderDarker};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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
  position: relative;

  &::after {
    content: "";
    display: block;
    width: ${(props) => props.percentage}%;
    height: 100%;
    background-color: ${(props) => getMaterialColor(props.materialID)};
    transition: width 0.3s ease;
  }
`;

const MaterialBarText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  z-index: 1;
  pointer-events: none;
`;

const IntegratedSlider = styled.input<{ materialID: MaterialType }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
  z-index: 2;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${dfstyles.colors.dfblue};
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${dfstyles.colors.dfblue};
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  &::-webkit-slider-track {
    background: transparent;
  }

  &::-moz-range-track {
    background: transparent;
  }
`;

const MaterialWithdrawContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

const WithdrawInput = styled.div`
  width: 80px;
`;

const WithdrawButton = styled(Btn)`
  padding: 4px 8px;
  font-size: 12px;
  min-width: 60px;
`;

const DepletedMessage = styled.div`
  margin-top: 1px;
  padding: 1px 1px;
  background: #4a3a2a;
  border: 1px solid #ff9800;
  border-radius: 4px;
  color: #ff9800;
  font-size: 12px;
  text-align: center;
  font-weight: bold;
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
      return "AURORIUM";
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
      return "CRYSTALL";
    default:
      return "Unknown";
  }
}

export function getMaterialIcon(materialId: MaterialType): string {
  switch (materialId) {
    case 1:
      return "💧";
    case 2:
      return "🌿";
    case 3:
      return "🌀";
    case 4:
      return "🌌";
    case 5:
      return "🧫";
    case 6:
      return "✨";
    case 7:
      return "🧊";
    case 8:
      return "🛠️";
    case 9:
      return "⚙️";
    case 10:
      return "🕳️";
    case 11:
      return "☣️";
    default:
      return "❓";
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
      return "Luminous mineral infused with polar energy, mined from aurora-lit tundra fields. Used in advanced navigation cores, sensor arrays, and energy-reflective ship plating.";
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
  modal: _modal,
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
  const [withdrawAmounts, setWithdrawAmounts] = useState<{
    [key: number]: number;
  }>({});

  const [materialAllocations, setMaterialAllocations] = useState<{
    [key: number]: number;
  }>({});

  // Use foundry crafting hook for real-time data
  const { craftingData, refetch } = useFoundryCrafting(planetId);

  // Use real-time component data for consistent visibility logic
  const { count: realTimeCraftingCount } = useFoundryCraftingCount(planetId);
  const canCraftMoreRealTime = realTimeCraftingCount < 3;

  const handleWithdraw = (materialType: MaterialType, amount: number) => {
    if (amount > 0 && planet) {
      uiManager.withdrawMaterial(planet.locationId, materialType, amount);
      // Clear the input after withdrawal
      setWithdrawAmounts((prev) => ({ ...prev, [materialType]: 0 }));
    }
  };

  const handleAmountChange = (materialType: MaterialType, value: string) => {
    const numValue = parseFloat(value) || 0;
    setWithdrawAmounts((prev) => ({ ...prev, [materialType]: numValue }));
  };

  const handleSliderChange = (materialType: MaterialType, value: number) => {
    setMaterialAllocations((prev) => ({ ...prev, [materialType]: value }));

    // Also update withdraw amounts based on slider percentage
    if (planet) {
      const material = planet.materials?.find(
        (m) => m?.materialId === materialType,
      );
      if (material) {
        const maxWithdraw = Number(material.materialAmount) / 1e18;
        const withdrawAmount = (value / 100) * maxWithdraw;
        setWithdrawAmounts((prev) => ({
          ...prev,
          [materialType]: withdrawAmount,
        }));
      }
    }
  };

  const handleSliderIncrement = (materialType: MaterialType) => {
    const current = materialAllocations[materialType] || 0;
    const newValue = Math.min(current + 5, 100);
    setMaterialAllocations((prev) => ({ ...prev, [materialType]: newValue }));

    // Also update withdraw amounts
    if (planet) {
      const material = planet.materials?.find(
        (m) => m.materialId === materialType,
      );
      if (material) {
        const maxWithdraw = Number(material.materialAmount) / 1e18;
        const withdrawAmount = (newValue / 100) * maxWithdraw;
        setWithdrawAmounts((prev) => ({
          ...prev,
          [materialType]: withdrawAmount,
        }));
      }
    }
  };

  const handleSliderDecrement = (materialType: MaterialType) => {
    const current = materialAllocations[materialType] || 0;
    const newValue = Math.max(current - 5, 0);
    setMaterialAllocations((prev) => ({ ...prev, [materialType]: newValue }));

    // Also update withdraw amounts
    if (planet) {
      const material = planet.materials?.find(
        (m) => m.materialId === materialType,
      );
      if (material) {
        const maxWithdraw = Number(material.materialAmount) / 1e18;
        const withdrawAmount = (newValue / 100) * maxWithdraw;
        setWithdrawAmounts((prev) => ({
          ...prev,
          [materialType]: withdrawAmount,
        }));
      }
    }
  };

  if (!planet) {
    return (
      <CenterBackgroundSubtext width="100%" height="200px">
        No planet selected
      </CenterBackgroundSubtext>
    );
  }

  const activeMaterials =
    planet.materials?.filter(
      (mat) => mat.materialId !== 0 && Number(mat.materialAmount) > 0,
    ) || [];

  // Check if this is a foundry planet
  const isFoundry = planet.planetType === 3; // FOUNDRY = 3

  // Use crafting data from the hook
  const currentMultiplier = craftingData.multiplier;

  return (
    <ModalPane
      title="Materials"
      visible={true}
      onClose={() => {
        /* close logic here */
      }}
      id={ModalName.PlanetMaterials}
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
              const allocation = materialAllocations[mat.materialId] || 0;

              return (
                <MaterialTooltip
                  key={mat.materialId}
                  materialType={mat.materialId}
                >
                  <MaterialCard>
                    <MaterialHeader>
                      <MaterialIcon color={materialColor}>
                        {getMaterialIcon(mat.materialId)}
                      </MaterialIcon>
                      <MaterialName color={materialColor}>
                        {getMaterialName(mat.materialId)}
                      </MaterialName>
                    </MaterialHeader>

                    <MaterialStats>
                      {planet.planetType === 4 && ( // SPACETIME_RIP (TRADING_POST)
                        <SliderContainer>
                          <SliderRow>
                            <SliderValue>{allocation}%</SliderValue>
                            <SliderButtons>
                              <SliderButton
                                onClick={() =>
                                  handleSliderDecrement(mat.materialId)
                                }
                                disabled={allocation <= 0}
                              >
                                -
                              </SliderButton>
                              <SliderButton
                                onClick={() =>
                                  handleSliderIncrement(mat.materialId)
                                }
                                disabled={allocation >= 100}
                              >
                                +
                              </SliderButton>
                            </SliderButtons>
                          </SliderRow>
                        </SliderContainer>
                      )}
                      {mat.growth && (
                        <div style={{ color: "#00ff00" }}>
                          +{formatCompact2(Number(mat.growthRate) / 1e18)}
                        </div>
                      )}
                    </MaterialStats>

                    <MaterialBar
                      percentage={percentage}
                      materialID={mat.materialId}
                    >
                      <MaterialBarText>
                        {formatCompact(Number(mat.materialAmount) / 1e18)} /{" "}
                        {formatCompact(Number(mat.cap) / 1e18)}
                      </MaterialBarText>
                      {planet.planetType === 4 && ( // SPACETIME_RIP (TRADING_POST)
                        <IntegratedSlider
                          type="range"
                          min="0"
                          max="100"
                          value={allocation}
                          materialID={mat.materialId}
                          onChange={(e) =>
                            handleSliderChange(
                              mat.materialId,
                              parseInt(e.target.value),
                            )
                          }
                        />
                      )}
                    </MaterialBar>

                    {/* Material Withdrawal Controls */}
                    {planet.planetType === 4 && ( // SPACETIME_RIP (TRADING_POST)
                      <MaterialWithdrawContainer>
                        <WithdrawInput>
                          <NumberInput
                            value={withdrawAmounts[mat.materialId] || 0}
                            onChange={(e) => {
                              if (e.target) {
                                handleAmountChange(
                                  mat.materialId,
                                  (e.target as HTMLInputElement).value,
                                );
                              }
                            }}
                          />
                        </WithdrawInput>
                        <WithdrawButton
                          onClick={() =>
                            handleWithdraw(
                              mat.materialId,
                              withdrawAmounts[mat.materialId] || 0,
                            )
                          }
                          disabled={
                            !withdrawAmounts[mat.materialId] ||
                            withdrawAmounts[mat.materialId] <= 0
                          }
                        >
                          Withdraw
                        </WithdrawButton>
                      </MaterialWithdrawContainer>
                    )}
                  </MaterialCard>
                </MaterialTooltip>
              );
            })}
          </MaterialsContainer>
        )}
      </Section>

      {/* Spaceship Crafting Section for Foundry Planets */}
      {isFoundry && (
        <Section>
          {canCraftMoreRealTime && (
            <SpaceshipCraftingPane
              planet={planet}
              onClose={() => {}} // No close needed since it's embedded
              craftingMultiplier={currentMultiplier}
              onCraftComplete={() => {
                // Refetch crafting data after successful craft
                refetch();
              }}
            />
          )}

          {!canCraftMoreRealTime && (
            <DepletedMessage>Crafting depleted</DepletedMessage>
          )}
        </Section>
      )}
    </ModalPane>
  );
}
