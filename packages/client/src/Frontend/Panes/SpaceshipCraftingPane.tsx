import { formatNumber } from "@df/gamelogic";
import { ArtifactRarity, Biome, MaterialType } from "@df/types";
import React, { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";

import { useFoundryCraftingCount } from "../../hooks/useFoundryCraftingCount";
import { useSpaceshipCrafting } from "../../hooks/useSpaceshipCrafting";
import { SpaceshipType as SpaceshipTypeEnum } from "../../Shared/types/artifact";
import type { Planet } from "../../Shared/types/planet";
import { Icon, IconType } from "../Components/Icons";
import { useUIManager } from "../Utils/AppHooks";
import { getMaterialIcon } from "./PlanetMaterialsPane";
import { getMaterialTooltipName, TooltipTrigger } from "./Tooltip";
import { CONTRACT_PRECISION } from "@df/constants";

// Custom spaceship sprite URLs
const SPACESHIP_SPRITES = {
  [SpaceshipTypeEnum.Scout]: "/sprites/Scouts.png",
  [SpaceshipTypeEnum.Fighter]: "/sprites/Fighters.png",
  [SpaceshipTypeEnum.Destroyer]: "/sprites/Destroyers.png",
  [SpaceshipTypeEnum.Carrier]: "/sprites/Cruisers.png", // Using Cruisers.png for Carrier
} as const;

// Custom spaceship sprite component
const CustomSpaceshipSprite: React.FC<{
  spaceshipType: number;
  biome: Biome;
  size: number;
  rarity?: ArtifactRarity;
}> = ({
  spaceshipType,
  biome: biomeType,
  size,
  rarity = ArtifactRarity.Common,
}) => {
  const getBiomeIndex = (biome: Biome): number => {
    const biomeMap = {
      [Biome.OCEAN]: 0,
      [Biome.FOREST]: 1,
      [Biome.GRASSLAND]: 2,
      [Biome.TUNDRA]: 3,
      [Biome.SWAMP]: 4,
      [Biome.DESERT]: 5,
      [Biome.ICE]: 6,
      [Biome.WASTELAND]: 7,
      [Biome.LAVA]: 8,
      [Biome.CORRUPTED]: 9,
    };
    return biomeMap[biome] ?? 0;
  };

  const biomeIndex = getBiomeIndex(biomeType);
  const spriteUrl =
    SPACESHIP_SPRITES[spaceshipType as keyof typeof SPACESHIP_SPRITES];

  // Determine visual effects based on rarity
  const isLegendary = rarity === ArtifactRarity.Legendary;
  const isMythic = rarity === ArtifactRarity.Mythic;
  const hasShine = rarity >= ArtifactRarity.Rare;

  if (!spriteUrl) {
    return (
      <div style={{ width: size, height: size, backgroundColor: "#333" }} />
    );
  }

  return (
    <SpaceshipContainer size={size}>
      {isMythic ? (
        <MythicSpaceshipSprite
          size={size}
          src={spriteUrl}
          biomeIndex={biomeIndex}
          isLegendary={isLegendary}
        />
      ) : (
        <SpaceshipSpriteImage
          size={size}
          src={spriteUrl}
          biomeIndex={biomeIndex}
          isLegendary={isLegendary}
          isMythic={isMythic}
        />
      )}
      {hasShine && (
        <SpaceshipShineOverlay
          size={size}
          isLegendary={isLegendary}
          isMythic={isMythic}
        />
      )}
    </SpaceshipContainer>
  );
};

// Component for mythic spaceships with pixel manipulation effects
const MythicSpaceshipSprite: React.FC<{
  size: number;
  src: string;
  biomeIndex: number;
  isLegendary: boolean;
}> = ({ size, src, biomeIndex, isLegendary }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set willReadFrequently for better performance
    (
      ctx as CanvasRenderingContext2D & { willReadFrequently?: boolean }
    ).willReadFrequently = true;

    // Set canvas size
    canvas.width = size;
    canvas.height = size;

    // Calculate sprite position (same logic as SpaceshipSpriteImage)
    const spriteWidth = 64; // Original sprite width in the sheet

    // Apply legendary color inversion if needed
    if (isLegendary) {
      ctx.filter = "invert(1)";
    }

    // Draw the specific biome sprite
    ctx.drawImage(
      image,
      biomeIndex * spriteWidth,
      0,
      spriteWidth,
      spriteWidth,
      0,
      0,
      size,
      size,
    );

    // Apply mythic pixel manipulation effects
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Check if pixel is black or white (preserve them)
      const isBlack = r < 13 && g < 13 && b < 13;
      const isWhite = r > 242 && g > 242 && b > 242;

      if (!isBlack && !isWhite) {
        // Apply mythic color transformation (same as Overlay2DRenderer)
        data[i] = Math.min(255, Math.max(0, (r - 89) * 3 + 89)); // Red
        data[i + 1] = Math.min(255, Math.max(0, (g - 89) * 3 + 89)); // Green
        data[i + 2] = Math.min(255, Math.max(0, (b - 89) * 3 + 89)); // Blue
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [size, biomeIndex, isLegendary]);

  return (
    <>
      <img
        ref={imageRef}
        src={src}
        style={{ display: "none" }}
        onLoad={() => {
          // Trigger canvas redraw when image loads
          const canvas = canvasRef.current;
          const image = imageRef.current;
          if (!canvas || !image) return;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          canvas.width = size;
          canvas.height = size;

          const spriteWidth = 64;

          if (isLegendary) {
            ctx.filter = "invert(1)";
          }

          ctx.drawImage(
            image,
            biomeIndex * spriteWidth,
            0,
            spriteWidth,
            spriteWidth,
            0,
            0,
            size,
            size,
          );

          const imageData = ctx.getImageData(0, 0, size, size);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const isBlack = r < 13 && g < 13 && b < 13;
            const isWhite = r > 242 && g > 242 && b > 242;

            if (!isBlack && !isWhite) {
              data[i] = Math.min(255, Math.max(0, (r - 89) * 3 + 89));
              data[i + 1] = Math.min(255, Math.max(0, (g - 89) * 3 + 89));
              data[i + 2] = Math.min(255, Math.max(0, (b - 89) * 3 + 89));
            }
          }

          ctx.putImageData(imageData, 0, 0);
        }}
      />
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          imageRendering: "crisp-edges",
        }}
      />
    </>
  );
};

