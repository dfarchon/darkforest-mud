# Dark Forest MUD - Game Mechanics Documentation

## Overview

Dark Forest MUD is a decentralized, real-time strategy game built on blockchain technology. Players explore a vast universe, discover planets, gather resources, craft artifacts, and engage in strategic gameplay through movement, combat, and resource management.

## Universe Structure

### Universe Zones

The game universe is divided into concentric zones based on distance from the center:

- **Zone 0**: Inner circle (0 - 56,250 units from center)
- **Zone 1**: 56,250 - 75,000 units
- **Zone 2**: 75,000 - 93,750 units
- **Zone 3**: 93,750 - 112,500 units
- **Zone 4**: 112,500 - 131,250 units
- **Zone 5**: Outer zone (131,250+ units)

### Zone Characteristics

- **Planet Level Limits**: Each zone has maximum planet levels
- **Level Bonuses**: Inner zones provide level bonuses
- **Resource Distribution**: Different zones have varying resource availability

## Space Types

### Nebula (Type 1)

- **Characteristics**: Dense, resource-rich space
- **Planet Distribution**: High concentration of planets
- **Special Features**: Enhanced material generation
- **Perlin Threshold**: < 14

### Space (Type 2)

- **Characteristics**: Standard space environment
- **Planet Distribution**: Balanced planet distribution
- **Special Features**: Normal gameplay mechanics
- **Perlin Threshold**: 14 - 15

### Deep Space (Type 3)

- **Characteristics**: Sparse, dangerous space
- **Planet Distribution**: Fewer but more valuable planets
- **Special Features**: Higher level planets, rare resources
- **Perlin Threshold**: 15 - 19

### Dead Space (Type 4)

- **Characteristics**: Extremely hostile environment
- **Planet Distribution**: Very rare planets
- **Special Features**: Maximum level planets, unique resources
- **Perlin Threshold**: > 19

## Planet Types

### Regular Planet (Type 1)

- **Purpose**: Standard gameplay planet
- **Characteristics**: Balanced stats, normal resource generation
- **Uses**: Population growth, silver generation, artifact storage
- **Special Features**: Can hold artifacts, standard movement mechanics

### Asteroid Field (Type 2)

- **Purpose**: Material generation and storage
- **Characteristics**: High material capacity, material growth
- **Uses**: Material farming, resource storage
- **Special Features**: Materials grow over time, higher material caps

### Foundry (Type 3)

- **Purpose**: Spaceship crafting facility
- **Requirements**: Level 4+ planets
- **Uses**: Crafting spaceships, material processing
- **Special Features**: Can craft up to 3 spaceships, crafting multipliers

### Spacetime Rip (Type 4)

- **Purpose**: Special portal planet
- **Characteristics**: Unique movement mechanics
- **Uses**: Instant travel, strategic positioning
- **Special Features**: Wormhole-like properties, instant movement

### Quasar (Type 5)

- **Purpose**: High-energy planet
- **Characteristics**: Enhanced energy generation
- **Uses**: Energy production, power generation
- **Special Features**: Increased energy capacity and growth

## Planet Biomes

### Ocean (Biome 1)

- **Materials**: Water Crystals
- **Characteristics**: High water resource availability
- **Visual**: Blue, aquatic-themed planets

### Forest (Biome 2)

- **Materials**: Living Wood
- **Characteristics**: Organic resource generation
- **Visual**: Green, forested planets

### Grassland (Biome 3)

- **Materials**: Windsteel
- **Characteristics**: Wind-based resources
- **Visual**: Green, grassy planets

### Tundra (Biome 4)

- **Materials**: Aurorium
- **Characteristics**: Polar energy resources
- **Visual**: White, icy planets

### Swamp (Biome 5)

- **Materials**: Mycelium
- **Characteristics**: Fungal resource generation
- **Visual**: Dark green, swampy planets

### Desert (Biome 6)

- **Materials**: Sandglass
- **Characteristics**: Temporal energy resources
- **Visual**: Yellow, sandy planets

### Ice (Biome 7)

- **Materials**: Cryostone
- **Characteristics**: Cryogenic resources
- **Visual**: White, frozen planets

### Wasteland (Biome 8)

- **Materials**: Scrapium
- **Characteristics**: Scrap and junk resources
- **Visual**: Gray, desolate planets

