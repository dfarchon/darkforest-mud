# Spaceships System Documentation

## Overview

Spaceships are a special category of artifacts in Dark Forest MUD that represent player-controlled vessels for exploration, combat, and resource management. Unlike regular artifacts, spaceships are primarily crafted rather than discovered, and they provide unique gameplay mechanics for fleet management and strategic positioning.

## Spaceship Types

### Scout (Type 1)

- **Role**: Reconnaissance and exploration
- **Base Stats**: 0 Attack, 0 Defense, 10 Speed, 5 Range
- **Materials**: Water (50) + Living Wood (50) + Windsteel (100) + Aurorium (50)
- **Purpose**: Fast movement and long-range scouting
- **Special Abilities**: Enhanced movement speed and range

### Fighter (Type 2)

- **Role**: Balanced combat vessel
- **Base Stats**: 5 Attack, 5 Defense, 0 Speed, 5 Range
- **Materials**: Water (100) + Living Wood (100) + Windsteel (200) + Aurorium (100) + Sandglass (100) + Cryostone (150) + Scrapium (100) + Pyrosteel (100)
- **Purpose**: Versatile combat operations
- **Special Abilities**: Balanced offensive and defensive capabilities

### Destroyer (Type 3)

- **Role**: Heavy assault vessel
- **Base Stats**: 10 Attack, 10 Defense, 0 Speed, 0 Range
- **Materials**: Water (300) + Living Wood (300) + Windsteel (400) + Aurorium (300) + Mycelium (300) + Sandglass (500) + Cryostone (500) + Scrapium (500) + Pyrosteel (500) + Blackalloy (200) + Corrupted Crystal (200)
- **Purpose**: Maximum firepower and defense
- **Special Abilities**: Highest attack and defense bonuses

### Carrier (Type 4)

- **Role**: Support and transport vessel
- **Base Stats**: 5 Attack, 15 Defense, 0 Speed, 3 Range
- **Materials**: Water (500) + Living Wood (500) + Windsteel (800) + Aurorium (800) + Mycelium (500) + Sandglass (700) + Cryostone (700) + Scrapium (700) + Pyrosteel (700) + Blackalloy (400) + Corrupted Crystal (400)
- **Purpose**: Defensive operations and resource transport
- **Special Abilities**: Highest defense bonus, moderate range

## Spaceship Crafting System

### Foundry Requirements

- **Planet Type**: Ruins (PlanetType.RUINS)
- **Minimum Level**: Level 4 or higher
- **Ownership**: Must own the foundry planet
- **Crafting Limit**: Maximum 3 spaceships per foundry

### Crafting Process

1. **Material Collection**: Gather required materials on the foundry planet
2. **Selection**: Choose spaceship type and biome
3. **Crafting**: Execute crafting transaction
4. **Generation**: Spaceship is created with calculated stats
5. **Storage**: Spaceship is added to the foundry planet

### Crafting Multiplier System

The cost of crafting increases with each spaceship created:

- **1st Craft**: 100% base cost (1.0x multiplier)
- **2nd Craft**: 150% base cost (1.5x multiplier)
- **3rd Craft**: 225% base cost (2.25x multiplier)

## Stat Calculation System

### Rarity Determination

Spaceship rarity is calculated based on foundry planet level:

- **Level 1**: Common (100% multiplier)
- **Level 2-3**: Rare (120% multiplier)
- **Level 4-5**: Epic (150% multiplier)
- **Level 6-7**: Legendary (200% multiplier)
- **Level 8+**: Mythic (300% multiplier)

### Biome Bonuses

Different biomes provide varying bonuses:

- **Ocean/Forest/Grassland** (Biomes 1-3): +1 bonus
- **Tundra/Swamp/Desert** (Biomes 4-6): +2 bonus
- **Ice/Wasteland/Lava** (Biomes 7-9): +4 bonus
- **Corrupted** (Biome 10): +8 bonus

### Final Stat Calculation

