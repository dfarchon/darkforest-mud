# Artifacts System Documentation

## Overview

The Dark Forest MUD game features a comprehensive artifacts system that allows players to discover, craft, and utilize various types of artifacts throughout the game universe. Artifacts are special items that can be found on planets, crafted at foundries, and provide various bonuses and abilities to players.

## Artifact Types

### Basic Artifacts

- **Monolith** (Type 1): Basic artifact providing stat boosts
- **Colossus** (Type 2): Large defensive artifact
- **Pyramid** (Type 4): Ancient structure artifact

### Relic Artifacts (Forgotten Technologies)

- **Wormhole** (Type 5): Creates instant travel links between planets
- **Planetary Shield** (Type 6): Provides defensive bonuses to planets
- **Photoid Cannon** (Type 7): Offensive weapon system
- **Bloom Filter** (Type 8): Information gathering device
- **Black Domain** (Type 9): Creates protected zones
- **Ice Link** (Type 10): Creates cold-based connections
- **Fire Link** (Type 11): Creates fire-based connections
- **Kardashev** (Type 12): Advanced civilization artifact
- **Bomb** (Type 13): Explosive device
- **Stellar Shield** (Type 14): Advanced defensive system
- **Blind Box** (Type 15): Mystery artifact
- **Avatar** (Type 16): Player representation artifact

### Spaceship Artifacts

- **Spaceship** (Type 3): Crafted spaceships with dynamic bonuses using isArtifactSpaceship()
  - **Scout**: Fast reconnaissance with speed and range bonuses
  - **Fighter**: Balanced combat with attack and defense bonuses
  - **Destroyer**: Heavy assault with maximum attack and defense
  - **Carrier**: Defensive support with high defense and moderate range
- \*\* SPACESHIPS using isSpaceship()
- **Mothership** (Type 17): Large command vessel
- **Crescent** (Type 18): Fast attack ship
- **Whale** (Type 19): Heavy transport ship
- **Gear** (Type 20): Mechanical ship
- **Titan** (Type 21): Massive warship
- **Pink** (Type 22): Special pink-colored ship

## Artifact Rarity System

Artifacts come in different rarity levels that affect their power and availability:

- **Common** (Rarity 1): Most frequently found artifacts
- **Rare** (Rarity 2): Uncommon artifacts with better stats
- **Epic** (Rarity 3): Powerful artifacts with significant bonuses
- **Legendary** (Rarity 4): Extremely rare and powerful artifacts
- **Mythic** (Rarity 5): The rarest artifacts with maximum power

## Artifact Status System

Artifacts can be in different states:

- **Default** (Status 0): Normal inactive state
- **Cooldown** (Status 1): Cooling down after use
- **Charging** (Status 2): Building up energy for activation
- **Ready** (Status 3): Ready to be activated
- **Active** (Status 4): Currently active and providing effects
- **Broken** (Status 5): Damaged and unusable

## Artifact Genres

Artifacts are categorized by their primary function:

- **Defensive** (Genre 1): Provides protection and defensive bonuses
- **Offensive** (Genre 2): Used for attacks and offensive capabilities
- **Productive** (Genre 3): Enhances resource generation and efficiency
- **General** (Genre 4): Provides general utility and mixed benefits

## Artifact Activation System

### Activation Mechanics

Artifacts can be activated to provide various effects and bonuses. The activation process involves:

1. **Charging**: Artifacts must be charged before activation
2. **Activation**: Once charged, artifacts can be activated to provide their effects
3. **Cooldown**: After activation, artifacts enter a cooldown period

### Implemented Artifact Types

The game implements several specific artifact types with unique activation mechanics:

#### 1. Pink Bomb (Index 1)

- **Genre**: Offensive
- **Activation Effect**: Launches a bomb to destroy target planets
- **Mechanics**:
  - Requires cryptographic proof for target revelation
  - Population cost based on distance to target
  - Bomb has arrival time and destroy window (300 ticks)
  - Different blast radius based on rarity
  - Can destroy planets within blast radius
- **Effect**: `GENERAL_ACTIVATE` - Provides range and speed bonuses during launch

#### 2. Bloom Filter (Index 4)

- **Genre**: General
- **Activation Effect**: Instantly fills planet to population cap
- **Mechanics**:
  - No charge or cooldown required
  - Instant activation
  - Simple population restoration effect
- **Requirements**: Planet level 2+ for activation

#### 3. Wormhole (Index 5)

- **Genre**: General
- **Activation Effect**: Creates instant travel connection between planets
- **Mechanics**:
  - Requires same owner for both planets
  - Cannot set wormhole to self
  - Distance multiplier based on rarity:
    - Common: 1000x (no reduction)
    - Rare: 500x
    - Epic: 250x
    - Legendary: 125x
    - Mythic: 62x
  - Creates bidirectional connection
  - Can be shut down to remove connection

#### 4. Photoid Cannon (Index 6)

