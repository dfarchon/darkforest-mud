import { Card, CardContent } from "@frontend/Components/ui/card";
import {
  artifactTypeFromName,
  getSpriteImageStyle,
  hexToDecimal,
} from "@frontend/Utils/gallery-Utils";

import { MarketLink } from "./GalleryArtModal";

const ARTIFACT_URL = "/df_ares_artifact_icons/";

export function GalleryCardModal({
  artifact,
  onClick,
}: {
  artifact: never;
  onClick: () => void;
}) {
  return (
    <Card
      className="flex transform cursor-pointer flex-col items-center justify-between rounded transition-transform duration-300 hover:scale-110"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center rounded">
        <div className="relative h-full w-full">
          {/* Main background artifact image */}
          <img
            src={artifact.image}
            alt={artifact.name}
            className="h-full w-full rounded object-contain shadow-md"
            onError={(e) => (e.currentTarget.src = "./icons/broadcast.svg")}
          />

          {/* Overlay small sprite with color border */}
          <img
            src={`${ARTIFACT_URL}/${artifactTypeFromName(artifact.type)}.png`}
            alt={artifact.name}
            width={50}
            height={50}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded"
            style={getSpriteImageStyle(artifact)}
            onError={(e) => (e.currentTarget.src = "./icons/broadcast.svg")}
          />
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