```
Final Stat = (Role Bonus + Biome Bonus) × Rarity Multiplier / 100
```

### Role-Specific Bonuses

Each spaceship type has unique role bonuses:

#### Attack Bonuses

- Scout: 0 (no attack bonus)
- Fighter: 5
- Destroyer: 10
- Carrier: 5

#### Defense Bonuses

- Scout: 0 (no defense bonus)
- Fighter: 5
- Destroyer: 10
- Carrier: 15

#### Speed Bonuses

- Scout: 10 (only type with speed bonus)
- Fighter: 0
- Destroyer: 0
- Carrier: 0

#### Range Bonuses

- Scout: 5
- Fighter: 5
- Destroyer: 0 (no range bonus)
- Carrier: 3

## Visual System

### Sprite Rendering

- Each spaceship type has unique sprite sheets
- Biome-based color variations (10 different biomes)
- Rarity-based visual effects:
  - **Rare+**: Shine animation overlay
  - **Legendary**: Color inversion effect
  - **Mythic**: Pixel manipulation with enhanced colors

### Sprite Files

- Scout: `/sprites/Scouts.png`
- Fighter: `/sprites/Fighters.png`
- Destroyer: `/sprites/Destroyers.png`
- Carrier: `/sprites/Cruisers.png`

### Visual System Implementation

#### Sprite Sheet Structure

- Each sprite sheet contains 10 biome variations (64px sprites)
- Biome index mapping:
  - Ocean (0), Forest (1), Grassland (2), Tundra (3), Swamp (4)
  - Desert (5), Ice (6), Wasteland (7), Lava (8), Corrupted (9)

#### Rarity Visual Effects

##### Common/Rare Spaceships

- Standard sprite rendering with biome color variations
- No special effects applied

##### Rare+ Spaceships

- **Shine Animation**: Animated overlay effect for visual distinction
- Applied to all spaceships with rarity >= Rare

##### Legendary Spaceships

- **Color Inversion**: CSS `invert(1)` filter applied
- Maintains biome color variations while inverting colors
- Applied to Legendary rarity spaceships

##### Mythic Spaceships

- **Pixel Manipulation**: Custom pixel-level color enhancement
- Enhanced color saturation and contrast
- Special `MythicSpaceshipSprite` component for advanced effects
- Applied to Mythic rarity spaceships

#### Component Architecture

##### ArtifactImage.tsx

```typescript
// Custom spaceship sprite URLs
const SPACESHIP_SPRITES = {
  [SpaceshipType.Scout]: "/sprites/Scouts.png",
  [SpaceshipType.Fighter]: "/sprites/Fighters.png",
  [SpaceshipType.Destroyer]: "/sprites/Destroyers.png",
  [SpaceshipType.Carrier]: "/sprites/Cruisers.png",
} as const;

// Biome index calculation
const getBiomeIndex = (biome: Biome): number => {
  const biomeMap = {
    [Biome.OCEAN]: 0,
    [Biome.FOREST]: 1,
    [Biome.GRASSLAND]: 2,
    [Biome.TUNDRA]: 3,
    [Biome.SWAMP]: 4,
    [Biome.DESERT]: 5,
    [Biome.ICE]: 6,
    [Biome.WASTELAND]: 7,
    [Biome.LAVA]: 8,
    [Biome.CORRUPTED]: 9,
  };
  return biomeMap[biome] ?? 0;
};
```

##### PlanetRenderManager.ts

```typescript
// Custom spaceship sprite management
private spaceshipImages: Map<SpaceshipType, HTMLImageElement> = new Map();
private spaceshipSpritesLoaded: boolean = false;

// Sprite loading and caching
private loadSpaceshipSprites(): void {
  // Loads all spaceship sprite sheets
  // Caches images for performance
  // Handles loading errors gracefully
}
```

#### Rendering Pipeline

