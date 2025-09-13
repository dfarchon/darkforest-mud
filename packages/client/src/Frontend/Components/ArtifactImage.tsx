import { ArtifactFileColor } from "@df/gamelogic";
import { artifactFileName } from "@df/gamelogic";
import type { Artifact } from "@df/types";
import { ArtifactType, Biome, SpaceshipType } from "@df/types";
import styled, { css } from "styled-components";

import { useCraftedSpaceshipByArtifact } from "../../hooks/useCraftedSpaceship";
import dfstyles from "../Styles/dfstyles";

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
  thumb = false,
  bgColor = ArtifactFileColor.APP_BACKGROUND,
}: {
  artifact: Artifact;
  size: number;
  thumb?: boolean;
  bgColor?: ArtifactFileColor;
}) {
  // Get spaceship data from CraftedSpaceship MUD table
  const spaceshipData = useCraftedSpaceshipByArtifact(artifact);
  let spaceshipType = spaceshipData?.spaceshipType;

  // Debug: Check if hook is working correctly

  // Fallback: If no CraftedSpaceship data exists, use default spaceship type
  if (artifact.artifactType === ArtifactType.Spaceship && !spaceshipType) {
    spaceshipType = SpaceshipType.Scout; // Default to Scout
  }

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

  const clampedBiomeIndex = getBiomeIndex(artifact.planetBiome);

  const isCustomSpaceship =
    artifact.artifactType === ArtifactType.Spaceship && spaceshipType;

  // Handle custom spaceship sprites for ArtifactType.Spaceship (type 3)
  const getImageSrc = () => {
    if (isCustomSpaceship) {
      const spaceshipSpriteUrl = SPACESHIP_SPRITES[spaceshipType];
      if (spaceshipSpriteUrl) {
        return spaceshipSpriteUrl;
      }
    }
    // Fallback to default artifact sprite
    return ARTIFACT_URL + artifact.artifactType + ".png";
  };

  return (
    <Container width={size} height={size}>
      {isCustomSpaceship ? (
        <SpaceshipSprite
          width={size}
          height={size}
          src={getImageSrc()}
          biomeIndex={clampedBiomeIndex}
        />
      ) : (
        <img
          width={size}
          height={size}
          src={getImageSrc()}
          alt={`Artifact ${artifact.artifactType}`}
        />
      )}
    </Container>
  );
}

const Container = styled.div`
  image-rendering: crisp-edges;

  ${({ width, height }: { width: number; height: number }) => css`
    width: ${width}px;
    height: ${height}px;
    min-width: ${width}px;
    min-height: ${height}px;
    background-color: ${dfstyles.colors.artifactBackground};
    display: inline-block;
    text-align: center;
    vertical-align: middle;
  `}
`;

const SpaceshipSprite = styled.div<{
  biomeIndex: number;
  width: number;
  height: number;
  src: string;
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
