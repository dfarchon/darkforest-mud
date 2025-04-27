import { ArtifactRarity, ArtifactType, Biome } from "@df/types";
import { RarityColors } from "@frontend/Styles/Colors";
// helper function to convert hex value to decimal number
export function hexToDecimal(hexString: string): number {
  return parseInt(hexString, 16);
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

// extract last 3 values from ERC721 json text
export function extractLastThreeLinesFromSVG(svgString: string) {
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
// helper function - main format for Artifact state for gallery page
export function formatArtifacts(rawArtifacts) {
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

// helper function to decode json base64 code ERC721 image
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

// Sprite for artifact img
export function getSpriteImageStyle(selectedArtifact) {
  const rarity = artifactRarityFromName(selectedArtifact.rarity);

  // const totalDuration = 3; // seconds
  // const totalFrames = totalDuration * 60;
  // const now = performance.now() / 1000;
  // const nowFrame = Math.floor((now % totalDuration) * 60);
  // const shineValue = nowFrame / totalFrames; // [0,1]

  // const brightness = rarity >= ArtifactRarity.Rare ? 1 + 1.5 * shineValue : 1;
  const invert = rarity === ArtifactRarity.Legendary ? 1 : 0;
  //brightness(${brightness})
  let baseFilter = `brightness(1) invert(${invert})`;

  let boxShadow;
  if (rarity === ArtifactRarity.Mythic) {
    boxShadow = `0 0 30px 15px rgb(238, 40, 211), inset 0 0 20px 10px  rgb(238, 40, 211)`; // Mythic pink glow ${RarityColors[ArtifactRarity.Mythic]}
    baseFilter = `brightness(3) invert(${invert})`;
  } else if (rarity === ArtifactRarity.Legendary) {
    boxShadow = `0 0 30px 15px ${RarityColors[ArtifactRarity.Rare]}, inset 0 0 20px 10px ${RarityColors[ArtifactRarity.Rare]}`; // Legendary gold glow inverted
    baseFilter = `brightness(1) invert(${invert})`;
  } else if (rarity === ArtifactRarity.Epic) {
    boxShadow = `0 0 20px 4px ${RarityColors[ArtifactRarity.Epic]}, inset 0 0 20px 10px ${RarityColors[ArtifactRarity.Epic]}`; // Epic violet glow RarityColors rgb(104, 13, 209)
    baseFilter = `brightness(1) invert(${invert})`;
  } else if (rarity === ArtifactRarity.Rare) {
    boxShadow = `0 0 20px 4px ${RarityColors[ArtifactRarity.Rare]}, inset 0 0 20px 10px ${RarityColors[ArtifactRarity.Rare]}`; // Rare Blue glow
    baseFilter = `brightness(0.9) invert(${invert})`;
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
// Special Art type conversion -* Bomb -> Pink Bomb against original @DF-types
const ArtifactTypeNamesMarket = {
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
// helper function to decode type from string
export function artifactTypeFromName(name: string): ArtifactType | undefined {
  for (const [key, value] of Object.entries(ArtifactTypeNamesMarket)) {
    if (value === name) {
      return Number(key) as ArtifactType;
    }
  }
  return ArtifactType.Unknown; // not found
}
// Special Art rarity conversion -* BIG leters against original @DF-types
const ArtifactRarityNamesMarket = {
  [ArtifactRarity.Unknown]: "Unknown",
  [ArtifactRarity.Common]: "COMMON",
  [ArtifactRarity.Rare]: "RARE",
  [ArtifactRarity.Epic]: "EPIC",
  [ArtifactRarity.Legendary]: "LEGENDARY",
  [ArtifactRarity.Mythic]: "MYTHIC",
} as const;
// helper function to decode rarity from string
export function artifactRarityFromName(
  name: string,
): ArtifactRarity | undefined {
  for (const [key, value] of Object.entries(ArtifactRarityNamesMarket)) {
    if (value === name) {
      return Number(key) as ArtifactRarity;
    }
  }
  return ArtifactRarity.Unknown; // not found
}

// preparation for Biome not included yet
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