1. **Sprite Selection**: Choose appropriate sprite sheet based on spaceship type
2. **Biome Mapping**: Calculate biome index for color variation
3. **Rarity Detection**: Determine visual effects based on rarity level
4. **Effect Application**: Apply appropriate visual effects (shine, inversion, pixel manipulation)
5. **Rendering**: Display final sprite with all effects applied

#### Performance Optimizations

- **Sprite Caching**: All spaceship sprites loaded once and cached
- **Lazy Loading**: Sprites loaded only when needed
- **Memory Management**: Proper cleanup of unused sprite resources
- **Efficient Rendering**: Optimized CSS transforms and filters

## Spaceship Management

### Ownership and Control

- Spaceships are owned by the player who crafted them
- Can be controlled by the owner from any planet
- Ownership tracked via NFT system
- Can be transferred between players

### Deployment

- Spaceships can be deployed on any planet
- Only one spaceship can be active per planet
- Deployment requires meeting planet requirements
- Can be recalled and redeployed

### Fleet Composition

- Players can own multiple spaceships
- Different types can be mixed in fleets
- Strategic combinations provide tactical advantages
- Fleet size limited by resource management

## Gameplay Mechanics

### Movement and Exploration

- Scout spaceships excel at long-range exploration
- Speed bonuses reduce travel time
- Range bonuses increase movement distance
- Strategic positioning for resource gathering

### Combat Applications

- Fighter spaceships provide balanced combat capabilities
- Destroyer spaceships offer maximum firepower
- Carrier spaceships provide defensive support
- Fleet composition affects battle outcomes

### Resource Management

- Spaceships consume resources for maintenance
- Different types have different resource requirements
- Efficient fleet management optimizes resource usage
- Strategic deployment maximizes resource gathering

## Technical Implementation

### Smart Contract Integration

- `FoundryCraftingSystem.sol` handles spaceship creation
- MUD component system manages spaceship state
- NFT integration for ownership tracking
- Event system for real-time updates
- **Spaceship Bonus System**: Bonuses applied during movement and combat

### Client-Side Features

- React-based crafting interface
- Real-time stat calculation and preview
- Visual feedback for crafting process
- Inventory management system
- **Dynamic Range Circles**: Visual range indicators update with spaceship bonuses
- **Energy Prediction**: Movement energy calculations include spaceship attack bonuses
- **Planet Stats Display**: Planet card shows modified stats when spaceship is selected

## Client-Side Architecture

### React Components

#### SpaceshipCraftingPane.tsx

- Main crafting interface component
- Handles material validation and cost calculation
- Real-time stat preview with bonus calculations
- Biome selection and spaceship type configuration
- Crafting multiplier display and validation

#### ArtifactImage.tsx

- Custom spaceship sprite rendering
- Biome-based color variations
- Rarity-based visual effects (shine, inversion, pixel manipulation)
- Fallback to default artifact sprites for non-spaceships

#### SpaceshipBonuses.tsx

- Displays spaceship bonus information
- Shows attack, defense, speed, and range bonuses
- Integrates with MUD components for real-time data

### React Hooks

#### useSpaceshipCrafting.ts

```typescript
interface CraftingState {
  isCrafting: boolean;
  error: string | null;
  success: boolean;
}

function useSpaceshipCrafting() {
  const craftSpaceship: (
    params: SpaceshipCraftingParams,
  ) => Promise<{ success: boolean; error?: string }>;
  const craftingState: CraftingState;
  const resetCraftingState: () => void;
}
```

#### useSpaceshipMovement.ts

```typescript
function useSpaceshipMovement() {
  const getEnergyArrivingForMoveWithBonuses: (
    uiManager,
    from,
    to,
    dist,
    energy,
  ) => number;
  const getTimeForMoveWithBonuses: (
    gameManager,
    fromId,
    toId,
    abandoning,
    artifactSending?,
  ) => number;
  const getSpaceshipBonusesForArtifact: (
    artifact: Artifact,
  ) => SpaceshipBonuses | undefined;
}
```

#### useCraftedSpaceship.ts

