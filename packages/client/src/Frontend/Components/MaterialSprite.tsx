import React from "react";
import styled from "styled-components";

import type { MaterialType } from "@df/types";

const MaterialSpriteContainer = styled.img<{
  size: number;
}>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  display: inline-block;
  vertical-align: middle;
  image-rendering: crisp-edges;
  object-fit: contain;
`;

interface MaterialSpriteProps {
  materialId: MaterialType;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Map material IDs to their corresponding image filenames
const getMaterialImagePath = (materialId: MaterialType): string => {
  const materialImages: Record<MaterialType, string> = {
    0: "/img/404-text.png",
    1: "/img/Materials/1 Water.png",
    2: "/img/Materials/2 wood.png",
    3: "/img/Materials/3 Windsteel.png",
    4: "/img/Materials/4 Auroruim.png",
    5: "/img/Materials/5 Mycelium Gel.png",
    6: "/img/Materials/6 Sandglass.png",
    7: "/img/Materials/7 Icestone.png",
    8: "/img/Materials/8 Scrapium.png",
    9: "/img/Materials/9 Pyrosteel.png",
    10: "/img/Materials/10 Blackalloy.png",
    11: "/img/Materials/11 Crystall.png",
  };

  return materialImages[materialId] || "/img/Materials/1 Water.png";
};

export function MaterialSprite({
  materialId,
  size = 64, // Doubled from 64 to 128 (twice as big: 64 * 2 = 128)
  className,
  style,
}: MaterialSpriteProps) {
  const imagePath = getMaterialImagePath(materialId);

  return (
    <MaterialSpriteContainer
      src={imagePath}
      alt={`Material ${materialId}`}
      size={size}
      className={className}
      style={style}
      onError={(e) => {
        console.error(`Failed to load material image: ${imagePath}`, e);
      }}
    />
  );
}
