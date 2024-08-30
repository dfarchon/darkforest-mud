import { isAncient } from "@df/gamelogic";
import {
  isAvatar,
  isLogo,
  isMeme,
  numToAvatarType,
  numToLogoType,
  numToMemeType,
} from "@df/procedural";
import {
  Artifact,
  ArtifactRarity,
  ArtifactRarityNames,
  ArtifactType,
  ArtifactTypeNames,
  AvatarTypeNames,
  BiomeNames,
  LogoType,
  LogoTypeNames,
  MemeTypeNames,
} from "@df/types";
import React from "react";
import styled from "styled-components";
import { RarityColors } from "../../Styles/Colors";
import { LegendaryLabel } from "./LegendaryLabel";
import { MythicLabel } from "./MythicLabel";

export const ArtifactRarityText = ({ rarity }: { rarity: ArtifactRarity }) => (
  <>{ArtifactRarityNames[rarity]}</>
);

export const ArtifactBiomeText = ({ artifact }: { artifact: Artifact }) => (
  <>{isAncient(artifact) ? "Ancient" : BiomeNames[artifact.planetBiome]}</>
);

export const ArtifactTypeText = ({ artifact }: { artifact: Artifact }) => {
  const imageType = artifact.imageType;
  let content = "";

  if (isMeme(imageType)) content = MemeTypeNames[numToMemeType(imageType)];
  else if (isLogo(imageType)) content = LogoTypeNames[numToLogoType(imageType)];
  else if (isAvatar(imageType))
    content = AvatarTypeNames[numToAvatarType(imageType)];
  else content = LogoTypeNames[LogoType.DFARES];

  // console.log(imageType);
  // console.log(isAvatar(imageType));
  // console.log(content);

  return (
    <>
      {ArtifactTypeNames[artifact.artifactType]}
      {artifact.artifactType === ArtifactType.Avatar && ":" + content}
    </>
  );
};

// colored labels

export const StyledArtifactRarityLabel = styled.span<{
  rarity: ArtifactRarity;
}>`
  color: ${({ rarity }) => RarityColors[rarity]};
`;

export const ArtifactRarityLabel = ({ rarity }: { rarity: ArtifactRarity }) => (
  <StyledArtifactRarityLabel rarity={rarity}>
    <ArtifactRarityText rarity={rarity} />
  </StyledArtifactRarityLabel>
);

export const ArtifactRarityLabelAnim = ({
  rarity,
}: {
  rarity: ArtifactRarity;
}) =>
  rarity === ArtifactRarity.Mythic ? (
    <MythicLabel />
  ) : rarity === ArtifactRarity.Legendary ? (
    <LegendaryLabel />
  ) : (
    <ArtifactRarityLabel rarity={rarity} />
  );

// combined labels

export const ArtifactRarityBiomeTypeText = ({
  artifact,
}: {
  artifact: Artifact;
}) => (
  <>
    <ArtifactRarityText rarity={artifact.rarity} />{" "}
    <ArtifactBiomeText artifact={artifact} />{" "}
    <ArtifactTypeText artifact={artifact} />
  </>
);
