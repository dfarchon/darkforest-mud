import { Card, CardContent } from "@frontend/Components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@frontend/Components/ui/tabs";
import {
  buyArtifact,
  fetchArtifacts,
  fetchOnSaleArtifacts,
  fetchOwnedArtifacts,
} from "@frontend/Utils/marketplaceApi";
import { getMarketplaceContract } from "@frontend/Utils/marketplaceConfig";
import { useMUD } from "@mud/MUDContext";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import {
  useAccount,
  useDisconnect,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { ArtifactRarity, ArtifactType, Biome } from "@df/types";
import { entityToAddress } from "./GamePage";
import { ArtifactFilters } from "@frontend/Components/filters/ArtifactFilters";
import { SpriteRenderer, WebGLManager } from "@df/renderer";

import dfstyles from "@frontend/Styles/dfstyles";
import styled, { css } from "styled-components";

import { MythicLabelText } from "../Components/Labels/MythicLabel";

export function ArtifactsGallery() {
  const { isConnected, address, chain } = useAccount();
  const ARTIFACT_URL = "/df_ares_artifact_icons/";

  const {
    network: {
      walletClient: burnerWalletClient,
      playerEntity,
      waitForTransaction,
    },
    components: { Player, BurnerToPlayer },
  } = useMUD();

  const [tab, setTab] = useState("owned");
  const [artifacts, setArtifacts] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ownerAccount, setOwnerAccount] = useState<[]>([]);

  const { data: walletClient } = useWalletClient();

  const [filters, setFilters] = useState({
    biome: "",
    type: "",
    rarity: "",
  });

  // Get the address of the burner wallet from playerEntity
  const burnerWalletAddress = entityToAddress(playerEntity);
  if (!burnerWalletAddress) {
    console.error("No burner wallet address available");
    return;
  }

  const handlePrevArtifact = () => {
    const currentIndex = artifacts.findIndex(
      (a) => a.id === selectedArtifact.id,
    );
    const prevIndex = (currentIndex - 1 + artifacts.length) % artifacts.length;
    setSelectedArtifact(artifacts[prevIndex]);
  };

  const handleNextArtifact = () => {
    const currentIndex = artifacts.findIndex(
      (a) => a.id === selectedArtifact.id,
    );
    const nextIndex = (currentIndex + 1) % artifacts.length;
    setSelectedArtifact(artifacts[nextIndex]);
  };

  const marketplaceAddress = getMarketplaceContract(chain?.id);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isModalOpen) return;
      if (e.key === "ArrowLeft") {
        handlePrevArtifact();
      } else if (e.key === "ArrowRight") {
        handleNextArtifact();
      } else if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, selectedArtifact, artifacts]);

  useEffect(() => {
    if (!marketplaceAddress) return;
    loadArtifacts();
  }, [tab, marketplaceAddress, walletClient]);

  async function loadArtifacts() {
    if (tab === "all") {
      setArtifacts([]);
      const artifactsList = await fetchArtifacts(marketplaceAddress);

      setArtifacts(formatArtifacts(artifactsList));
    } else if (tab === "owned" && walletClient) {
      setArtifacts([]);
      const ownedArtifacts = await fetchOwnedArtifacts(
        marketplaceAddress,
        walletClient?.account.address.toLocaleLowerCase(),
      );
      if (ownedArtifacts) {
        setArtifacts(formatArtifacts(ownedArtifacts));
      }
    } else if (tab === "onSale") {
      setArtifacts([]);
      const soldArtifacts = await fetchOnSaleArtifacts(marketplaceAddress);
      setArtifacts(formatArtifacts(soldArtifacts));
    }
  }
  function formatArtifacts(rawArtifacts) {
    if (!rawArtifacts) return [];

    return rawArtifacts.map((artifact) => {
      let extractedText = ["", "", ""];
      if (artifact.metadata?.image?.startsWith("data:image/svg+xml;base64,")) {
        const base64Image = artifact.metadata.image;
        const svgContent = decodeSVGBase64(base64Image);
        if (svgContent) {
          extractedText = extractLastThreeLinesFromSVG(svgContent);
        }
      }

      return {
        id: artifact.tokenId || artifact.id,
        name: artifact.metadata?.name || `Artifact #${artifact.tokenId}`,
        description: artifact.metadata?.description || "Mystery Artifact",
        image: artifact.metadata?.image || "./icons/broadcast.svg",
        owner: artifact.owner || "",
        type: extractedText[0] || "",
        rarity: extractedText[1] || "",
        biome: extractedText[2] || "",
      };
    });
  }
  function decodeSVGBase64(base64String: string) {
    try {
      const base64Data = base64String.split(",")[1]; // skip "data:image/svg+xml;base64,"
      const decoded = atob(base64Data); // decode base64
      return decoded; // this is now the real SVG XML
    } catch (error) {
      console.error("Failed to decode base64 SVG", error);
      return null;
    }
  }

  // function extractTextFromSVG(svgString: string) {
  //   try {
  //     const parser = new DOMParser();
  //     const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
  //     const texts = svgDoc.querySelectorAll("text");
  //     return Array.from(texts)
  //       .map((textElement) => textElement.textContent)
  //       .join("\n");
  //   } catch (error) {
  //     console.error("Failed to extract text from SVG", error);
  //     return null;
  //   }
  // }

  function extractLastThreeLinesFromSVG(svgString: string) {
    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
      const texts = svgDoc.querySelectorAll("text");
      const allLines = Array.from(texts).map(
        (textElement) => textElement.textContent || "",
      );

      // ⚡ Take the LAST 3 lines
      const lastThree = allLines.slice(-3);

      return lastThree;
    } catch (error) {
      console.error("Failed to extract text from SVG", error);
      return [];
    }
  }

  const ArtifactTypeNames = {
    [ArtifactType.Unknown]: "Unknown",
    [ArtifactType.Monolith]: "Monolith",
    [ArtifactType.Colossus]: "Colossus",
    [ArtifactType.Spaceship]: "Spaceship",
    [ArtifactType.Pyramid]: "Pyramid",
    [ArtifactType.Wormhole]: "Wormhole",
    [ArtifactType.PlanetaryShield]: "Planetary Shield",
    [ArtifactType.BlackDomain]: "Black Domain",
    [ArtifactType.PhotoidCannon]: "Photoid Cannon",
    [ArtifactType.BloomFilter]: "Bloom Filter",
    [ArtifactType.IceLink]: "Ice Link",
    [ArtifactType.FireLink]: "Fire Link",
    [ArtifactType.Kardashev]: "Kardashev",
    [ArtifactType.Bomb]: "Pink Bomb",
    [ArtifactType.StellarShield]: "Stellar Shield",
    [ArtifactType.BlindBox]: "Blind Box",
    [ArtifactType.Avatar]: "Avatar",
    [ArtifactType.ShipMothership]: "Mothership",
    [ArtifactType.ShipCrescent]: "Crescent",
    [ArtifactType.ShipWhale]: "Whale",
    [ArtifactType.ShipGear]: "Gear",
    [ArtifactType.ShipTitan]: "Titan",
    [ArtifactType.ShipPink]: "Pinkship",
  } as const;

  const RarityColors = {
    [ArtifactRarity.Unknown]: "#000000",
    [ArtifactRarity.Common]: dfstyles.colors.subtext,
    [ArtifactRarity.Rare]: "#6b68ff",
    [ArtifactRarity.Epic]: "#c13cff",
    [ArtifactRarity.Legendary]: "#f8b73e",
    [ArtifactRarity.Mythic]: "#ff44b7",
  } as const;

  function artifactTypeFromName(name: string): ArtifactType | undefined {
    for (const [key, value] of Object.entries(ArtifactTypeNames)) {
      if (value === name) {
        return Number(key) as ArtifactType;
      }
    }
    return undefined; // not found
  }
  //ArtifactRarityNames
  const ArtifactRarityNames = {
    [ArtifactRarity.Unknown]: "Unknown",
    [ArtifactRarity.Common]: "COMMON",
    [ArtifactRarity.Rare]: "RARE",
    [ArtifactRarity.Epic]: "EPIC",
    [ArtifactRarity.Legendary]: "LEGENDARY",
    [ArtifactRarity.Mythic]: "MYTHIC",
  } as const;

  function artifactRarityFromName(name: string): ArtifactRarity | undefined {
    for (const [key, value] of Object.entries(ArtifactRarityNames)) {
      if (value === name) {
        return Number(key) as ArtifactRarity;
      }
    }
    return ArtifactRarity.Unknown; // not found
  }

  // const BiomeBackgroundColors = {
  //   [Biome.UNKNOWN]: "#000000",
  //   [Biome.OCEAN]: "#000e2d",
  //   [Biome.FOREST]: "#06251d",
  //   [Biome.GRASSLAND]: "#212617",
  //   [Biome.TUNDRA]: "#260f17",
  //   [Biome.SWAMP]: "#211b0e",
  //   [Biome.DESERT]: "#302e0e",
  //   [Biome.ICE]: "#0d212f",
  //   [Biome.WASTELAND]: "#321b1b",
  //   [Biome.LAVA]: "#321000",
  //   [Biome.CORRUPTED]: "#15260D",
  // } as const;

  // const BiomeNames = {
  //   [Biome.UNKNOWN]: "Unknown",
  //   [Biome.OCEAN]: "OCEAN",
  //   [Biome.FOREST]: "FOREST",
  //   [Biome.GRASSLAND]: "GRASSLAND",
  //   [Biome.TUNDRA]: "TUNDRA",
  //   [Biome.SWAMP]: "SWAMP",
  //   [Biome.DESERT]: "DESERT",
  //   [Biome.ICE]: "ICE",
  //   [Biome.WASTELAND]: "WASTELAND",
  //   [Biome.LAVA]: "LAVA",
  //   [Biome.CORRUPTED]: "CORRUPTED",
  // } as const;

  // function artifactBiomeFromName(name: string): Biome | undefined {
  //   for (const [key, value] of Object.entries(BiomeNames)) {
  //     if (value === name) {
  //       return Number(key) as Biome;
  //     }
  //   }
  //   return Biome.UNKNOWN; // not found
  // }

  function getSpriteImageStyle(selectedArtifact) {
    const rarity = artifactRarityFromName(selectedArtifact.rarity);

    const totalDuration = 3; // seconds
    const totalFrames = totalDuration * 60;
    const now = performance.now() / 1000;
    const nowFrame = Math.floor((now % totalDuration) * 60);
    const shineValue = nowFrame / totalFrames; // [0,1]

    const brightness = rarity >= ArtifactRarity.Rare ? 1 + 1.5 * shineValue : 1;
    const invert = rarity === ArtifactRarity.Legendary ? 1 : 0;

    const baseFilter = `brightness(${brightness}) invert(${invert})`;

    let boxShadow;
    if (rarity === ArtifactRarity.Mythic) {
      boxShadow = `0 0 40px 10px ${RarityColors[ArtifactRarity.Mythic]}`; // Mythic pink glow
    } else if (rarity === ArtifactRarity.Legendary) {
      boxShadow = "0 0 20px 4px rgb(65, 40, 207)"; // Legendary gold glow inverted
    } else if (rarity === ArtifactRarity.Epic) {
      boxShadow = "0 0 20px 4px rgb(104, 13, 209)"; // Epic violet glow
    } else if (rarity === ArtifactRarity.Rare) {
      boxShadow = "0 0 20px 4px rgb(65, 40, 207)"; // Rare Blue glow
    } else {
      boxShadow = undefined;
    }

    return {
      objectFit: "contain",
      filter: baseFilter,
      transition: "filter 0.1s linear",
      boxShadow, // dynamic glow here
    };
  }

  const options = {
    biomes: Array.from(new Set(artifacts.map((a) => a.biome))).filter(Boolean),
    types: Array.from(new Set(artifacts.map((a) => a.type))).filter(Boolean),
    rarities: Array.from(new Set(artifacts.map((a) => a.rarity))).filter(
      Boolean,
    ),
  };

  const filteredArtifacts = artifacts.filter((a) => {
    return (
      (filters.biome ? a.biome === filters.biome : true) &&
      (filters.type ? a.type === filters.type : true) &&
      (filters.rarity ? a.rarity === filters.rarity : true)
    );
  });

  const uniqueOwners = new Set(
    filteredArtifacts.map((artifact) => artifact.owner.toLowerCase()),
  );

  const numberOfHolders = uniqueOwners.size;

  function hexToDecimal(hexString: string): number {
    return parseInt(hexString, 16);
  }

  return (
    <div className="p-1">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex-1 text-center text-3xl font-bold">
          DF MUD Artifacts Gallery
        </h1>
        <div className="ml-4 flex">
          <a
            href="https://opensea.io/collection/dfartifact"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded p-2 transition-colors hover:bg-gray-800"
          >
            <img
              src="https://opensea.io/static/images/logos/opensea-logo.svg"
              alt="OpenSea"
              className="h-6 w-6"
            />
          </a>
          <a
            href="https://rarible.com/collection/base/0x14a11b17105cc70f154f84ede21e9b08dd832577/items"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded p-2 transition-colors hover:bg-gray-800"
          >
            <img
              src="../public/img/markets/rarible.png"
              alt="OpenSea"
              className="h-6 w-6"
            />
          </a>

          <ConnectButton />
        </div>
      </div>
      <Tabs
        defaultValue="all"
        value={tab}
        onValueChange={setTab}
        className="w-full"
      >
        <TabsList className="mx-auto mb-6 grid w-1/3 grid-cols-3 gap-2 text-center">
          <TabsTrigger
            value="owned"
            className="border-muted border-2 border-[#808080] data-[state=active]:bg-black"
          >
            Owned
          </TabsTrigger>
          {/* <TabsTrigger
            value="onSale"
            className="border-muted border-2 border-black data-[state=active]:bg-black"
          >
            OnSale
          </TabsTrigger> */}
          <TabsTrigger
            value="all"
            className="border-muted border-2 border-[#808080] data-[state=active]:bg-black"
          >
            All
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value={tab}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8"
        >
          {artifacts.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">
              No Artifacts Found Searching ...
            </div>
          ) : (
            <>
              <div className="col-span-full mb-4 grid grid-cols-3 items-center text-sm text-gray-400">
                {/* Left spacer */}
                <div></div>

                {/* Center: Total Artifacts */}
                <div className="text-center">
                  Total Artifacts: {filteredArtifacts.length} | Unique Holders:{" "}
                  {numberOfHolders}
                </div>

                {/* Right side: Filters */}
                <div className="flex justify-end gap-4">
                  <ArtifactFilters
                    filters={filters}
                    setFilters={setFilters}
                    options={options}
                  />
                </div>
              </div>

              {filteredArtifacts.map((artifact) => (
                <Card
                  key={artifact.id}
                  className="flex transform cursor-pointer flex-col items-center justify-between rounded transition-transform duration-300 hover:scale-110"
                >
                  <CardContent className="flex flex-col items-center rounded">
                    <div
                      className="relative h-full w-full"
                      onClick={() => {
                        setSelectedArtifact(artifact);
                        setIsModalOpen(true);
                      }}
                    >
                      {/* Main background artifact image */}
                      <img
                        src={artifact.image}
                        alt={artifact.name}
                        className="h-full w-full rounded object-contain shadow-md"
                        onError={(e) =>
                          (e.currentTarget.src = "./icons/broadcast.svg")
                        }
                      />

                      {/* Overlay small sprite with color border */}
                      <img
                        src={`${ARTIFACT_URL}/${artifactTypeFromName(artifact.type)}.png`}
                        alt={artifact.name}
                        width={50}
                        height={50}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded"
                        style={getSpriteImageStyle(artifact)}
                        onError={(e) =>
                          (e.currentTarget.src = "./icons/broadcast.svg")
                        }
                      />
                    </div>

                    {/* TEXT OVER IMAGE */}
                    <div className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 translate-y-1/4 text-center">
                      <h2 className="text-sm font-bold text-white drop-shadow-md">
                        {hexToDecimal(artifact.name.slice(10))}
                      </h2>
                      <p className="text-xs text-gray-400">
                        Owner: {artifact.owner.slice(0, 6)}...
                        {artifact.owner.slice(-4)}
                      </p>

                      {/* <div>
                        {tab === "all" && isConnected && (
                          <DF-Button
                            onClick={() =>
                              buyArtifact(marketplaceAddress, artifact.id)
                            }
                            className="mt-2 w-full cursor-pointer"
                          >
                            Buy
                          </DF-Button>
                        )}
                        {tab === "all" && !isConnected && (
                          <p className="mt-2 text-sm text-red-500">
                            Connect Wallet to Buy
                          </p>
                        )}
                      </div> */}
                      <div className="flex items-center justify-center text-center">
                        <a
                          href={`https://opensea.io/item/base/0x14a11b17105cc70f154f84ede21e9b08dd832577/${hexToDecimal(artifact.name.slice(10))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center rounded p-2 transition-colors hover:bg-gray-800"
                        >
                          <img
                            src="https://opensea.io/static/images/logos/opensea-logo.svg"
                            alt="OpenSea"
                            className="h-5 w-5"
                          />
                        </a>
                        <a
                          href={`https://rarible.com/token/base/0x14a11b17105cc70f154f84ede21e9b08dd832577:${hexToDecimal(artifact.name.slice(10))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center rounded p-2 transition-colors hover:bg-gray-800"
                        >
                          <img
                            src="../public/img/markets/rarible.png"
                            alt="OpenSea"
                            className="h-5 w-5"
                          />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>

      {isModalOpen && selectedArtifact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md rounded-lg bg-black p-6 shadow-lg">
            {/* Close Button */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{selectedArtifact.name}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            {/* Artifact Image */}
            <div className="relative h-full w-full">
              {/* Main background artifact image */}
              <img
                src={selectedArtifact.image}
                alt={selectedArtifact.name}
                className="h-full w-full rounded object-contain shadow-md"
                onError={(e) => (e.currentTarget.src = "./icons/broadcast.svg")}
              />

              {/* Overlay small sprite with color border */}
              <img
                src={`${ARTIFACT_URL}/${artifactTypeFromName(selectedArtifact.type)}.png`}
                alt={selectedArtifact.name}
                width={128}
                height={128}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded"
                style={getSpriteImageStyle(selectedArtifact)}
                onError={(e) => (e.currentTarget.src = "./icons/broadcast.svg")}
              />
            </div>

            {/* Artifact Description */}
            <div className="absolute bottom-1/4 left-1/2 w-full -translate-x-1/2 translate-y-1/2 text-center">
              <h2 className="text-sm font-bold text-white drop-shadow-md">
                {hexToDecimal(selectedArtifact.name.slice(10))}
              </h2>
              <p className="text-gray-700">{selectedArtifact.description}</p>
              <p className="text-sm text-gray-500">
                Owner: {selectedArtifact.owner.slice(0, 6)}...
                {selectedArtifact.owner.slice(-4)}
              </p>
            </div>

            <div className="flex items-center justify-center text-center">
              <a
                href={`https://opensea.io/item/base/0x14a11b17105cc70f154f84ede21e9b08dd832577/${hexToDecimal(selectedArtifact.name.slice(10))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded p-2 transition-colors hover:bg-gray-800"
              >
                <img
                  src="https://opensea.io/static/images/logos/opensea-logo.svg"
                  alt="OpenSea"
                  className="h-5 w-5"
                />
              </a>
              <a
                href={`https://rarible.com/token/base/0x14a11b17105cc70f154f84ede21e9b08dd832577:${hexToDecimal(selectedArtifact.name.slice(10))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded p-2 transition-colors hover:bg-gray-800"
              >
                <img
                  src="../public/img/markets/rarible.png"
                  alt="OpenSea"
                  className="h-5 w-5"
                />
              </a>
            </div>
            {/* Navigation Arrows */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 transform">
              <button
                onClick={handlePrevArtifact}
                className="p-2 text-white hover:text-gray-300"
              >
                &#8592;
              </button>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 transform">
              <button
                onClick={handleNextArtifact}
                className="p-2 text-white hover:text-gray-300"
              >
                &#8594;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
