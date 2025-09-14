# Materials System Documentation

## Overview

The Dark Forest MUD game features a comprehensive materials system that provides resources for crafting spaceships, upgrading planets, and various other gameplay mechanics. Materials are found on planets, grow over time, and can be transported between locations.

## Material Types

### Basic Materials

#### Water Crystals (Type 1)

- **Description**: A shimmering liquid harvested from deep ocean wells, used in cooling systems, fluidic shields, and hydro-reactive engines.
- **Biome**: Ocean planets
- **Uses**: Cooling systems, fluidic shields, hydro-reactive engines

#### Living Wood (Type 2)

- **Description**: An organic, flexible biofiber that forms the core of regenerative hull plating and photosynthetic tech modules.
- **Biome**: Forest planets
- **Uses**: Regenerative hull plating, photosynthetic tech modules

#### Windsteel (Type 3)

- **Description**: Lightweight and highly conductive alloy spun from atmospheric windsteel veins; vital for turbine propulsion and trade ship frames.
- **Biome**: Grassland planets
- **Uses**: Turbine propulsion, trade ship frames, Scout spaceships

#### Aurorium (Type 4)

- **Description**: Luminous mineral infused with polar energy, mined from aurora-lit tundra fields. Used in advanced navigation cores, sensor arrays, and energy-reflective ship plating.
- **Biome**: Tundra planets
- **Uses**: Navigation cores, sensor arrays, energy-reflective plating, Scout spaceships

### Advanced Materials

#### Mycelium (Type 5)

- **Description**: Pulsating fungal gel infused with life essence; powers alchemical reactors and mycelial growth algorithms.
- **Biome**: Swamp planets
- **Uses**: Alchemical reactors, mycelial growth algorithms

#### Sandglass (Type 6)

- **Description**: Sharp, granular shards capable of storing temporal energy—used in chrono-sensors and time-slowing projectiles.
- **Biome**: Desert planets
- **Uses**: Chrono-sensors, time-slowing projectiles

#### Cryostone (Type 7)

- **Description**: Frozen mineral forged in vacuum conditions, used in advanced refrigeration, stasis chambers, and cryo-lasers.
- **Biome**: Ice planets
- **Uses**: Refrigeration, stasis chambers, cryo-lasers, Carrier spaceships

#### Scrapium (Type 8)

- **Description**: Junk-forged alloy made from Wasteland scraps, restructured into modular components for rough industrial builds.
- **Biome**: Wasteland planets
- **Uses**: Modular components, industrial builds, Fighter spaceships

#### Pyrosteel (Type 9)

- **Description**: Ultra-dense alloy mined from volcanic zones, ideal for magma engines, high-heat armor, and thermal weapon cores.
- **Biome**: Lava planets
- **Uses**: Magma engines, high-heat armor, thermal weapon cores, Fighter spaceships

### Rare Materials

#### Blackalloy (Type 10)

- **Description**: A forbidden dark alloy synthesized from corrupted zones. Dense, unstable, and extremely powerful in shadow-tech applications.
- **Biome**: Corrupted planets
- **Uses**: Shadow-tech applications, Destroyer spaceships

#### Corrupted Crystal (Type 11)

- **Description**: Crystallized corruption extracted from reality-warped biomes. Essential for ZK-reactors, entropy drives, and unstable modules.
- **Biome**: Corrupted planets
- **Uses**: ZK-reactors, entropy drives, unstable modules, Destroyer spaceships

## Material Properties

### Growth System

Materials grow over time on planets with the following characteristics:

- **Growth Rate**: `planetLevel * 1e16` per tick
- **Growth Cap**: Determined by planet level
- **Growth Status**: Can be enabled/disabled per material type
- **Default Amount**: 5000 units in development mode

### Material Storage

- **Storage Structure**: Each planet can store multiple material types
- **Growth Tracking**: Growth status is persistent across ticks
- **Amount Tracking**: Current amounts are updated in real-time
- **Cap Management**: Materials cannot exceed their growth cap

## Material Distribution

### Biome-Based Distribution

Materials are distributed based on planet biomes:

- **Ocean**: Water Crystals
- **Forest**: Living Wood
- **Grassland**: Windsteel
- **Tundra**: Aurorium
- **Swamp**: Mycelium
- **Desert**: Sandglass
- **Ice**: Cryostone
- **Wasteland**: Scrapium
- **Lava**: Pyrosteel
- **Corrupted**: Blackalloy, Corrupted Crystal

### Planet Type Requirements

- **Asteroid Fields**: Primary source of materials
- **Foundries**: Used for crafting spaceships
- **Regular Planets**: Limited material storage

