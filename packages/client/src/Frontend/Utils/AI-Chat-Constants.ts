export const AI_BOOK_TEXT = {
  DecentralizedGame: `
Dark Forest: The Decentralized Game Experiment
Dark Forest is a pioneering decentralized MMORTS game utilizing zero-knowledge proofs. It exemplifies decentralization, giving players autonomy over game assets and enabling developer-driven ecosystem growth.

Notable Highlights:
- First-Mover Advantage: Dark Forest holds a strong reputation in the Ethereum community with over 500+ players during beta rounds.
- Community-Driven: A vibrant community contributes plugins, experimental projects, and ecosystem tools like Nightmarket and ARTEMIS.
- Blockchain Innovation: It showcases zk-SNARKs for privacy and EVM smart contracts for transparency and asset ownership.

Proposed Community Rounds:
1. Strengthen the community ecosystem.
2. Test innovative game mechanics.
3. Develop blockchain infrastructure via community-driven contributions.

Technological Focus:
- Zero-knowledge proofs and decentralized collaboration.
- Blockchain economic models and infrastructure.
- Generative AI applications in gaming.

The decentralized gaming experiment must continue!
  `,
  ExploreForgotten: `
Dark Forest: Explore the Forgotten
Dark Forest is a real-time strategy game blending exploration, cryptography, and decentralized mechanics.

Gameplay Overview:
- Players control planets, expanding their empires within a fog-covered universe inspired by the "Dark Forest Theory."
- A balance of strategy and risk emphasizes exploration and hidden threats.

Technological Marvels:
1. EVM and Smart Contracts: Decentralized game logic with true asset ownership.
2. Zero-Knowledge Proofs: Enhance gameplay privacy and strategic depth.
3. Lazy Updates: Off-chain computations optimize scalability.

Community and Open Source:
- The game empowers developers with open-source tools and frameworks, fostering innovation.
- Upcoming plans include migrating to the MUD framework for easier integration and development.

Dark Forest stands as a beacon of decentralized gaming innovation, teaching players strategic and technological insights.
  `,
};

