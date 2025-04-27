import { ArtifactRarityLabelAnim } from "@frontend/Components/Labels/ArtifactLabels";
import {
  artifactRarityFromName,
  artifactTypeFromName,
  getSpriteImageStyle,
  hexToDecimal,
} from "@frontend/Utils/gallery-Utils";
import { useEffect, useRef } from "react";

const ARTIFACT_URL = "/df_ares_artifact_icons/";
export function MarketLink({ href, imgSrc }: { href: string; imgSrc: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center rounded p-2 hover:bg-gray-800"
    >
      <img src={imgSrc} alt="Market" className="h-5 w-5" />
    </a>
  );
}

export function GalleryArtModal({ artifact, onClose, onPrev, onNext }) {
  const overlayRef = useRef(null);
  // Helper function to create market links

  useEffect(() => {
    function handleClickOutside(event) {
      if (overlayRef.current && event.target === overlayRef.current) {
        onClose();
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    }
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, onPrev, onNext]);

  if (!artifact) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div className="relative w-full max-w-md rounded-lg bg-black p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{artifact.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <div className="relative h-full w-full">
          <img
            src={artifact.image}
            alt={artifact.name}
            className="h-full w-full rounded object-contain shadow-md"
            onError={(e) => (e.currentTarget.src = "./icons/broadcast.svg")}
          />
          <img
            src={`${ARTIFACT_URL}/${artifactTypeFromName(artifact.type)}.png`}
            alt={artifact.name}
            width={128}
            height={128}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded"
            style={getSpriteImageStyle(artifact)}
            onError={(e) => (e.currentTarget.src = "./icons/broadcast.svg")}
          />
        </div>

        <div className="absolute bottom-1/4 left-1/2 w-full -translate-x-1/2 translate-y-1/2 text-center">
          <ArtifactRarityLabelAnim
            rarity={artifactRarityFromName(artifact.rarity)}
          />
          <h2 className="text-sm font-bold text-white drop-shadow-md">
            {hexToDecimal(artifact.name.slice(10))}
          </h2>
          <p className="text-gray-700">{artifact.description}</p>
          <p className="text-sm text-gray-500">
            Owner: {artifact.owner.slice(0, 6)}...{artifact.owner.slice(-4)}
          </p>
        </div>

        <div className="flex -translate-y-1/2 items-center justify-center text-center">
          <MarketLink
            href={`https://opensea.io/item/base/0x14a11b17105cc70f154f84ede21e9b08dd832577/${hexToDecimal(artifact.name.slice(10))}`}
            imgSrc="https://opensea.io/static/images/logos/opensea-logo.svg"
          />
          <MarketLink
            href={`https://rarible.com/token/base/0x14a11b17105cc70f154f84ede21e9b08dd832577:${hexToDecimal(artifact.name.slice(10))}`}
            imgSrc="../public/img/markets/rarible.png"
          />
        </div>

        <div className="text-4xl font-bold text-white">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 transform">
            <button
              onClick={onPrev}
              className="p-2 text-white hover:text-gray-300"
            >
              &#8592;
            </button>{" "}
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 transform">
            <button onClick={onNext} className="p-2 hover:text-gray-300">
              &#8594;
            </button>{" "}
          </div>
        </div>
      </div>
    </div>
  );
}
