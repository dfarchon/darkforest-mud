import { ArtifactFilters } from "@frontend/Components/filters/ArtifactFilters";
import { ArtifactRarityLabelAnim } from "@frontend/Components/Labels/ArtifactLabels";
import { Card, CardContent } from "@frontend/Components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@frontend/Components/ui/tabs";
import {
  artifactRarityFromName,
  artifactTypeFromName,
  formatArtifacts,
  getSpriteImageStyle,
  hexToDecimal,
} from "@frontend/Utils/gallery-Utils";
import {
  fetchArtifacts,
  fetchOwnedArtifacts,
} from "@frontend/Utils/galleryApi";
import { getMarketplaceContract } from "@frontend/Utils/marketplaceConfig";
import { useMUD } from "@mud/MUDContext";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";

import { entityToAddress } from "./GamePage";

export function ArtifactsGallery() {
  const { isConnected, address, chain } = useAccount();
  const ARTIFACT_URL = "/df_ares_artifact_icons/";

  const {
    network: { playerEntity },
  } = useMUD();

  const [tab, setTab] = useState("owned");
  const [artifacts, setArtifacts] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const DFARTAddress = getMarketplaceContract(chain?.id);

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
    if (!DFARTAddress) return;
    loadArtifacts();
  }, [tab, DFARTAddress, walletClient]);

  async function loadArtifacts() {
    if (tab === "all") {
      setArtifacts([]);
      const artifactsList = await fetchArtifacts(DFARTAddress);
      if (artifactsList) {
        setArtifacts(formatArtifacts(artifactsList));
      }
    } else if (tab === "owned" && walletClient) {
      setArtifacts([]);
      const ownedArtifacts = await fetchOwnedArtifacts(
        DFARTAddress,
        walletClient?.account.address.toLocaleLowerCase(),
      );
      if (ownedArtifacts) {
        setArtifacts(formatArtifacts(ownedArtifacts));
      }
    }
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

  function MarketLink({ href, imgSrc }: { href: string; imgSrc: string }) {
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

  const numberOfHolders = uniqueOwners.size;

  return (
    <div className="p-1">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex-1 text-center text-3xl font-bold">
          DF MUD Artifacts Gallery
        </h1>
        <div className="ml-4 flex">
          <MarketLink
            href="https://opensea.io/collection/dfartifact"
            imgSrc="https://opensea.io/static/images/logos/opensea-logo.svg"
          />
          <MarketLink
            href="https://rarible.com/collection/base/0x14a11b17105cc70f154f84ede21e9b08dd832577/items"
            imgSrc="../public/img/markets/rarible.png"
          />
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
          {/* If are no artifacts */}
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
              {/* Gallery from cards */}
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
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
      {/* Modal detail on click */}
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

              {/* Overlay bigger sprite with color border */}
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

            <div className="absolute bottom-1/4 left-1/2 w-full -translate-x-1/2 translate-y-1/2 text-center">
              <ArtifactRarityLabelAnim
                rarity={artifactRarityFromName(selectedArtifact.rarity)}
              ></ArtifactRarityLabelAnim>
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
              <MarketLink
                href={`https://opensea.io/item/base/0x14a11b17105cc70f154f84ede21e9b08dd832577/${hexToDecimal(selectedArtifact.name.slice(10))}`}
                imgSrc="https://opensea.io/static/images/logos/opensea-logo.svg"
              />
              <MarketLink
                href={`https://rarible.com/token/base/0x14a11b17105cc70f154f84ede21e9b08dd832577:${hexToDecimal(selectedArtifact.name.slice(10))}`}
                imgSrc="../public/img/markets/rarible.png"
              />
            </div>
            {/* Navigation Arrows inside opened Modal */}
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