export const AI_BOT_CHARACTER = {
  chatPrompt: `
Context:
- You are Sophon, an AI assistant in the Dark Forest universe.
- You possess deep knowledge of science, philosophy, and Dark Forest RTS strategy.
- Created by 9STX6 for the DF Archon Community, DF Archon support events and development on the MUD framework.
- Your guidance is poetic, strategic, and exploratory while avoiding hidden mechanics or spoilers.

Rules:
- Be concise, logical, and engaging.
- Use thematic expressions inspired by space and exploration.
- Provide strategic insights and encourage curiosity.
- Do not write plugins or code.

Conversation so far:
{chat_history}

GameConfig details:
{gameConfig}

Books Text:
{customText}

User {user}: {input}

Sophon:
  `,
};
// TODO add default stats for Space objects
export const AIChatGameConfig = `
{
  "PlanetStatus": ["DEFAULT", "DESTROYED"],
  "PlanetType": {
    "PLANET": "Generates energy, upgradable object.",
    "ASTEROID_FIELD": "Generates energy and silver, not upgradable object.",
    "FOUNDRY": "Generates energy, Prospects and discovers artifacts, not upgradable object.",
    "SPACETIME_RIP": "Generates energy, Stakes/unstakes artifacts, burns silver for score, not upgradable object.",
    "QUASAR": "Longest range, no energy or silver generation, not upgradable object."
  },
  "SpaceType": {
    "NEBULA": "Forests, Grasslands, Oceans. Max planet level: 4, max upgrades: 3.",
    "SPACE": "Deserts, Swamps, Tundras. Max planet level: 5, max upgrades: 4.",
    "DEEP_SPACE": "Ice, Lava, Wastelands. Max planet level: 9, max upgrades: 5.",
    "DEAD_SPACE": "Corrupted biomes only. Max planet level: 9, max upgrades: 5."
  },
  "Biome": [
    "OCEAN", "FOREST", "GRASSLAND", "TUNDRA",
    "SWAMP", "DESERT", "ICE", "WASTELAND",
    "LAVA", "CORRUPTED"
  ],
  "ArtifactStatus": ["DEFAULT", "COOLDOWN", "CHARGING", "READY", "ACTIVE", "BROKEN"],
  "ArtifactGenre": ["DEFENSIVE", "OFFENSIVE", "PRODUCTIVE", "GENERAL"],
  "ArtifactRarity": ["COMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"],
  "PlanetBoost": {
    "MULTIPLY_DEFENSE": "Doubles defense stats.",
    "MULTIPLY_RANGE": "Increases movement range.",
    "MULTIPLY_SPEED": "Increases movement speed.",
    "MULTIPLY_POPULATION_GROWTH": "Speeds up recharge (excluding Quasar).",
    "MULTIPLY_SILVER_GROWTH": "Boosts silver production (Asteroids only)."
  },
  "GameRadius": 150000,
  "PlanetLevel": {
    "ZERO": 0, "ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4,
    "FIVE": 5, "SIX": 6, "SEVEN": 7, "EIGHT": 8, "NINE": 9
  },
  "ArtifactTypeNames": {
    "Monolith": "Monolith", "Colossus": "Colossus", "Spaceship": "Spaceship",
    "Pyramid": "Pyramid", "Wormhole": "Wormhole", "PlanetaryShield": "Planetary Shield",
    "BlackDomain": "Black Domain", "PhotoidCannon": "Photoid Cannon",
    "BloomFilter": "Bloom Filter", "IceLink": "Ice Link", "FireLink": "Fire Link",
    "Kardashev": "Kardashev", "Bomb": "Bomb", "StellarShield": "Stellar Shield",
    "BlindBox": "Blind Box", "Avatar": "Avatar",
    "ShipMothership": "Mothership", "ShipCrescent": "Crescent",
    "ShipWhale": "Whale", "ShipGear": "Gear", "ShipTitan": "Titan", "ShipPink": "Pinkship"
  },
  "HotKeys": {
    "n": "Toggle terminal.",
    "m": "Toggle screen panes.",
    ",": "Toggle hotkey pane.",
    "g": "Access planet and spaceship shop.",
    "p": "Toggle wallet pane.",
    "h": "Open help pane.",
    "j": "Access settings pane.",
    "k": "Open plugins pane.",
    "l": "View artifacts pane.",
    ";": "Access planets pane.",
    "'": "Open transactions pane.",
    "i": "Diagnostics pane."
  },
  "ContractFunctions": {
    "pause": "Pause the game contract.",
    "unpause": "Unpause the game contract.",
    "updateTickRate": "Adjust game tick rate.",
    "move": "Move a player or unit.",
    "legacyMove": "Legacy move function.",
    "revealLocation": "Reveal a planets location.",
    "legacyRevealLocation": "Legacy reveal location function.",
    "upgradePlanet": "Upgrade a planets level.",
    "legacyUpgradePlanet": "Legacy planet upgrade function.",
    "setPlanetEmoji": "Assign a custom emoji to a planet.",
    "withdrawSilver": "Withdraw silver from a planet.",
    "initializePlayer": "Initialize a new player.",
    "createPlanet": "Create a new planet.",
    "revealPlanetByAdmin": "Admin action: reveal planet location.",
    "safeSetOwner": "Safely assign a planets owner."
  },
  "UIHints": {
  "Move": "Click on a source planet, then "q" or button "Send" and select a destination to initiate movement. Ensure sufficient energy for the journey.",
  "SelectPlanet": "Click on a planet to view its details, including energy, silver, and level. Use this to plan upgrades or actions as Broadcast planet , Set Emoji, etc.",
  "ActivateArtifacts": "Choose an artifact from your inventory and click 'Activate' to use its abilities. Ensure cooldowns are complete before activation."
  }
}
`;
