import { ArtifactFileColor } from "@df/gamelogic";
import type { Artifact } from "@df/types";
import { ArtifactRarity, ArtifactType, Biome, SpaceshipType } from "@df/types";
import { useEffect, useRef } from "react";
import styled, { css } from "styled-components";

import { useCraftedSpaceshipByArtifact } from "../../hooks/useCraftedSpaceship";

// export const ARTIFACT_URL = 'https://d2wspbczt15cqu.cloudfront.net/v0.6.0-artifacts/';
export const ARTIFACT_URL = "/df_ares_artifact_icons/";

// Custom spaceship sprite URLs
const SPACESHIP_SPRITES = {
  [SpaceshipType.Scout]: "/sprites/Scouts.png",
  [SpaceshipType.Fighter]: "/sprites/Fighters.png",
  [SpaceshipType.Destroyer]: "/sprites/Destroyers.png",
  [SpaceshipType.Carrier]: "/sprites/Cruisers.png", // Using Cruisers.png for Carrier
} as const;

// function getArtifactUrl(
//   thumb: boolean,
//   artifact: Artifact,
//   color: ArtifactFileColor,
// ): string {
//   const fileName = artifactFileName(true, thumb, artifact, color);
//   return ARTIFACT_URL + fileName;
// }

export function ArtifactImage({
  artifact,
  size,
  thumb: _thumb = false,
  bgColor: _bgColor = ArtifactFileColor.APP_BACKGROUND,
}: {
  artifact: Artifact;
  size: number;
  thumb?: boolean;
  bgColor?: ArtifactFileColor;
}) {
  // Get spaceship data from CraftedSpaceship MUD table
  const spaceshipData = useCraftedSpaceshipByArtifact(artifact);
  let spaceshipType = spaceshipData?.spaceshipType;

  // Fallback: If no CraftedSpaceship data exists, use default spaceship type
  if (artifact.artifactType === ArtifactType.Spaceship && !spaceshipType) {
    spaceshipType = SpaceshipType.Scout; // Default to Scout
  }

  // Determine if artifact should have shine effect (same logic as viewport)
  const hasShine = artifact.rarity >= ArtifactRarity.Rare;
  const isLegendary = artifact.rarity === ArtifactRarity.Legendary;
  const isMythic = artifact.rarity === ArtifactRarity.Mythic;

  // Use the same biome source as 3D viewport: artifact.planetBiome
  // Convert Biome enum to index (0-9) to match 3D viewport behavior
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
    return biomeMap[biome] ?? 0; // Default to Ocean if biome not found
  };

  const clampedBiomeIndex = getBiomeIndex(artifact.planetBiome ?? Biome.OCEAN);

  const isCustomSpaceship =
    artifact.artifactType === ArtifactType.Spaceship && !!spaceshipType;

  // Handle custom spaceship sprites for ArtifactType.Spaceship (type 3)
  const getImageSrc = () => {
    if (isCustomSpaceship) {
      const spaceshipSpriteUrl = SPACESHIP_SPRITES[spaceshipType!];
      if (spaceshipSpriteUrl) {
        return spaceshipSpriteUrl;
      }
    }
    // Fallback to default artifact sprite
    return ARTIFACT_URL + artifact.artifactType + ".png";
  };

  const renderSprite = () => {
    if (isCustomSpaceship) {
      if (isMythic) {
        return (
          <MythicSpaceshipSprite
            width={size}
            height={size}
            src={getImageSrc()}
            biomeIndex={clampedBiomeIndex}
            isLegendary={isLegendary}
          />
        );
      }
      return (
        <SpaceshipSprite
          width={size}
          height={size}
          src={getImageSrc()}
          biomeIndex={clampedBiomeIndex}
          isLegendary={isLegendary}
          isMythic={isMythic}
        />
      );
    }

    if (isMythic) {
      return (
        <MythicArtifactSprite
          width={size}
          height={size}
          src={getImageSrc()}
          alt={`Artifact ${artifact.artifactType}`}
          isLegendary={isLegendary}
        />
      );
    }

    if (isLegendary) {
      return (
        <LegendaryArtifactSprite
          width={size}
          height={size}
          src={getImageSrc()}
          alt={`Artifact ${artifact.artifactType}`}
        />
      );
    }

    return (
      <ArtifactSprite
        width={size}
        height={size}
        src={getImageSrc()}
        alt={`Artifact ${artifact.artifactType}`}
        isLegendary={isLegendary}
        isMythic={isMythic}
      />
    );
  };

  return (
    <Container width={size} height={size}>
      {renderSprite()}
      <RarityColorOverlay rarity={artifact.rarity} />
      {hasShine && (
        <ShineOverlay
          size={size}
          isLegendary={isLegendary}
          isMythic={isMythic}
        />
      )}
    </Container>
  );
}