```typescript
interface CraftedSpaceshipData {
  spaceshipType: number;
  biome: number;
  rarity: number;
  attackBonus: number;
  defenseBonus: number;
  speedBonus: number;
  rangeBonus: number;
  crafter: string;
  craftedAt: bigint;
  nftTokenId: bigint;
}

function useCraftedSpaceshipByArtifact(
  artifact: Artifact,
): CraftedSpaceshipData | undefined;
```

### Utility Functions

#### SpaceshipBonusUtils.ts

```typescript
interface SpaceshipBonuses {
  attackBonus: number;
  defenseBonus: number;
  speedBonus: number;
  rangeBonus: number;
}

function getSpaceshipBonuses(
  artifact: Artifact,
  mudComponents,
): SpaceshipBonuses | undefined;
function applySpaceshipBonuses(
  planet: { speed: number; range: number },
  bonuses: SpaceshipBonuses,
): { speed: number; range: number };
```

### Integration Points

#### GameUIManager.ts

- `getSpaceshipBonusesForMove(planetId)`: Retrieves spaceship bonuses for movement calculations
- Handles both sending artifacts and planet-held artifacts
- Integrates with MUD components for real-time bonus data

#### GameManager.ts

- `craftSpaceship()`: Main crafting transaction handler
- Validates foundry requirements and material availability
- Handles transaction fees and delegation

#### PlanetRenderManager.ts

- Custom spaceship sprite management
- Biome-based sprite variations
- Rarity-based visual effects
- Sprite sheet loading and caching

### Data Storage

- Spaceship properties stored in MUD tables
- CraftedSpaceship table: Type, biome, rarity, timestamps
- SpaceshipBonus table: Attack, defense, speed, range bonuses
- FoundryCraftingCount table: Crafting limits and multipliers

## MUD Component System

### Core Tables

#### CraftedSpaceship Table

```solidity
CraftedSpaceship: {
  schema: {
    artifactId: "uint32",
    spaceshipType: "uint8",
    biome: "Biome",
    rarity: "ArtifactRarity",
    craftedAt: "uint64",
    nftTokenId: "uint256",
    crafter: "address",
  },
  key: ["artifactId"],
}
```

#### SpaceshipBonus Table

```solidity
SpaceshipBonus: {
  schema: {
    artifactId: "uint32",
    attackBonus: "uint16",
    defenseBonus: "uint16",
    speedBonus: "uint16",
    rangeBonus: "uint16",
  },
  key: ["artifactId"],
}
```

#### FoundryCraftingCount Table

```solidity
FoundryCraftingCount: {
  schema: {
    foundryHash: "bytes32",
    count: "uint8",
    lastCraftTime: "uint64",
  },
  key: ["foundryHash"],
}
```

### Component Relationships

- **CraftedSpaceship** stores basic spaceship metadata (type, biome, rarity, timestamps)
- **SpaceshipBonus** stores calculated stat bonuses for each spaceship
- **FoundryCraftingCount** tracks crafting limits and multipliers per foundry
- All tables are linked via `artifactId` or `foundryHash` keys

### Spaceship Bonus Application

#### Movement System Integration

- **Range Bonuses**: Applied to planet range for movement validation
- **Speed Bonuses**: Applied to travel time calculations
- **Attack Bonuses**: Applied to energy arriving calculations for combat
- **Client-Side Validation**: Energy prediction includes spaceship bonuses
- **Contract-Side Validation**: Range validation uses bonus-enhanced range

#### Visual System Integration

- **Range Circles**: Viewport range indicators dynamically adjust with spaceship range bonuses
- **Planet Stats**: Planet card displays modified speed and range when spaceship is selected
- **Energy Display**: Movement energy predictions show spaceship attack bonuses

## Balance and Strategy

### Resource Economics

- Material costs scale with crafting multiplier
- Strategic planning required for efficient resource use
- Early crafting provides cost advantages
- Late-game crafting offers higher rarity potential

### Tactical Considerations

