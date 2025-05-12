import type { Artifact } from "@df/types";
import { ArtifactRarity, ArtifactType, Biome } from "@df/types";
import { Card, CardContent } from "@frontend/Gallery/Components/ui/card";
import {
  artifactBiomeFromName,
  artifactRarityFromName,
  artifactTypeFromName,
  hexToDecimal,
} from "@frontend/Gallery/Utils/gallery-Utils";

import { ArtifactImageMarket } from "./ArtifactImageMarket";
import { MarketLink } from "./GalleryArtModal";

export function parseFormattedArtifact(artifact: {
  type: string;
  rarity: string;
  biome: string;
  id: string;
  [key: string]: unknown;
}) {
  return {
    ...artifact,
    artifactType:
      (artifactTypeFromName(artifact.type) as ArtifactType) ??
      ArtifactType.Unknown,
    artifactRarity: artifact.rarity,
    rarity:
      (artifactRarityFromName(artifact.rarity) as ArtifactRarity) ??
      ArtifactRarity.Unknown,
    planetBiome:
      (artifactBiomeFromName(artifact.biome) as Biome) ?? Biome.UNKNOWN,
  };
}

export function GalleryCardModal({
  artifact,
  onClick,
}: {
  artifact: Artifact;
  onClick: () => void;
}) {
  const DFArtifactFormat = parseFormattedArtifact(artifact);

  return (
    <Card
      className="flex transform cursor-pointer flex-col items-center justify-between rounded transition-transform duration-300 hover:z-10 hover:scale-110"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center rounded">
        <div className="relative h-full w-full">
          {/* Main background artifact image */}
          <img
            src={artifact.image}
            alt={artifact.name}
            className="h-full w-full rounded object-contain"
            onError={(e) => (e.currentTarget.src = "./icons/broadcast.svg")}
          />

          <div className="absolute left-1/2 top-1/2 scale-150 rounded">
            <ArtifactImageMarket
              artifact={DFArtifactFormat as unknown as Artifact}
              size={128}
            />
          </div>
        </div>

        {/* TEXT OVER IMAGE */}
        <div className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 translate-y-1/4 text-center">
          <h2 className="text-sm font-bold text-white drop-shadow-md">
            {hexToDecimal(artifact.name.slice(10))}
          </h2>
          <p className="text-xs text-gray-400">
            Owner: {artifact.owner.slice(0, 6)}...{artifact.owner.slice(-4)}
          </p>

          <div className="flex items-center justify-center text-center">
            <MarketLink
              href={`https://opensea.io/item/base/0x14a11b17105cc70f154f84ede21e9b08dd832577/${hexToDecimal(artifact.name.slice(10))}`}
              imgSrc="https://opensea.io/static/images/logos/opensea-logo.svg"
            />
            <MarketLink
              href={`https://rarible.com/token/base/0x14a11b17105cc70f154f84ede21e9b08dd832577:${hexToDecimal(artifact.name.slice(10))}`}
              imgSrc="../public/img/markets/rarible.png"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