## Material Usage

### Spaceship Crafting

Materials are essential for crafting spaceships at Foundry planets:

#### Scout Spaceship

- **Windsteel**: 100 units
- **Aurorium**: 50 units

#### Fighter Spaceship

- **Pyrosteel**: 150 units
- **Scrapium**: 100 units

#### Destroyer Spaceship

- **Blackalloy**: 200 units
- **Corrupted Crystal**: 100 units

#### Carrier Spaceship

- **Living Wood**: 200 units
- **Cryostone**: 150 units

### Material Transportation

Materials can be moved between planets:

- **Move System**: Materials are included in planet-to-planet moves
- **Abandonment**: All materials are automatically moved when abandoning a planet
- **Storage Limits**: Planets have material storage capacity limits

## Technical Implementation

### Smart Contract Structure

- **MaterialStorage**: Manages material amounts and growth status
- **PlanetMaterial**: Stores material amounts per planet
- **PlanetMaterialGrowth**: Tracks growth status per material
- **MaterialMove**: Handles material transportation

### Client Integration

- **Real-time Updates**: Material amounts update in real-time
- **Growth Calculation**: Client calculates material growth based on ticks
- **Visual Representation**: Materials displayed with unique colors and icons

## Material Economics

### Growth Mechanics

- **Tick-based Growth**: Materials grow every game tick
- **Level Scaling**: Higher level planets have better growth rates
- **Cap Management**: Growth stops at material cap

### Resource Management

- **Strategic Collection**: Players must balance material collection and usage
- **Transportation Costs**: Moving materials requires energy and time
- **Crafting Efficiency**: Optimal material usage for spaceship crafting

## Artifact Integration

### Material Usage in Artifacts

Materials play a crucial role in artifact activation and effects:

#### Artifact Activation Requirements

Some artifacts require specific materials for activation:

- **Population Cost**: Consumes planet population
- **Silver Cost**: Consumes planet silver
- **Material Cost**: May consume specific materials
- **Planet Level**: Minimum planet level requirements

#### Artifact Effects on Materials

Activated artifacts can affect material systems:

- **Growth Enhancement**: Artifacts can boost material growth rates
- **Storage Expansion**: Artifacts can increase material storage capacity
- **Production Bonuses**: Artifacts can enhance material generation
- **Efficiency Improvements**: Artifacts can reduce material consumption

### Spaceship Crafting Integration

Materials are essential for spaceship crafting at foundry planets:

- **Crafting Requirements**: Each spaceship type requires specific materials
- **Rarity Scaling**: Higher rarity spaceships require more materials
- **Crafting Multipliers**: Foundry crafting costs increase with each craft
- **Material Consumption**: Materials are consumed during crafting process
- **Bonus Generation**: Crafted spaceships generate dynamic bonuses for movement and combat
- **Strategic Value**: Material investment directly translates to gameplay advantages through spaceship bonuses

## Future Enhancements

### Planned Features

- **Material Trading**: Player-to-player material exchange
- **Advanced Crafting**: More complex material combinations
- **Material Refinement**: Processing raw materials into advanced components
- **Guild Material Sharing**: Shared material pools for guilds

### Technical Improvements

- **Gas Optimization**: Efficient material storage and updates
- **Enhanced UI**: Better material management interface
- **Material Analytics**: Tracking material production and usage
- **Mobile Support**: Material management on mobile devices

## API Reference

### Material Functions

```solidity
function getMaterial(Planet memory planet, MaterialType materialId) internal view returns (uint256)
function setMaterial(Planet memory planet, MaterialType materialId, uint256 amount) internal pure
function initMaterial(Planet memory planet, MaterialType materialId) internal pure
function getMaterialCap(Planet memory planet, MaterialType materialId) internal pure returns (uint256)
```

### Growth Functions

```solidity
function _materialGrow(Planet memory planet, uint256 tickElapsed) internal view
function _materialGrowth(uint256 planetLevel) internal pure returns (uint256)
function allowedMaterialsForBiome(Biome biome) internal pure returns (MaterialType[] memory)
```

### Storage Functions

```solidity
function ReadFromStore(MaterialStorage memory mat, uint256 planetHash) internal view
function WriteToStore(MaterialStorage memory mat, uint256 planetHash) internal
function getMaterial(MaterialStorage memory mat, uint256 planetHash, MaterialType materialId) internal view returns (uint256)
function setMaterial(MaterialStorage memory mat, uint256 planetHash, MaterialType materialId, uint256 amount) internal pure
```

This materials system provides the foundation for resource management, crafting, and strategic gameplay in Dark Forest MUD.