- Scout-heavy fleets for exploration
- Fighter-balanced fleets for versatility
- Destroyer-focused fleets for combat
- Carrier-supported fleets for defense

### Risk vs Reward

- Higher level foundries produce better spaceships
- Crafting multiplier increases costs over time
- Rarity system provides exponential power scaling
- Strategic timing of crafts optimizes efficiency

## Future Enhancements

### Planned Features

- Spaceship upgrades and modifications
- Fleet formation and coordination
- Spaceship-to-spaceship combat
- Advanced crafting recipes
- Spaceship trading marketplace

### Technical Improvements

- Enhanced visual effects and animations
- Improved UI/UX for fleet management
- Mobile optimization for spaceship controls
- Advanced analytics and fleet tracking
- Integration with guild systems

## API Reference

### Smart Contract Functions

#### Crafting System

```solidity
// Main crafting function
function craftSpaceship(
    uint256 foundryHash,
    uint8 spaceshipType,
    MaterialType[] memory materials,
    uint256[] memory amounts,
    Biome biome
) public entryFee requireSameOwnerAndJunkOwner(foundryHash)

// Get crafting count for a foundry
function getFoundryCraftingCount(uint256 foundryHash) public view returns (uint8 count, uint64 lastCraftTime)

// Get crafting multiplier based on count
function _getCraftingMultiplier(uint8 craftingCount) internal pure returns (uint256)
```

#### Stat Calculation Functions

```solidity
// Calculate spaceship rarity based on planet level
function _calculateSpaceshipRarity(uint256 planetLevel, uint256 seed) internal pure returns (ArtifactRarity)

// Calculate stat bonuses
function _calculateAttackBonus(Biome biome, ArtifactRarity rarity, uint8 spaceshipType) internal pure returns (uint16)
function _calculateDefenseBonus(Biome biome, ArtifactRarity rarity, uint8 spaceshipType) internal pure returns (uint16)
function _calculateSpeedBonus(Biome biome, ArtifactRarity rarity, uint8 spaceshipType) internal pure returns (uint16)
function _calculateRangeBonus(Biome biome, ArtifactRarity rarity, uint8 spaceshipType) internal pure returns (uint16)

// Role-specific bonus functions
function _getSpaceshipRoleAttackBonus(uint8 spaceshipType) internal pure returns (uint16)
function _getSpaceshipRoleDefenseBonus(uint8 spaceshipType) internal pure returns (uint16)
function _getSpaceshipRoleSpeedBonus(uint8 spaceshipType) internal pure returns (uint16)
function _getSpaceshipRoleRangeBonus(uint8 spaceshipType) internal pure returns (uint16)

// Utility functions
function _getRarityMultiplier(ArtifactRarity rarity) internal pure returns (uint16)
function _getBiomeBonus(Biome biome) internal pure returns (uint16)
function _getSpaceshipMaterialCosts(uint8 spaceshipType) internal pure returns (uint256[12] memory costs)
```

#### Movement Integration Functions

```solidity
// Apply spaceship bonuses to planet stats
function _applySpaceshipBonuses(Planet memory planet, uint32 spaceshipArtifactId) internal view returns (Planet memory)
```

### Client-Side Functions

#### GameManager.ts

```typescript
// Main crafting transaction handler
async craftSpaceship(
    foundryHash: LocationId,
    spaceshipType: number,
    materials: MaterialType[],
    amounts: number[],
    biome: Biome
): Promise<Transaction<UnconfirmedCraftSpaceship>>
```

#### GameUIManager.ts

```typescript
// Get spaceship bonuses for movement calculations
getSpaceshipBonusesForMove(planetId: LocationId): {
    attackBonus: number;
    defenseBonus: number;
    speedBonus: number;
    rangeBonus: number;
} | undefined
```

#### SpaceshipBonusUtils.ts