// Info tooltip styled components
const InfoTooltipContainer = styled.div`
  position: relative;
  display: inline-block;
  cursor: help;
`;

const InfoTooltipBox = styled.div<{
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

const InfoTooltipTitle = styled.div`
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 6px;
`;

const InfoTooltipDescription = styled.div`
  color: #ccc;
  font-size: 12px;
  line-height: 1.4;
`;

// Info tooltip component for crafting explanations
interface InfoTooltipProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({
  title,
  description,
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
    <InfoTooltipContainer
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <InfoTooltipBox
        mouseX={mousePosition.x}
        mouseY={mousePosition.y}
        visible={isVisible}
      >
        <InfoTooltipTitle>{title}</InfoTooltipTitle>
        <InfoTooltipDescription>{description}</InfoTooltipDescription>
      </InfoTooltipBox>
    </InfoTooltipContainer>
  );
};

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

interface SpaceshipTypeConfig {
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
  const selectedBiome =
    ((planet as { biome?: Biome }).biome as unknown as Biome) || Biome.OCEAN;

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
    return material ? Number(material.materialAmount) : 0;
  };

  const spaceshipConfigs: SpaceshipTypeConfig[] = [
    {
      type: SpaceshipTypeEnum.Scout,
      name: "Scout",
      baseAttack: 0,
      baseDefense: 0,
      baseSpeed: 10,
      baseRange: 5,
      materialRequirements: [
        {
          materialType: MaterialType.WATER_CRYSTALS,
          amount: Math.ceil(50 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.WATER_CRYSTALS),
        },
        {
          materialType: MaterialType.LIVING_WOOD,
          amount: Math.ceil(50 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.LIVING_WOOD),
        },
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
      baseAttack: 5,
      baseDefense: 5,
      baseSpeed: 0,
      baseRange: 5,
      materialRequirements: [
        {
          materialType: MaterialType.WATER_CRYSTALS,
          amount: Math.ceil(100 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.WATER_CRYSTALS),
        },
        {
          materialType: MaterialType.LIVING_WOOD,
          amount: Math.ceil(100 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.LIVING_WOOD),
        },
        {
          materialType: MaterialType.WINDSTEEL,
          amount: Math.ceil(200 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.WINDSTEEL),
        },
        {
          materialType: MaterialType.AURORIUM,
          amount: Math.ceil(100 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.AURORIUM),
        },
        {
          materialType: MaterialType.SANDGLASS,
          amount: Math.ceil(100 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.SANDGLASS),
        },
        {
          materialType: MaterialType.CRYOSTONE,
          amount: Math.ceil(150 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.CRYOSTONE),
        },
        {
          materialType: MaterialType.SCRAPIUM,
          amount: Math.ceil(100 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.SCRAPIUM),
        },
        {
          materialType: MaterialType.PYROSTEEL,
          amount: Math.ceil(100 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.PYROSTEEL),
        },
      ],
    },
    {
      type: SpaceshipTypeEnum.Destroyer,
      name: "Destroyer",
      baseAttack: 10,
      baseDefense: 10,
      baseSpeed: 0,
      baseRange: 0,
      materialRequirements: [
        {
          materialType: MaterialType.WATER_CRYSTALS,
          amount: Math.ceil(300 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.WATER_CRYSTALS),
        },
        {
          materialType: MaterialType.LIVING_WOOD,
          amount: Math.ceil(300 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.LIVING_WOOD),
        },
        {
          materialType: MaterialType.WINDSTEEL,
          amount: Math.ceil(400 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.WINDSTEEL),
        },
        {
          materialType: MaterialType.AURORIUM,
          amount: Math.ceil(300 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.AURORIUM),
        },
        {
          materialType: MaterialType.MYCELIUM,
          amount: Math.ceil(300 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.MYCELIUM),
        },
        {
          materialType: MaterialType.SANDGLASS,
          amount: Math.ceil(500 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.SANDGLASS),
        },
        {
          materialType: MaterialType.CRYOSTONE,
          amount: Math.ceil(500 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.CRYOSTONE),
        },
        {
          materialType: MaterialType.SCRAPIUM,
          amount: Math.ceil(500 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.SCRAPIUM),
        },
        {
          materialType: MaterialType.PYROSTEEL,
          amount: Math.ceil(500 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.PYROSTEEL),
        },
        {
          materialType: MaterialType.BLACKALLOY,
          amount: Math.ceil(200 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.BLACKALLOY),
        },
        {
          materialType: MaterialType.CORRUPTED_CRYSTAL,
          amount: Math.ceil(200 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.CORRUPTED_CRYSTAL),
        },
      ],
    },
    {
      type: SpaceshipTypeEnum.Carrier,
      name: "Carrier",
      baseAttack: 5,
      baseDefense: 15,
      baseSpeed: 0,
      baseRange: 3,
      materialRequirements: [
        {
          materialType: MaterialType.WATER_CRYSTALS,
          amount: Math.ceil(500 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.WATER_CRYSTALS),
        },
        {
          materialType: MaterialType.LIVING_WOOD,
          amount: Math.ceil(500 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.LIVING_WOOD),
        },
        {
          materialType: MaterialType.WINDSTEEL,
          amount: Math.ceil(800 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.WINDSTEEL),
        },
        {
          materialType: MaterialType.AURORIUM,
          amount: Math.ceil(800 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.AURORIUM),
        },
        {
          materialType: MaterialType.MYCELIUM,
          amount: Math.ceil(500 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.MYCELIUM),
        },
        {
          materialType: MaterialType.SANDGLASS,
          amount: Math.ceil(700 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.SANDGLASS),
        },
        {
          materialType: MaterialType.CRYOSTONE,
          amount: Math.ceil(700 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.CRYOSTONE),
        },
        {
          materialType: MaterialType.SCRAPIUM,
          amount: Math.ceil(700 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.SCRAPIUM),
        },
        {
          materialType: MaterialType.PYROSTEEL,
          amount: Math.ceil(700 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.PYROSTEEL),
        },
        {
          materialType: MaterialType.BLACKALLOY,
          amount: Math.ceil(400 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.BLACKALLOY),
        },
        {
          materialType: MaterialType.CORRUPTED_CRYSTAL,
          amount: Math.ceil(400 * actualCraftingMultiplier),
          currentAmount: getMaterialAmount(MaterialType.CORRUPTED_CRYSTAL),
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

    // Use deterministic rarity based on planet level for stable predictions
    const planetLevel = planet.planetLevel || 1;

    // Determine rarity based on planet level thresholds (matching contract logic)
    if (planetLevel <= 1) return ArtifactRarity.Common;
    if (planetLevel <= 3) return ArtifactRarity.Rare;
    if (planetLevel <= 5) return ArtifactRarity.Epic;
    if (planetLevel <= 7) return ArtifactRarity.Legendary;
    return ArtifactRarity.Mythic;
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
  const getBiomeBonus = (biome: Biome): number => {
    const b = Number(biome);
    if (b >= 1 && b <= 3) {
      return 1;
    } else if (b >= 4 && b <= 6) {
      return 2;
    } else if (b >= 7 && b <= 9) {
      return 4;
    } else if (b == 10) {
      return 8;
    }
    return 0;
  };

  // Spaceship role-specific bonus functions (matching contract)
  const getSpaceshipRoleAttackBonus = (spaceshipType: number): number => {
    // Scout: 0, Fighter: 5, Destroyer: 10, Carrier: 5
    if (spaceshipType === 1) return 0; // Scout - no attack bonus
    if (spaceshipType === 2) return 5; // Fighter
    if (spaceshipType === 3) return 10; // Destroyer
    if (spaceshipType === 4) return 5; // Carrier
    return 0;
  };

  const getSpaceshipRoleDefenseBonus = (spaceshipType: number): number => {
    // Scout: 0, Fighter: 5, Destroyer: 10, Carrier: 15
    if (spaceshipType === 1) return 0; // Scout
    if (spaceshipType === 2) return 5; // Fighter
    if (spaceshipType === 3) return 10; // Destroyer
    if (spaceshipType === 4) return 15; // Carrier
    return 0;
  };

  const getSpaceshipRoleSpeedBonus = (spaceshipType: number): number => {
    // Scout: 10, Fighter: 0, Destroyer: 0, Carrier: 0
    if (spaceshipType === 1) return 10; // Scout
    if (spaceshipType === 2) return 0; // Fighter
    if (spaceshipType === 3) return 0; // Destroyer
    if (spaceshipType === 4) return 0; // Carrier
    return 0;
  };

  const getSpaceshipRoleRangeBonus = (spaceshipType: number): number => {
    // Scout: 5, Fighter: 5, Destroyer: 0, Carrier: 3
    if (spaceshipType === 1) return 5; // Scout
    if (spaceshipType === 2) return 5; // Fighter
    if (spaceshipType === 3) return 0; // Destroyer - no range bonus
    if (spaceshipType === 4) return 3; // Carrier
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
        Math.floor(req.amount),
      );

      // Call the contract through UIManager
      await uiManager.craftSpaceship(
        planet.locationId,
        selectedSpaceshipType,
        materials,
        amounts,
        selectedBiome,
      );

      console.log("Spaceship START crafted:", {
        planet: planet.locationId,
        spaceshipType: selectedSpaceshipType,
        materials,
        amounts,
        biome: selectedBiome,
        craftingMultiplier: actualCraftingMultiplier,
        craftingCount,
        selectedConfig,
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
      {/* do in one row with the title move to middle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          justifyContent: "center",
        }}
      >
        <InfoTooltip
          title="Crafting Limit"
          description="Foundry is possible to craft max 3x spaceships per planet"
        >
          <CraftingCounter>
            <CounterLabel>Craft:</CounterLabel>
            <CounterValue limitReached={isCraftingLimitReached}>
              {craftingCount}/3
            </CounterValue>
          </CraftingCounter>
        </InfoTooltip>
        <InfoTooltip
          title="Crafting Multiplier"
          description="Any crafted ships need more materials. Each craft increases the cost multiplier."
        >
          <MultiplierDisplay>
            {actualCraftingMultiplier.toFixed(1)}x
          </MultiplierDisplay>
        </InfoTooltip>
        {/* <div>+{Math.round((actualCraftingMultiplier - 1) * 100)}%</div> */}
      </div>
      <Content>
        <Section>
          <SpaceshipGrid>
            {(() => {
              // Calculate rarity once for all spaceships to ensure consistent stats
              // Use the same logic as contract's _calculateSpaceshipRarity function
              const foundryRarity = predictSpaceshipRarity();
              const rarityMultiplier = getRarityMultiplier(foundryRarity);
              const biomeAttackBonus = getBiomeBonus(selectedBiome);
              const biomeDefenseBonus = getBiomeBonus(selectedBiome);
              const biomeSpeedBonus = getBiomeBonus(selectedBiome);
              const biomeRangeBonus = getBiomeBonus(selectedBiome);

              return spaceshipConfigs.map((config) => {
                // Calculate role bonuses based on CURRENT spaceship type in the loop (not selectedSpaceshipType)
                const roleAttackBonus =
                  getSpaceshipRoleAttackBonus(config.type) + biomeAttackBonus;
                const roleDefenseBonus =
                  getSpaceshipRoleDefenseBonus(config.type) + biomeDefenseBonus;
                const roleSpeedBonus =
                  getSpaceshipRoleSpeedBonus(config.type) + biomeSpeedBonus;
                const roleRangeBonus =
                  getSpaceshipRoleRangeBonus(config.type) + biomeRangeBonus;

                // Calculate projected stats for each spaceship type using its own role bonuses
                const projectedStats = {
                  attack:
                    config.baseAttack === 0
                      ? config.baseAttack
                      : Math.round((roleAttackBonus * rarityMultiplier) / 100),
                  defense:
                    config.baseDefense === 0
                      ? config.baseDefense
                      : Math.round((roleDefenseBonus * rarityMultiplier) / 100),
                  speed:
                    config.baseSpeed === 0
                      ? config.baseSpeed
                      : Math.round((roleSpeedBonus * rarityMultiplier) / 100),
                  range:
                    config.baseRange === 0
                      ? config.baseRange
                      : Math.round((roleRangeBonus * rarityMultiplier) / 100),
                };

                return (
                  <SpaceshipCard
                    key={config.type}
                    selected={selectedSpaceshipType === config.type}
                    onClick={() => setSelectedSpaceshipType(config.type)}
                  >
                    {/* Corner Stats */}
                    <CornerStat top left>
                      <Icon type={IconType.Target} />
                      <span
                        style={{
                          color:
                            projectedStats.attack > 0 ? "#00DC82" : "#FF6492",
                        }}
                      >
                        {projectedStats.attack > 0
                          ? `+${projectedStats.attack}%`
                          : projectedStats.attack}
                      </span>
                    </CornerStat>

                    <CornerStat top right>
                      <Icon type={IconType.Defense} />
                      <span
                        style={{
                          color:
                            projectedStats.defense > 0 ? "#00DC82" : "#FF6492",
                        }}
                      >
                        {projectedStats.defense > 0
                          ? `+${projectedStats.defense}%`
                          : projectedStats.defense}
                      </span>
                    </CornerStat>

                    <CornerStat bottom left>
                      <Icon type={IconType.Speed} />
                      <span
                        style={{
                          color:
                            projectedStats.speed > 0 ? "#00DC82" : "#FF6492",
                        }}
                      >
                        {projectedStats.speed > 0
                          ? `+${projectedStats.speed}%`
                          : projectedStats.speed}
                      </span>
                    </CornerStat>

                    <CornerStat bottom right>
                      <Icon type={IconType.Range} />
                      <span
                        style={{
                          color:
                            projectedStats.range > 0 ? "#00DC82" : "#FF6492",
                        }}
                      >
                        {projectedStats.range > 0
                          ? `+${projectedStats.range}%`
                          : projectedStats.range}
                      </span>
                    </CornerStat>

                    {/* Background Sprite */}
                    <BackgroundSprite>
                      <CustomSpaceshipSprite
                        spaceshipType={config.type}
                        biome={selectedBiome}
                        size={60}
                        rarity={foundryRarity}
                      />
                    </BackgroundSprite>
                  </SpaceshipCard>
                );
              });
            })()}
          </SpaceshipGrid>
        </Section>

        {selectedConfig && (
          <Section>
            <MaterialList>
              {/* TODO selectedConfig.materialRequirements arange ascending by materialType   */}
              {selectedConfig.materialRequirements
                .sort((a, b) => a.materialType - b.materialType)
                .map((req) => (
                  <MaterialItem
                    key={req.materialType}
                    insufficient={req.currentAmount < req.amount}
                  >
                    <TooltipTrigger
                      name={getMaterialTooltipName(req.materialType)}
                    >
                      <MaterialIcon>
                        {getMaterialIcon(req.materialType)}
                      </MaterialIcon>
                    </TooltipTrigger>
                    <MaterialInfo>
                      {/* <MaterialName>
                          {getMaterialName(req.materialType)}
                        </MaterialName> */}
                      <MaterialAmount
                        insufficient={req.currentAmount < req.amount}
                      >
                        <p> {formatNumber(req.amount)}</p>
                      </MaterialAmount>
                    </MaterialInfo>
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
  width: 275px;
  min-width: 275x;
  max-width: 275px;
  background: #1a1a1a;
  border: 2px solid #333;
  border-radius: 8px;
  margin-top: 16px;
  overflow-y: auto;
`;

const CraftingCounter = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: #2a2a2a;
  padding: 4px 10px;
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

const MultiplierDisplay = styled.div`
  display: flex;
  align-items: center;
  color: #ff9800;
  font-size: 12px;
  font-weight: bold;
  font-family: "Courier New", monospace;
  background: #2a2a2a;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #444;
`;

const Content = styled.div`
  padding: 16px;
`;

const Section = styled.div`
  margin-bottom: 8px;
`;

const SpaceshipGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
`;

const SpaceshipCard = styled.div<{ selected: boolean }>`
  position: relative;
  padding: 6px;
  border: 1px solid ${(props) => (props.selected ? "#4CAF50" : "#333")};
  border-radius: 4px;
  cursor: pointer;
  background: ${(props) => (props.selected ? "#2a4a2a" : "#222")};
  transition: all 0.2s;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CornerStat = styled.div<{
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}>`
  position: absolute;
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  font-weight: bold;
  z-index: 2;

  ${(props) => props.top && "top: 4px;"}
  ${(props) => props.bottom && "bottom: 4px;"}
  ${(props) => props.left && "left: 4px;"}
  ${(props) => props.right && "right: 4px;"}
`;

const BackgroundSprite = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;

  pointer-events: none;
`;

const SpaceshipContainer = styled.div<{ size: number }>`
  position: relative;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  display: inline-block;
`;

const SpaceshipSpriteImage = styled.div<{
  size: number;
  src: string;
  biomeIndex: number;
  isLegendary: boolean;
  isMythic: boolean;
}>`
  image-rendering: crisp-edges;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  display: inline-block;
  vertical-align: middle;
  background-image: url(${({ src }) => src});
  background-size: auto 100%;
  background-repeat: no-repeat;
  background-position: ${({ biomeIndex, size }) => {
    // For smaller display sizes, we need to adjust the offset
    // The sprite sheet has 64px sprites, but we might be displaying at 32px
    const spriteWidth = 64; // Original sprite width in the sheet
    const scaleFactor = size / spriteWidth; // How much we're scaling down
    const adjustedOffset = biomeIndex * spriteWidth * scaleFactor;
    const position = `-${adjustedOffset}px 0`;
    return position;
  }};
  filter: ${({ isLegendary, isMythic }) => {
    if (isMythic) {
      // For mythic spaceships, we'll use the MythicSpaceshipSprite component instead
      return "none";
    }
    if (isLegendary) {
      // Legendary effects: color inversion like in viewport
      return "invert(1)";
    }
    return "none";
  }};
`;

const SpaceshipShineOverlay = styled.div<{
  size: number;
  isLegendary: boolean;
  isMythic: boolean;
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  pointer-events: none;
  overflow: hidden;
  z-index: 2;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      45deg,
      transparent 0%,
      transparent 40%,
      rgba(255, 255, 255, 0.8) 50%,
      rgba(255, 255, 255, 0.8) 55%,
      transparent 60%,
      transparent 100%
    );
    transform: translateX(-100%);
    animation: shine 3s ease-in-out infinite;
  }

  @keyframes shine {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  /* Legendary and Mythic special effects */
  ${({ isLegendary }) =>
    isLegendary &&
    css`
      &::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(
          circle at center,
          rgba(255, 215, 0, 0.3) 0%,
          transparent 70%
        );
        animation: legendaryGlow 2s ease-in-out infinite alternate;
      }

      @keyframes legendaryGlow {
        from {
          opacity: 0.3;
        }
        to {
          opacity: 0.7;
        }
      }
    `}

  ${({ isMythic }) =>
    isMythic &&
    css`
      &::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(
          circle at center,
          rgba(138, 43, 226, 0.4) 0%,
          transparent 70%
        );
        animation: mythicGlow 1.5s ease-in-out infinite alternate;
      }

      @keyframes mythicGlow {
        from {
          opacity: 0.4;
        }
        to {
          opacity: 0.8;
        }
      }
    `}
`;

const MaterialList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
`;

const MaterialItem = styled.div<{ insufficient: boolean }>`
  display: flex;
  align-items: center;
  padding: 4px 6px;
  background: ${(props) => (props.insufficient ? "#4a2a2a" : "#2a2a2a")};
  border-radius: 6px;
  border-left: 3px solid
    ${(props) => (props.insufficient ? "#ff6b6b" : "#4caf50")};
  transition: all 0.2s ease;
  flex: 1;
  min-width: 0;
  position: relative;

  &:hover {
    background: ${(props) => (props.insufficient ? "#5a3a3a" : "#3a3a3a")};
  }
`;

const MaterialIcon = styled.div`
  font-size: 16px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  cursor: help;
`;

const MaterialInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

const MaterialAmount = styled.span<{ insufficient: boolean }>`
  font-family: "Courier New", monospace;
  font-size: 14px;
  color: ${(props) => (props.insufficient ? "#ff6b6b" : "#4caf50")};
  font-weight: 500;
`;

const CraftButton = styled.button`
  width: 100%;
  padding: 0px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;

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