### Lava (Biome 9)

- **Materials**: Pyrosteel
- **Characteristics**: Volcanic resources
- **Visual**: Red, volcanic planets

### Corrupted (Biome 10)

- **Materials**: Blackalloy, Corrupted Crystal
- **Characteristics**: Corrupted, unstable resources
- **Visual**: Dark, corrupted planets
- **Special**: Higher chance for ancient artifacts

## Planet Levels

### Level System

- **Level 1**: Basic planets, limited capabilities
- **Level 2-3**: Intermediate planets, moderate stats
- **Level 4-5**: Advanced planets, good stats
- **Level 6-7**: High-level planets, excellent stats
- **Level 8-9**: Maximum level planets, best stats

### Level Determination

- **Distance Factor**: Distance from center affects level
- **Perlin Factor**: Perlin noise affects level
- **Zone Factor**: Universe zone provides level bonuses
- **Space Type**: Different space types have level limits

### Level Benefits

- **Higher Stats**: Better energy, silver, defense, speed, range
- **Material Capacity**: Higher material storage limits
- **Artifact Slots**: More artifact storage capacity
- **Crafting Access**: Higher levels unlock better crafting

## Movement System

### Movement Mechanics

#### Basic Movement

- **Energy Cost**: Movement consumes energy
- **Distance Calculation**: Euclidean distance between planets
- **Speed Factor**: Planet speed affects travel time (modified by spaceship speed bonuses)
- **Range Limit**: Planets have maximum movement range (extended by spaceship range bonuses)

#### Movement Formula

```
Travel Time = (Distance × 100) / (Speed × SpaceshipSpeedBonus)
Range = PlanetRange × SpaceshipRangeBonus
```

#### Movement Requirements

- **Ownership**: Must own the source planet
- **Energy**: Sufficient energy for movement
- **Range**: Target planet within range
- **Proof**: Cryptographic proof of movement

### Movement Types

#### Regular Movement

- **Purpose**: Standard planet-to-planet travel
- **Energy Transfer**: Moves energy to destination
- **Silver Transfer**: Moves silver to destination
- **Artifact Transfer**: Moves artifacts to destination
- **Material Transfer**: Moves materials to destination

#### Abandonment

- **Purpose**: Complete planet abandonment
- **Energy Transfer**: All energy moved to destination
- **Silver Transfer**: All silver moved to destination
- **Artifact Transfer**: All artifacts moved to destination
- **Material Transfer**: All materials moved to destination

### Arrival System

#### Arrival Mechanics

- **Timing**: Arrivals happen at calculated arrival time
- **Combat**: Arrivals can trigger combat if attacking
- **Conquest**: Successful attacks can conquer planets
- **Resource Transfer**: Resources are transferred on arrival

#### Combat Resolution

- **Attack Calculation**: `(Energy × SpaceshipAttackBonus) × 100 / Defense`
- **Conquest**: If attack > planet energy, planet is conquered
- **Damage**: If attack < planet energy, planet takes damage
- **Guild Protection**: Same guild members don't attack each other
- **Spaceship Bonuses**: Attack bonuses from spaceship artifacts enhance combat effectiveness

## Exploration System

### Discovery Mechanics

#### Planet Discovery

- **Mining**: Players mine chunks to discover planets
- **Perlin Noise**: Uses perlin noise for planet generation
- **Hash Verification**: Cryptographic verification of planet existence
- **Reveal System**: Players must reveal planet locations

#### Chunk Mining

- **Chunk Size**: Configurable chunk size for mining
- **Worker System**: Multi-threaded mining workers
- **Progress Tracking**: Real-time mining progress
- **Result Processing**: Chunk results processed and stored

### Exploration Tools

#### Miner Manager

- **Multi-core Support**: Utilizes multiple CPU cores
- **Chunk Distribution**: Distributes work across workers
- **Progress Monitoring**: Tracks mining progress
- **Result Aggregation**: Combines results from all workers

#### Remote Explorer

- **Remote Mining**: Mining via remote workers
- **Load Distribution**: Distributes mining load
- **Result Collection**: Collects results from remote workers

### Home Planet Selection

#### Selection Criteria

- **Space Type**: Must be Nebula space type
- **Level Range**: Must be within acceptable level range
- **Distance**: Must be within spawn distance limits
- **Availability**: Planet must be unowned