```typescript
// Get spaceship bonuses from MUD components
function getSpaceshipBonuses(
  artifact: Artifact,
  mudComponents: {
    SpaceshipBonus?: {
      values?: {
        attackBonus?: Map<string, number>;
        defenseBonus?: Map<string, number>;
        speedBonus?: Map<string, number>;
        rangeBonus?: Map<string, number>;
      };
    };
  },
): SpaceshipBonuses | undefined;

// Apply bonuses to planet stats
function applySpaceshipBonuses(
  planet: { speed: number; range: number },
  bonuses: SpaceshipBonuses,
): { speed: number; range: number };
```

#### useSpaceshipMovement.ts

```typescript
// Get energy arriving for move with spaceship bonuses
getEnergyArrivingForMoveWithBonuses(
    uiManager: GameUIManager,
    from: LocationId,
    to: LocationId | undefined,
    dist: number | undefined,
    energy: number
): number

// Get time for move with spaceship bonuses
getTimeForMoveWithBonuses(
    gameManager: GameManager,
    fromId: LocationId,
    toId: LocationId,
    abandoning: boolean,
    artifactSending?: Artifact
): number

// Get spaceship bonuses for specific artifact
getSpaceshipBonusesForArtifact(artifact: Artifact): SpaceshipBonuses | undefined
```

### MUD Component Access

#### CraftedSpaceship Table

```typescript
// Access spaceship metadata
CraftedSpaceship.get(artifactId): {
    artifactId: uint32;
    spaceshipType: uint8;
    biome: Biome;
    rarity: ArtifactRarity;
    craftedAt: uint64;
    nftTokenId: uint256;
    crafter: address;
}
```

#### SpaceshipBonus Table

```typescript
// Access spaceship bonuses
SpaceshipBonus.get(artifactId): {
    artifactId: uint32;
    attackBonus: uint16;
    defenseBonus: uint16;
    speedBonus: uint16;
    rangeBonus: uint16;
}
```

#### FoundryCraftingCount Table

```typescript
// Access foundry crafting data
FoundryCraftingCount.get(foundryHash): {
    foundryHash: bytes32;
    count: uint8;
    lastCraftTime: uint64;
}
```

## Implementation Status

### ✅ Completed Features

- **Full Crafting System**: Complete spaceship crafting with material validation
- **Bonus Calculation**: All stat bonuses calculated and applied correctly
- **Visual System**: Full sprite rendering with biome variations and rarity effects
- **MUD Integration**: All tables and components properly implemented
- **Client Interface**: React-based crafting interface with real-time preview
- **Movement Integration**: Spaceship bonuses applied to movement calculations
- **Combat Integration**: Attack bonuses applied to energy arriving calculations

### 🔧 Current Limitations

- **Crafting Limit**: Maximum 3 spaceships per foundry (by design)
- **Material Requirements**: Complex material requirements for higher-tier spaceships
- **Rarity Dependency**: Spaceship power heavily dependent on foundry planet level
- **Single Deployment**: Only one spaceship can be active per planet

### 🚀 System Architecture

The spaceship system is built on a robust foundation:

- **Smart Contract Layer**: FoundryCraftingSystem.sol handles all crafting logic
- **MUD Component Layer**: Three core tables manage spaceship data
- **Client Integration Layer**: React components and hooks provide user interface
- **Visual Rendering Layer**: Custom sprite system with biome and rarity effects
- **Game Logic Integration**: Seamless integration with movement and combat systems

### 📊 Performance Characteristics

- **Crafting Cost Scaling**: 100% → 150% → 225% for successive crafts
- **Rarity Scaling**: 100% → 120% → 150% → 200% → 300% multipliers
- **Biome Bonuses**: +1 to +8 based on biome difficulty
- **Role Bonuses**: Fixed values per spaceship type (0-15 range)

### 🎯 Strategic Considerations

- **Early Crafting**: Lower costs but limited by foundry level
- **Late Crafting**: Higher costs but better rarity potential
- **Biome Selection**: Higher difficulty biomes provide better bonuses
- **Fleet Composition**: Different spaceship types serve different strategic roles
- **Resource Management**: Complex material requirements demand strategic planning
