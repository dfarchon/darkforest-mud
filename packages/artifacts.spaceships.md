# Spaceships System Documentation

## Overview

Spaceships are a special category of artifacts in Dark Forest MUD that represent player-controlled vessels for exploration, combat, and resource management. Unlike regular artifacts, spaceships are primarily crafted rather than discovered, and they provide unique gameplay mechanics for fleet management and strategic positioning.

## Spaceship Types

### Scout (Type 1)

- **Role**: Reconnaissance and exploration
- **Base Stats**: 0 Attack, 0 Defense, 10 Speed, 5 Range
- **Materials**: Windsteel (100) + Aurorium (50)
- **Purpose**: Fast movement and long-range scouting
- **Special Abilities**: Enhanced movement speed and range

### Fighter (Type 2)

- **Role**: Balanced combat vessel
- **Base Stats**: 5 Attack, 5 Defense, 0 Speed, 5 Range
- **Materials**: Pyrosteel (150) + Scrapium (100)
- **Purpose**: Versatile combat operations
- **Special Abilities**: Balanced offensive and defensive capabilities

### Destroyer (Type 3)

- **Role**: Heavy assault vessel
- **Base Stats**: 10 Attack, 10 Defense, 0 Speed, 0 Range
- **Materials**: Blackalloy (200) + Corrupted Crystal (100)
- **Purpose**: Maximum firepower and defense
- **Special Abilities**: Highest attack and defense bonuses

### Carrier (Type 4)

- **Role**: Support and transport vessel
- **Base Stats**: 5 Attack, 15 Defense, 0 Speed, 3 Range
- **Materials**: Living Wood (200) + Cryostone (150)
- **Purpose**: Defensive operations and resource transport
- **Special Abilities**: Highest defense bonus, moderate range

## Spaceship Crafting System

### Foundry Requirements

- **Planet Type**: Foundry (PlanetType.FOUNDRY)
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

### Data Storage

- Spaceship properties stored in MUD tables
- CraftedSpaceship table: Type, biome, rarity, timestamps
- SpaceshipBonus table: Attack, defense, speed, range bonuses
- FoundryCraftingCount table: Crafting limits and multipliers

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

### Crafting Function

```solidity
function craftSpaceship(
    uint256 foundryHash,
    uint8 spaceshipType,
    MaterialType[] memory materials,
    uint256[] memory amounts,
    Biome biome
) public
```

### Stat Calculation Functions

```solidity
function _calculateAttackBonus(Biome biome, ArtifactRarity rarity, uint8 spaceshipType) internal pure returns (uint16)
function _calculateDefenseBonus(Biome biome, ArtifactRarity rarity, uint8 spaceshipType) internal pure returns (uint16)
function _calculateSpeedBonus(Biome biome, ArtifactRarity rarity, uint8 spaceshipType) internal pure returns (uint16)
function _calculateRangeBonus(Biome biome, ArtifactRarity rarity, uint8 spaceshipType) internal pure returns (uint16)
```

### Utility Functions

```solidity
function getFoundryCraftingCount(uint256 foundryHash) public view returns (uint8 count, uint64 lastCraftTime)
function getCraftingMultiplier(uint256 foundryHash) public view returns (uint256 multiplier)
```

### Spaceship Bonus Functions

```solidity
function _applySpaceshipBonuses(Planet memory planet, uint32 artifactId) internal view returns (Planet memory)
function getSpaceshipBonuses(Artifact memory artifact, MUDComponents components) public view returns (SpaceshipBonuses)
```

### Movement Integration Functions

```solidity
function getEnergyArrivingForMove(LocationId from, LocationId to, number dist, number energy, boolean abandoning, SpaceshipBonuses bonuses) public view returns (number)
function getTimeForMove(LocationId from, LocationId to, boolean abandoning, SpaceshipBonuses bonuses) public view returns (number)
function getSpaceshipRangeBoost(LocationId planetId) public view returns (number)
```
