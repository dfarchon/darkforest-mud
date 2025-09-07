import React, { useState } from "react";
import styled from "styled-components";
import type { Planet } from "../../Shared/types/planet";
import type { SpaceshipType } from "../../Shared/types/artifact";
import { SpaceshipType as SpaceshipTypeEnum } from "../../Shared/types/artifact";
import { MaterialType, Biome, ArtifactRarity } from "@df/types";
import { getMaterialIcon, getMaterialName } from "./PlanetMaterialsPane";
import { formatNumber } from "@df/gamelogic";
import { useSpaceshipCrafting } from "../../hooks/useSpaceshipCrafting";
import { useFoundryCraftingCount } from "../../hooks/useFoundryCraftingCount";
import { useUIManager } from "../Utils/AppHooks";

interface SpaceshipCraftingPaneProps {
  planet: Planet;
  onClose: () => void;
  craftingMultiplier?: number;
  onCraftComplete?: () => void;
}

interface MaterialRequirement {
  materialType: MaterialType;
  amount: number;
  currentAmount: number;
}

interface SpaceshipConfig {
  type: (typeof SpaceshipTypeEnum)[keyof typeof SpaceshipTypeEnum];
  name: string;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  baseRange: number;
  materialRequirements: MaterialRequirement[];
}

const SpaceshipCraftingPane: React.FC<SpaceshipCraftingPaneProps> = ({
  planet,
  onClose: _onClose,
  craftingMultiplier: _craftingMultiplier = 1,
  onCraftComplete,
}) => {
  const [selectedSpaceshipType, setSelectedSpaceshipType] = useState(
    SpaceshipTypeEnum.Scout,
  );
  // Use planet's biome directly instead of selection
  const selectedBiome = (planet.biome as unknown as Biome) || Biome.OCEAN;

  const uiManager = useUIManager();
  const { craftingState } = useSpaceshipCrafting();
  const { count: craftingCount } = useFoundryCraftingCount(planet.locationId);

  // Calculate crafting multiplier based on actual crafting count
  let actualCraftingMultiplier = 1;
  if (craftingCount === 1) {
    actualCraftingMultiplier = 1.5;
  } else if (craftingCount === 2) {
    actualCraftingMultiplier = 2.25;
  }

  // Helper function to get material amount from planet
  const getMaterialAmount = (materialType: MaterialType): number => {
    const material = planet.materials?.find(
      (mat) => mat?.materialId === materialType,
    );
    return material ? Number(material.materialAmount) / 1e18 : 0;
  };

  const spaceshipConfigs: SpaceshipConfig[] = [
    {
      type: SpaceshipTypeEnum.Scout,
      name: "Scout",
      baseAttack: 50,
      baseDefense: 30,
      baseSpeed: 100,
      baseRange: 80,
      materialRequirements: [
        {
          materialType: MaterialType.WINDSTEEL,
          amount: Math.ceil(100 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.WINDSTEEL),
        },
        {
          materialType: MaterialType.AURORIUM,
          amount: Math.ceil(50 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.AURORIUM),
        },
      ],
    },
    {
      type: SpaceshipTypeEnum.Fighter,
      name: "Fighter",
      baseAttack: 100,
      baseDefense: 60,
      baseSpeed: 70,
      baseRange: 60,
      materialRequirements: [
        {
          materialType: MaterialType.PYROSTEEL,
          amount: Math.ceil(150 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.PYROSTEEL),
        },
        {
          materialType: MaterialType.SCRAPIUM,
          amount: Math.ceil(100 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.SCRAPIUM),
        },
      ],
    },
    {
      type: SpaceshipTypeEnum.Destroyer,
      name: "Destroyer",
      baseAttack: 150,
      baseDefense: 100,
      baseSpeed: 50,
      baseRange: 90,
      materialRequirements: [
        {
          materialType: MaterialType.BLACKALLOY,
          amount: Math.ceil(200 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.BLACKALLOY),
        },
        {
          materialType: MaterialType.CORRUPTED_CRYSTAL,
          amount: Math.ceil(100 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.CORRUPTED_CRYSTAL),
        },
      ],
    },
    {
      type: SpaceshipTypeEnum.Carrier,
      name: "Carrier",
      baseAttack: 80,
      baseDefense: 150,
      baseSpeed: 40,
      baseRange: 120,
      materialRequirements: [
        {
          materialType: MaterialType.LIVING_WOOD,
          amount: Math.ceil(200 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.LIVING_WOOD),
        },
        {
          materialType: MaterialType.CRYOSTONE,
          amount: Math.ceil(150 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.CRYOSTONE),
        },
      ],
    },
  ];

  const selectedConfig = spaceshipConfigs.find(
    (config) => config.type === selectedSpaceshipType,
  );

  const canCraft =
    selectedConfig?.materialRequirements.every(
      (req) => req.currentAmount >= req.amount,
    ) ?? false;

  // Check if crafting limit reached (3/3)
  const isCraftingLimitReached = craftingCount >= 3;

  const predictSpaceshipRarity = (): ArtifactRarity => {
    if (!selectedConfig) return ArtifactRarity.Common;

    // Base rarity chance based on planet level
    const planetLevel = planet.level || 1;
    const baseRarityChance = Math.min(planetLevel * 0.1, 0.8); // Max 80% chance for higher rarity

    // Material quality bonus
    const materialQualityBonus = selectedConfig.materialRequirements.reduce(
      (sum, req) => {
        const materialRarity = getMaterialRarity(req.materialType);
        return sum + (materialRarity / 10000) * 0.1; // Convert to percentage bonus
      },
      0,
    );

    // Total rarity chance (removed biome crafting bonus as it's not used in contract)
    const totalRarityChance = Math.min(
      baseRarityChance + materialQualityBonus,
      0.95,
    );

    // Simulate rarity roll based on chance
    const roll = Math.random();

    if (roll < totalRarityChance * 0.05) return ArtifactRarity.Mythic; // 5% of total chance
    if (roll < totalRarityChance * 0.15) return ArtifactRarity.Legendary; // 10% of total chance
    if (roll < totalRarityChance * 0.35) return ArtifactRarity.Epic; // 20% of total chance
    if (roll < totalRarityChance * 0.65) return ArtifactRarity.Rare; // 30% of total chance
    return ArtifactRarity.Common; // Remaining chance
  };

  const getMaterialRarity = (materialType: MaterialType): number => {
    const rarityMap = {
      [MaterialType.WATER_CRYSTALS]: 1000,
      [MaterialType.LIVING_WOOD]: 1000,
      [MaterialType.WINDSTEEL]: 1000,
      [MaterialType.AURORIUM]: 5000,
      [MaterialType.MYCELIUM]: 5000,
      [MaterialType.SANDGLASS]: 5000,
      [MaterialType.CRYOSTONE]: 20000,
      [MaterialType.SCRAPIUM]: 20000,
      [MaterialType.PYROSTEEL]: 20000,
      [MaterialType.BLACKALLOY]: 100000,
      [MaterialType.CORRUPTED_CRYSTAL]: 100000,
    };
    return rarityMap[materialType] || 1000;
  };

  const getRarityMultiplier = (rarity: ArtifactRarity): number => {
    // Match contract's _getRarityMultiplier function exactly
    if (rarity === ArtifactRarity.Common) return 100;
    if (rarity === ArtifactRarity.Rare) return 120;
    if (rarity === ArtifactRarity.Epic) return 150;
    if (rarity === ArtifactRarity.Legendary) return 200;
    if (rarity === ArtifactRarity.Mythic) return 300;
    return 100;
  };

  const getBiomeAttackBonus = (biome: Biome): number => {
    // Match contract's _getBiomeAttackBonus function exactly
    if (biome === Biome.TUNDRA) return 20;
    if (biome === Biome.DESERT) return 20;
    if (biome === Biome.WASTELAND) return 15;
    if (biome === Biome.LAVA) return 30;
    if (biome === Biome.CORRUPTED) return 25;
    return 0;
  };

  const getBiomeDefenseBonus = (biome: Biome): number => {
    // Match contract's _getBiomeDefenseBonus function exactly
    if (biome === Biome.FOREST) return 15;
    if (biome === Biome.SWAMP) return 15;
    if (biome === Biome.ICE) return 25;
    if (biome === Biome.WASTELAND) return 15;
    if (biome === Biome.CORRUPTED) return 25;
    return 0;
  };

  const getBiomeSpeedBonus = (biome: Biome): number => {
    // Match contract's _getBiomeSpeedBonus function exactly
    if (biome === Biome.OCEAN) return 20;
    if (biome === Biome.GRASSLAND) return 25;
    if (biome === Biome.CORRUPTED) return 25;
    return 0;
  };

  const getBiomeRangeBonus = (biome: Biome): number => {
    // Match contract's _getBiomeRangeBonus function exactly
    if (biome === Biome.OCEAN) return 10;
    if (biome === Biome.FOREST) return 5;
    if (biome === Biome.GRASSLAND) return 15;
    if (biome === Biome.TUNDRA) return 5;
    if (biome === Biome.SWAMP) return 10;
    if (biome === Biome.DESERT) return 10;
    if (biome === Biome.ICE) return 5;
    if (biome === Biome.WASTELAND) return 10;
    if (biome === Biome.LAVA) return 5;
    if (biome === Biome.CORRUPTED) return 15;
    return 0;
  };

  const getButtonText = (): string => {
    if (craftingState.isCrafting) return "Crafting...";
    if (isCraftingLimitReached) return "Crafting Limit Reached (3/3)";
    return "Craft Spaceship";
  };

  const handleCraftSpaceship = async () => {
    if (!canCraft || !selectedConfig) return;

    try {
      // Prepare materials and amounts for contract call
      const materials = selectedConfig.materialRequirements.map(
        (req) => req.materialType,
      );
      const amounts = selectedConfig.materialRequirements.map((req) =>
        BigInt(Math.floor(req.amount)),
      );

      // Call the contract through UIManager
      await uiManager.craftSpaceship(
        planet.locationId,
        selectedSpaceshipType,
        materials,
        amounts,
        selectedBiome,
      );

      console.log("Spaceship crafted successfully:", {
        planet: planet.locationId,
        spaceshipType: selectedSpaceshipType,
        materials,
        amounts,
        biome: selectedBiome,
        craftingMultiplier: actualCraftingMultiplier,
        craftingCount,
      });

      // Call the craft complete callback to increment the crafting count
      if (onCraftComplete) {
        onCraftComplete();
      }
    } catch (error) {
      console.error("Failed to craft spaceship:", error);
      // Error handling is done by the UIManager/GameManager
    }
  };

  return (
    <Container>
      <Header>
        <Title>🚀 Spaceship Crafting</Title>
      </Header>

      {/* do in one row with the title move to middle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          justifyContent: "center",
        }}
      >
        <CraftingCounter>
          <CounterLabel>Crafting:</CounterLabel>
          <CounterValue limitReached={isCraftingLimitReached}>
            {craftingCount}/3
          </CounterValue>
        </CraftingCounter>
        <MultiplierDisplay>
          {actualCraftingMultiplier.toFixed(1)}x
        </MultiplierDisplay>
        <div>+{Math.round((actualCraftingMultiplier - 1) * 100)}%</div>
      </div>
      <Content>
        <Section>
          <SpaceshipGrid>
            {(() => {
              // Calculate rarity once for all spaceships to ensure consistent stats
              const rarity = predictSpaceshipRarity();
              const rarityMultiplier = getRarityMultiplier(rarity);
              const biomeAttackBonus = getBiomeAttackBonus(selectedBiome);
              const biomeDefenseBonus = getBiomeDefenseBonus(selectedBiome);
              const biomeSpeedBonus = getBiomeSpeedBonus(selectedBiome);
              const biomeRangeBonus = getBiomeRangeBonus(selectedBiome);

              return spaceshipConfigs.map((config) => {
                // Match contract's calculation exactly: baseStat + (biomeBonus * rarityMultiplier / 100)
                const projectedStats = {
                  attack: Math.round(
                    config.baseAttack +
                      (biomeAttackBonus * rarityMultiplier) / 100,
                  ),
                  defense: Math.round(
                    config.baseDefense +
                      (biomeDefenseBonus * rarityMultiplier) / 100,
                  ),
                  speed: Math.round(
                    config.baseSpeed +
                      (biomeSpeedBonus * rarityMultiplier) / 100,
                  ),
                  range: Math.round(
                    config.baseRange +
                      (biomeRangeBonus * rarityMultiplier) / 100,
                  ),
                };

                return (
                  <SpaceshipCard
                    key={config.type}
                    selected={selectedSpaceshipType === config.type}
                    onClick={() => setSelectedSpaceshipType(config.type)}
                  >
                    <SpaceshipName>{config.name}</SpaceshipName>
                    <SpaceshipStats>
                      <StatsRow>
                        <Stat>Atk: {projectedStats.attack}</Stat>
                        <Stat>Def: {projectedStats.defense}</Stat>
                      </StatsRow>
                      <StatsRow>
                        <Stat>Spe: {projectedStats.speed}</Stat>
                        <Stat>Rng: {projectedStats.range}</Stat>
                      </StatsRow>
                    </SpaceshipStats>
                  </SpaceshipCard>
                );
              });
            })()}
          </SpaceshipGrid>
        </Section>

        {selectedConfig && (
          <Section>
            <SectionTitle>
              Material Requirements
              {actualCraftingMultiplier > 1 && (
                <span
                  style={{
                    color: "#ff6b6b",
                    fontSize: "12px",
                    marginLeft: "8px",
                  }}
                >
                  (×{actualCraftingMultiplier.toFixed(2)} cost multiplier)
                </span>
              )}
            </SectionTitle>
            <MaterialList>
              {selectedConfig.materialRequirements.map((req, index) => (
                <MaterialItem
                  key={index}
                  insufficient={req.currentAmount < req.amount}
                >
                  <MaterialIcon>
                    {getMaterialIcon(req.materialType)}
                  </MaterialIcon>
                  <MaterialInfo>
                    <MaterialName>
                      {getMaterialName(req.materialType)}
                    </MaterialName>
                    <MaterialAmount
                      insufficient={req.currentAmount < req.amount}
                    >
                      {formatNumber(req.currentAmount)} /{" "}
                      {formatNumber(req.amount)}
                    </MaterialAmount>
                  </MaterialInfo>
                  <MaterialStatus insufficient={req.currentAmount < req.amount}>
                    {req.currentAmount >= req.amount ? "✓" : "✗"}
                  </MaterialStatus>
                </MaterialItem>
              ))}
            </MaterialList>
          </Section>
        )}

        <CraftButton
          onClick={handleCraftSpaceship}
          disabled={
            !canCraft || craftingState.isCrafting || isCraftingLimitReached
          }
        >
          {getButtonText()}
        </CraftButton>

        {craftingState.error && (
          <ErrorMessage>Error: {craftingState.error}</ErrorMessage>
        )}

        {craftingState.success && (
          <SuccessMessage>Spaceship crafted successfully!</SuccessMessage>
        )}
      </Content>
    </Container>
  );
};

// Styled components
const Container = styled.div`
  width: 100%;
  background: #1a1a1a;
  border: 2px solid #333;
  border-radius: 8px;
  margin-top: 16px;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #333;
`;

const Title = styled.h2`
  margin: 0;
  color: #fff;
`;

const CraftingCounter = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #2a2a2a;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #444;
`;

const CounterLabel = styled.span`
  color: #ccc;
  font-size: 12px;
  font-weight: 500;
`;

const CounterValue = styled.span<{ limitReached: boolean }>`
  color: ${(props) => (props.limitReached ? "#ff6b6b" : "#4caf50")};
  font-size: 12px;
  font-weight: bold;
  font-family: "Courier New", monospace;
`;

const MultiplierDisplay = styled.span`
  color: #ff9800;
  font-size: 12px;
  font-weight: bold;
  font-family: "Courier New", monospace;
  background: #2a2a2a;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #444;
`;

const Content = styled.div`
  padding: 16px;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px 0;
  color: #fff;
  font-size: 16px;
`;

const SpaceshipGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const SpaceshipCard = styled.div<{ selected: boolean }>`
  padding: 12px;
  border: 2px solid ${(props) => (props.selected ? "#4CAF50" : "#333")};
  border-radius: 6px;
  cursor: pointer;
  background: ${(props) => (props.selected ? "#2a4a2a" : "#222")};
  transition: all 0.2s;
`;

const SpaceshipName = styled.div`
  font-weight: bold;
  color: #fff;
  margin-bottom: 8px;
`;

const SpaceshipStats = styled.div`
  font-size: 12px;
  color: #ccc;
`;

const StatsRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
`;

const Stat = styled.div`
  flex: 1;
  text-align: center;
`;

const MaterialList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MaterialItem = styled.div<{ insufficient: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px;
  background: ${(props) => (props.insufficient ? "#4a2a2a" : "#2a2a2a")};
  border-radius: 6px;
  border-left: 4px solid
    ${(props) => (props.insufficient ? "#ff6b6b" : "#4caf50")};
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => (props.insufficient ? "#5a3a3a" : "#3a3a3a")};
  }
`;

const MaterialIcon = styled.div`
  font-size: 20px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
`;

const MaterialInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MaterialName = styled.span`
  font-weight: 600;
  color: #fff;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MaterialAmount = styled.span<{ insufficient: boolean }>`
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: ${(props) => (props.insufficient ? "#ff6b6b" : "#4caf50")};
  font-weight: 500;
`;

const MaterialStatus = styled.div<{ insufficient: boolean }>`
  font-size: 16px;
  color: ${(props) => (props.insufficient ? "#ff6b6b" : "#4caf50")};
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
`;

const CraftButton = styled.button`
  width: 100%;
  padding: 12px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 16px;

  &:disabled {
    background: #666;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: #45a049;
  }
`;

const ErrorMessage = styled.div`
  margin-top: 12px;
  padding: 8px 12px;
  background: #4a2a2a;
  border: 1px solid #ff6b6b;
  border-radius: 4px;
  color: #ff6b6b;
  font-size: 14px;
  text-align: center;
`;

const SuccessMessage = styled.div`
  margin-top: 12px;
  padding: 8px 12px;
  background: #2a4a2a;
  border: 1px solid #4caf50;
  border-radius: 4px;
  color: #4caf50;
  font-size: 14px;
  text-align: center;
`;

export default SpaceshipCraftingPane;