#### Selection Process

- **Random Search**: Searches for suitable home planets
- **Validation**: Validates planet suitability
- **Selection**: Selects best available planet
- **Initialization**: Initializes player on selected planet

## Resource Management

### Energy System

#### Energy Generation

- **Natural Growth**: Energy grows over time
- **Growth Rate**: Based on planet level and upgrades
- **Energy Cap**: Maximum energy capacity
- **Growth Doublers**: Artifacts can double growth

#### Energy Usage

- **Movement**: Energy consumed for movement
- **Combat**: Energy used for attacks
- **Artifact Activation**: Energy required for artifacts
- **Planet Upgrades**: Energy for planet improvements

### Silver System

#### Silver Generation

- **Natural Growth**: Silver grows over time
- **Growth Rate**: Based on planet level and upgrades
- **Silver Cap**: Maximum silver capacity
- **Growth Doublers**: Artifacts can double growth

#### Silver Usage

- **Movement**: Silver can be moved between planets
- **Trading**: Silver for player-to-player transactions
- **Guild Treasury**: Silver contributed to guild funds
- **Planet Upgrades**: Silver for planet improvements

### Material System

#### Material Generation

- **Growth**: Materials grow on Asteroid Field planets
- **Growth Rate**: Based on planet level
- **Material Cap**: Maximum material capacity
- **Growth Control**: Growth can be enabled/disabled

#### Material Usage

- **Spaceship Crafting**: Materials required for crafting
- **Movement**: Materials can be moved between planets
- **Trading**: Materials for player-to-player transactions
- **Storage**: Materials stored on planets

## Combat System

### Combat Mechanics

#### Attack Calculation

- **Base Attack**: Attacking energy
- **Defense Factor**: Target planet defense
- **Damage Formula**: `Attack × 100 / Defense`
- **Conquest Threshold**: Attack must exceed planet energy

#### Combat Resolution

- **Successful Attack**: Planet is conquered
- **Failed Attack**: Planet takes damage but remains owned
- **Guild Protection**: Same guild members don't attack
- **Artifact Effects**: Artifacts can modify combat

### Combat Types

#### Planet Conquest

- **Purpose**: Take control of enemy planets
- **Requirements**: Sufficient attack power
- **Result**: Planet ownership changes
- **Consequences**: All resources transfer to new owner

#### Planet Damage

- **Purpose**: Weaken enemy planets
- **Requirements**: Attack power less than conquest threshold
- **Result**: Planet energy reduced
- **Consequences**: Planet becomes easier to conquer

## Artifact System

### Artifact Discovery

#### Finding Artifacts

- **Prospecting**: Players prospect planets for artifacts
- **Rarity System**: Artifacts have different rarity levels
- **Ancient Variants**: Special ancient artifacts with enhanced properties
- **Biome Effects**: Different biomes affect artifact discovery

#### Artifact Types

- **Basic Artifacts**: Monolith, Colossus, Pyramid
- **Relic Artifacts**: Wormhole, Planetary Shield, Photoid Cannon
- **Spaceship Artifacts**: Scout, Fighter, Destroyer, Carrier

### Artifact Usage

#### Activation System

- **Charging**: Artifacts must be charged before use
- **Activation**: Artifacts provide effects when activated
- **Cooldown**: Artifacts have cooldown periods
- **Requirements**: Level, population, or silver requirements

#### Implemented Artifact Types

The game implements several specific artifact types with unique activation mechanics:

1. **Pink Bomb (Index 1)**

   - **Type**: Offensive
   - **Effect**: Launches bombs to destroy target planets
   - **Mechanics**: Requires cryptographic proof, population cost, destroy window

2. **Bloom Filter (Index 4)**

   - **Type**: General
   - **Effect**: Instantly fills planet to population cap
   - **Mechanics**: No charge/cooldown, instant activation

3. **Wormhole (Index 5)**

   - **Type**: General
   - **Effect**: Creates instant travel connections
   - **Mechanics**: Distance multipliers, same-owner requirement

4. **Photoid Cannon (Index 6)**
   - **Type**: Offensive
   - **Effect**: Massive stat bonuses for one move
   - **Mechanics**: One per planet, rarity-based bonuses, breaks after use

#### Effect System

Artifacts use a comprehensive effect system with different trigger types:

- **STAT**: Permanent stat modifications
- **BEFORE_MOVE**: Effects triggered before movement
- **AFTER_MOVE**: Effects triggered after movement
- **BEFORE_ARRIVAL**: Effects triggered before arrival
- **AFTER_ARRIVAL**: Effects triggered after arrival

#### Artifact Effects

- **Stat Bonuses**: Attack, defense, speed, range bonuses
- **Special Abilities**: Unique effects based on artifact type
- **Planet Modifiers**: Artifacts can modify planet properties
- **Combat Effects**: Artifacts can affect combat outcomes

## Guild System

### Guild Features

#### Guild Structure

- **Roles**: Leader, Officer, Member hierarchy
- **Permissions**: Role-based access control
- **Resource Sharing**: Shared guild treasury
- **Delegation**: Members can act on behalf of others

#### Guild Operations

- **Creation**: Players can create guilds
- **Invitations**: Officers can invite new members
- **Applications**: Players can apply to join guilds
- **Management**: Leaders can manage guild settings

### Guild Benefits

#### Resource Sharing

- **Silver Pool**: Shared guild treasury
- **Resource Coordination**: Coordinated resource management
- **Economic Benefits**: Guild economic advantages
- **Strategic Coordination**: Coordinated gameplay

#### Delegation System

- **Permission Levels**: Configurable delegation permissions
- **Same Guild**: Delegation only works within guild
- **Role Requirements**: Delegates must meet role requirements
- **Action Authorization**: Delegates can act on behalf of others

## Technical Implementation

### Blockchain Integration

#### Smart Contracts

- **MUD Framework**: Uses MUD for state management
- **Component System**: Modular component architecture
- **Event System**: Real-time event handling
- **Gas Optimization**: Efficient contract operations

#### Client Integration

- **React Frontend**: Modern web interface
- **Real-time Updates**: Live game state updates
- **Transaction Management**: Efficient transaction handling
- **Error Handling**: Comprehensive error management

### Performance Optimization

#### Client Optimizations

- **Component Memoization**: React performance optimization
- **Lazy Loading**: Code splitting for better performance
- **State Caching**: Local state caching
- **Batch Updates**: Grouped state updates

#### Contract Optimizations

- **Gas Efficiency**: Optimized gas usage
- **Batch Operations**: Grouped contract operations
- **Storage Optimization**: Efficient storage layout
- **Event Optimization**: Minimal event data

## Game Balance

### Economic Balance

#### Resource Distribution

- **Scarcity**: Resources are limited and valuable
- **Growth Rates**: Balanced resource growth
- **Cost Scaling**: Costs scale with progression
- **Risk vs Reward**: Higher risk areas provide better rewards

#### Progression System

- **Level Scaling**: Exponential stat scaling
- **Rarity Distribution**: Balanced artifact rarity
- **Crafting Costs**: Increasing crafting costs
- **Strategic Depth**: Multiple viable strategies

### Strategic Depth

#### Multiple Paths

- **Exploration**: Focus on discovery and exploration
- **Combat**: Focus on conquest and warfare
- **Economy**: Focus on resource management
- **Diplomacy**: Focus on guild and social play

#### Risk Management

- **Distance Risk**: Further planets are riskier
- **Resource Risk**: Resource investment decisions
- **Combat Risk**: Attack and defense strategies
- **Guild Risk**: Guild membership decisions

## Future Enhancements

### Planned Features

#### Gameplay Features

- **Guild Wars**: Inter-guild conflict system
- **Advanced Crafting**: More complex crafting systems
- **Territory Control**: Guild-controlled areas
- **Quest System**: Cooperative quest mechanics

#### Technical Features

- **Mobile Support**: Mobile device optimization
- **Enhanced UI**: Improved user interface
- **Analytics**: Advanced game analytics
- **Performance**: Further performance improvements

### Community Features

#### Social Features

- **Guild Chat**: In-game communication
- **Player Profiles**: Enhanced player profiles
- **Achievement System**: Player achievements
- **Leaderboards**: Competitive rankings

#### Content Features

- **Seasonal Events**: Special game events
- **New Artifacts**: Additional artifact types
- **New Planet Types**: Additional planet varieties
- **New Materials**: Additional resource types

This comprehensive game system provides a rich, strategic gameplay experience with multiple paths to victory, deep resource management, and engaging social features through the guild system.