const Container = styled.div`
  image-rendering: crisp-edges;
  position: relative;

  ${({ width, height }: { width: number; height: number }) => css`
    width: ${width}px;
    height: ${height}px;
    min-width: ${width}px;
    min-height: ${height}px;
    display: inline-block;
    text-align: center;
    vertical-align: middle;
  `}
`;

const RarityColorOverlay = styled.div<{ rarity: ArtifactRarity }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  mix-blend-mode: overlay;
  opacity: 0.6;
  z-index: 1;
`;

const ShineOverlay = styled.div<{
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

// Component for mythic artifacts with pixel manipulation effects
function MythicArtifactSprite({
  src,
  alt,
  width,
  height,
  isLegendary,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  isLegendary: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Apply legendary color inversion if needed
    if (isLegendary) {
      ctx.filter = "invert(1)";
    }

    // Draw the original image
    ctx.drawImage(image, 0, 0, width, height);

    // Apply mythic pixel manipulation effects
    const imageData = ctx.getImageData(0, 0, width, height);
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
  }, [width, height, isLegendary]);

  return (
    <>
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        style={{ display: "none" }}
        onLoad={() => {
          // Trigger canvas redraw when image loads
          const canvas = canvasRef.current;
          const image = imageRef.current;
          if (!canvas || !image) return;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          canvas.width = width;
          canvas.height = height;

          if (isLegendary) {
            ctx.filter = "invert(1)";
          }

          ctx.drawImage(image, 0, 0, width, height);

          const imageData = ctx.getImageData(0, 0, width, height);
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
        width={width}
        height={height}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          imageRendering: "crisp-edges",
        }}
      />
    </>
  );
}

// Component for legendary artifacts with canvas-based color inversion
function LegendaryArtifactSprite({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Apply legendary color inversion
    ctx.filter = "invert(1)";

    // Draw the image
    ctx.drawImage(image, 0, 0, width, height);
  }, [width, height]);

  return (
    <>
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        style={{ display: "none" }}
        onLoad={() => {
          // Trigger canvas redraw when image loads
          const canvas = canvasRef.current;
          const image = imageRef.current;
          if (!canvas || !image) return;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          canvas.width = width;
          canvas.height = height;

          // Apply legendary color inversion
          // ctx.filter = "invert(1)";

          ctx.drawImage(image, 0, 0, width, height);
        }}
      />
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          imageRendering: "crisp-edges",
        }}
      />
    </>
  );
}

const ArtifactSprite = styled.img<{
  isLegendary: boolean;
  isMythic: boolean;
}>`
  filter: ${({ isLegendary, isMythic }) => {
    if (isMythic) {
      // For mythic artifacts, we'll use the MythicArtifactSprite component instead
      return "none";
    }
    if (isLegendary) {
      // For legendary artifacts, we'll use the LegendaryArtifactSprite component instead
      return "none";
    }
    return "none";
  }};
`;

// Component for mythic spaceships with pixel manipulation effects
function MythicSpaceshipSprite({
  src,
  biomeIndex,
  width,
  height,
  isLegendary,
}: {
  src: string;
  biomeIndex: number;
  width: number;
  height: number;
  isLegendary: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Calculate sprite position (same logic as SpaceshipSprite)
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
      width,
      height,
    );

    // Apply mythic pixel manipulation effects
    const imageData = ctx.getImageData(0, 0, width, height);
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
  }, [width, height, biomeIndex, isLegendary]);

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

          canvas.width = width;
          canvas.height = height;

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
            width,
            height,
          );

          const imageData = ctx.getImageData(0, 0, width, height);
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
        width={width}
        height={height}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          imageRendering: "crisp-edges",
        }}
      />
    </>
  );
}

const SpaceshipSprite = styled.div<{
  biomeIndex: number;
  width: number;
  height: number;
  src: string;
  isLegendary: boolean;
  isMythic: boolean;
}>`
  image-rendering: crisp-edges;
  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
  display: inline-block;
  vertical-align: middle;
  background-image: url(${({ src }) => src});
  background-size: auto 100%;
  background-repeat: no-repeat;
  background-position: ${({ biomeIndex, width }) => {
    // For smaller display sizes, we need to adjust the offset
    // The sprite sheet has 64px sprites, but we might be displaying at 32px
    const spriteWidth = 64; // Original sprite width in the sheet
    const scaleFactor = width / spriteWidth; // How much we're scaling down
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

// const ArtifactImg = styled.div`
//   background-position: -10px -10px;
//   background-repeat: no-repeat;

//   ${({ url, width, height }: { url: string; width: number; height: number }) => css`
//     background: transparent url(${url});
//     width: ${width}px;
//     height: ${height}px;
//   `}
// `;

// const ArtifactImg = styled.img`
//   position: absolute;

//   ${({ w, h }: { w: number; h: number }) => css`
//     clip: rect(0, ${w}px, ${h}px, 0);
//     width: 2048px;
//     height: 2048px;
//   `}
// `;
