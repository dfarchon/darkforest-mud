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
import { ArtifactCanvas } from "@frontend/Components/ui/ArtifactCanvas";
export default function ArtifactMarketplace() {
  const { isConnected, address, chain } = useAccount();

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
  console.log(filteredArtifacts);
  return (
    <div className="p-1">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex-1 text-center text-3xl font-bold">
          DF MUD Artifact Marketplace
        </h1>
        <div className="ml-4">
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
            className="border-muted border-2 border-black data-[state=active]:bg-black"
          >
            Owned
          </TabsTrigger>
          <TabsTrigger
            value="onSale"
            className="border-muted border-2 border-black data-[state=active]:bg-black"
          >
            OnSale
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="border-muted border-2 border-black data-[state=active]:bg-black"
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
                  onClick={() => {
                    setSelectedArtifact(artifact);
                    setIsModalOpen(true);
                  }}
                >
                  <CardContent className="flex flex-col items-center rounded">
                    <img
                      src={artifact.image}
                      alt={artifact.name}
                      className="h-full w-full rounded object-contain shadow-md"
                      onError={(e) =>
                        (e.currentTarget.src = "./icons/broadcast.svg")
                      }
                    />

                    {/* <ArtifactCanvas
                      type={artifact.type}
                      biome={artifact.biome}
                      rarity={artifact.rarity}
                    /> */}
                    {/* TEXT OVER IMAGE */}
                    <div className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 text-center">
                      <h2 className="text-sm font-bold text-white drop-shadow-md">
                        {artifact.name.slice(10)}
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
            <img
              src={selectedArtifact.image}
              alt={selectedArtifact.name}
              className="h-64 w-full rounded object-contain"
              onError={(e) => (e.currentTarget.src = "./icons/broadcast.svg")}
            />

            {/* Artifact Description */}
            <p className="text-gray-700">{selectedArtifact.description}</p>
            <p className="text-sm text-gray-500">
              Owner: {selectedArtifact.owner.slice(0, 6)}...
              {selectedArtifact.owner.slice(-4)}
            </p>

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
