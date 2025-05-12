import { ArtifactFilters } from "@frontend/Gallery/Components/filters/ArtifactFilters";
import {
  GalleryArtModal,
  MarketLink,
} from "@frontend/Gallery/Components/GalleryArtModal";
import { GalleryCardModal } from "@frontend/Gallery/Components/GalleryCardModal";
import { MythicLabelText } from "@frontend/Components/Labels/MythicLabel";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@frontend/Gallery/Components/ui/tabs";
import { formatArtifacts } from "@frontend/Gallery/Utils/gallery-Utils";
import {
  fetchArtifacts,
  fetchOwnedArtifacts,
} from "@frontend/Gallery/Utils/galleryApi";
import { getMarketplaceContract } from "@frontend/Gallery/Utils/marketplaceConfig";
import { useMUD } from "@mud/MUDContext";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useRef, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";

import { entityToAddress } from "../../Pages/GamePage";

export function ArtifactsGallery() {
  const { isConnected, address, chain } = useAccount();
  const {
    network: { playerEntity },
  } = useMUD();

  const [tab, setTab] = useState("owned");
  const [artifacts, setArtifacts] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const ITEMS_PER_PAGE = 16;
  const [currentPage, setCurrentPage] = useState(0);
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
  // Handle arrows left and right in modal
  const handlePrevArtifact = () => {
    const currentIndex = filteredArtifacts.findIndex(
      (a) => a.id === selectedArtifact.id,
    );
    const prevIndex =
      (currentIndex - 1 + filteredArtifacts.length) % filteredArtifacts.length;
    setSelectedArtifact(filteredArtifacts[prevIndex]);
  };

  const handleNextArtifact = () => {
    const currentIndex = filteredArtifacts.findIndex(
      (a) => a.id === selectedArtifact.id,
    );
    const nextIndex = (currentIndex + 1) % filteredArtifacts.length;
    setSelectedArtifact(filteredArtifacts[nextIndex]);
  };
  // Read gallery contract per connected chain
  const DFARTAddress = getMarketplaceContract(chain?.id);

  // Default load artifacts call
  useEffect(() => {
    if (!DFARTAddress) return;
    loadArtifacts();
  }, [tab, DFARTAddress, walletClient]);
  // main function to set page state about artifacts owned or all
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
  useEffect(() => {
    setCurrentPage(0);
  }, [filters]);
  // Filters - prepare options list from all possible text content from contract
  const options = {
    biomes: Array.from(new Set(artifacts.map((a) => a.biome))).filter(Boolean),
    types: Array.from(new Set(artifacts.map((a) => a.type))).filter(Boolean),
    rarities: Array.from(new Set(artifacts.map((a) => a.rarity))).filter(
      Boolean,
    ),
  };
  // Apply page filters from selected biomes , types , rarities
  const filteredArtifacts = artifacts.filter((a) => {
    return (
      (filters.biome ? a.biome === filters.biome : true) &&
      (filters.type ? a.type === filters.type : true) &&
      (filters.rarity ? a.rarity === filters.rarity : true)
    );
  });
  // count unique Owners for filtred artifacts
  const uniqueOwners = new Set(
    filteredArtifacts.map((artifact) => artifact.owner.toLowerCase()),
  );
  const numberOfHolders = uniqueOwners.size;
  const paginatedArtifacts = filteredArtifacts.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE,
  );
  return (
    <div className="p-1">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex-1 text-center text-3xl font-bold">
          <MythicLabelText
            text={`DF MUD Artifacts Gallery`}
            style={{
              fontFamily: "'Start Press 2P', sans-serif",
            }}
          />
        </h1>
        <div className="ml-4 flex">
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
            //  IF ARE ARTIFACTS THEN SHOW GALLERY
            <>
              <div className="col-span-full mb-4 grid grid-cols-3 items-center text-sm text-gray-400">
                {/* Left spacer */}
                <div>
                  {" "}
                  Total Artifacts: {filteredArtifacts.length} | Unique Holders:{" "}
                  {numberOfHolders}
                </div>

                {/* Center: Total Artifacts */}
                <div className="text-center">
                  <ArtifactFilters
                    filters={filters}
                    setFilters={setFilters}
                    options={options}
                  />
                </div>
                {/* Right side: Filters */}
                <div className="flex justify-end">
                  {" "}
                  <MarketLink
                    href="https://opensea.io/collection/dfartifact"
                    imgSrc="https://opensea.io/static/images/logos/opensea-logo.svg"
                  />
                  <MarketLink
                    href="https://rarible.com/collection/base/0x14a11b17105cc70f154f84ede21e9b08dd832577/items"
                    imgSrc="../public/img/markets/rarible.png"
                  />
                </div>
                <div className="col-span-full my-4 flex justify-center gap-4">
                  <button
                    className="rounded bg-gray-700 px-4 py-1 text-white disabled:opacity-40"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                    disabled={currentPage === 0}
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-gray-400">
                    Page {currentPage + 1} of{" "}
                    {Math.ceil(filteredArtifacts.length / ITEMS_PER_PAGE)}
                  </span>
                  <button
                    className="rounded bg-gray-700 px-4 py-1 text-white disabled:opacity-40"
                    onClick={() =>
                      setCurrentPage((p) =>
                        p + 1 <
                        Math.ceil(filteredArtifacts.length / ITEMS_PER_PAGE)
                          ? p + 1
                          : p,
                      )
                    }
                    disabled={
                      currentPage + 1 >=
                      Math.ceil(filteredArtifacts.length / ITEMS_PER_PAGE)
                    }
                  >
                    Next →
                  </button>
                </div>
              </div>
              {/* Gallery from cards */}
              {paginatedArtifacts.map((artifact) => (
                <GalleryCardModal
                  key={artifact.id}
                  artifact={artifact}
                  onClick={() => {
                    setSelectedArtifact(artifact);
                    setIsModalOpen(true);
                  }}
                />
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
      {/* Modal detail on click */}
      {isModalOpen && selectedArtifact && (
        <GalleryArtModal
          artifact={selectedArtifact}
          onClose={() => setIsModalOpen(false)}
          onPrev={handlePrevArtifact}
          onNext={handleNextArtifact}
        />
      )}
    </div>
  );
}