- **Genre**: Offensive
- **Activation Effect**: Provides massive stat bonuses for one move
- **Mechanics**:
  - Only one cannon per planet allowed
  - Rarity-based effects:
    - **Charging Effects** (Defense bonuses):
      - Common: +50% defense
      - Rare: +40% defense
      - Epic: +30% defense
      - Legendary: +20% defense
      - Mythic: +10% defense
    - **Activation Effects** (Move bonuses):
      - Common: +200% range, +500% speed
      - Rare: +200% range, +1000% speed
      - Epic: +200% range, +1500% speed
      - Legendary: +200% range, +2000% speed
      - Mythic: +200% range, +2500% speed
  - Effects trigger on BEFORE_MOVE and clean up on AFTER_MOVE
  - Artifact breaks after activation (non-reusable)

### Effect Types

The game implements a comprehensive effect system with different trigger types:

- **STAT**: Permanent stat modifications
- **BEFORE_MOVE**: Effects triggered before movement
- **AFTER_MOVE**: Effects triggered after movement
- **BEFORE_ARRIVAL**: Effects triggered before arrival
- **AFTER_ARRIVAL**: Effects triggered after arrival

### Activation Requirements

Different artifacts have different requirements:

- **Population Cost**: Some artifacts consume population
- **Silver Cost**: Some artifacts consume silver
- **Planet Level**: Minimum planet level requirements
- **Ownership**: Must own the planet
- **Cooldown**: Time between activations
- **Durability**: Whether artifact breaks after use
- **Reusability**: Whether artifact can be used multiple times

## Artifact Discovery

### Finding Artifacts

- Artifacts are discovered through planet prospecting
- Rarity is determined by planet level and biome
- Higher level planets have better chances for rare artifacts
- Corrupted biomes have higher chances for ancient artifacts

### Ancient Artifacts isAncient

- Special variant of artifacts with enhanced properties
- 1/16 chance in normal biomes, 1/2 chance in corrupted biomes
- Determined by artifact ID hash and biome type
- Visually distinct with "ancient" appearance

## Artifact Crafting

### Foundry System

- Artifacts can be crafted at Foundry planets (level 4+)
- Requires specific materials based on artifact type
- Crafting costs increase with each craft (1.0x, 1.5x, 2.25x)
- Maximum 3 crafts per foundry

### Spaceship Crafting

Special crafting system for spaceships with dynamic bonus application:

- **Scout**: Fast reconnaissance ship (Windsteel + Aurorium)
  - **Bonuses**: Speed and range bonuses applied during movement
- **Fighter**: Balanced combat ship (Pyrosteel + Scrapium)
  - **Bonuses**: Attack and defense bonuses applied during combat
- **Destroyer**: Heavy attack ship (Blackalloy + Corrupted Crystal)
  - **Bonuses**: Maximum attack and defense bonuses for heavy assault
- **Carrier**: Defensive support ship (Living Wood + Cryostone)
  - **Bonuses**: High defense and moderate range bonuses for support

#### Spaceship Bonus Integration

- **Movement System**: Range and speed bonuses applied to planet movement calculations
- **Combat System**: Attack bonuses applied to energy arriving calculations
- **Visual System**: Range circles and planet stats dynamically update with bonuses
- **Client Integration**: Real-time bonus application in UI and movement validation

## Artifact Properties

### Stat Bonuses

Most artifacts provide stat bonuses to planets:

- **Attack Bonus**: Increases planet's attack power
- **Defense Bonus**: Increases planet's defensive capabilities
- **Speed Bonus**: Increases movement speed
- **Range Bonus**: Increases movement range

### Special Properties

- **Durable**: Artifact doesn't break from use
- **Reusable**: Can be used multiple times
- **Charge/Cooldown**: Time-based activation system
- **Requirements**: Level, population, or silver requirements

## Artifact Management

### Storage

- Artifacts can be stored in player wallets (NFTs)
- Can be deposited on Trading Post planets
- Maximum 8 artifacts per planet

### Activation

- Artifacts must be charged before activation
- Only one artifact can be active per planet at a time
- Activation requires meeting all requirements
- Cooldown period after deactivation

### Trading

- Artifacts can be traded between players
- NFT-based ownership system
- Can be listed on marketplaces

## Technical Implementation

### Smart Contract Structure

- Uses MUD framework for state management
- Artifact data stored in component tables
- NFT integration for ownership tracking
- Event system for real-time updates

### Client Integration

- React-based UI for artifact management
- Real-time updates via MUD subscriptions
- Visual rendering with biome-based sprites
- Tooltip system for artifact information

## Game Balance

### Rarity Distribution

- Common: 60% of all artifacts
- Rare: 25% of all artifacts
- Epic: 10% of all artifacts
- Legendary: 4% of all artifacts
- Mythic: 1% of all artifacts

### Power Scaling

- Higher rarity = exponentially better stats
- Biome bonuses add to base artifact power
- Ancient artifacts get additional multipliers
- Crafted artifacts can exceed found artifact power

## Future Enhancements

### Planned Features

- Artifact fusion system
- Artifact evolution mechanics
- Guild artifact sharing
- Artifact marketplace integration
- Advanced crafting recipes

### Technical Improvements

- Gas optimization for artifact operations
- Enhanced visual effects
- Mobile-responsive artifact UI
- Artifact analytics and tracking
