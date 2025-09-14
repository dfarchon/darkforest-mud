# Dark Forest MUD - Smart Contracts Documentation

## Overview

Dark Forest MUD is built on the MUD (Modular Universal Development) framework, which provides a comprehensive smart contract architecture for blockchain-based games. The system uses Solidity smart contracts with MUD's component-based state management, enabling efficient and modular game logic.

## Architecture

### MUD Framework Integration

The game uses MUD's world contract system with:

- **Component Tables**: State storage using MUD's table system
- **System Contracts**: Game logic implementation
- **Library Contracts**: Reusable utility functions
- **Enum Definitions**: Type-safe enumerations for game entities

### Contract Structure

```
packages/contracts/src/
├── systems/           # Main game logic systems
├── lib/              # Core libraries and utilities
├── libraries/        # Additional utility libraries
├── modules/          # Modular game components
├── tokens/           # NFT and token implementations
├── interfaces/       # Contract interfaces
└── codegen/          # Auto-generated MUD code
```

## MUD Configuration

### Enums

The game defines comprehensive enums for type safety:

```solidity
// Core game enums
PlanetStatus: ["DEFAULT", "DESTROYED"]
PlanetType: ["UNKNOWN", "PLANET", "ASTEROID_FIELD", "FOUNDRY", "SPACETIME_RIP", "QUASAR"]
SpaceType: ["UNKNOWN", "NEBULA", "SPACE", "DEEP_SPACE", "DEAD_SPACE"]
Biome: ["UNKNOWN", "OCEAN", "FOREST", "GRASSLAND", "TUNDRA", "SWAMP", "DESERT", "ICE", "WASTELAND", "LAVA", "CORRUPTED"]
MaterialType: ["UNKNOWN", "WATER_CRYSTALS", "LIVING_WOOD", "WINDSTEEL", "AURORIUM", "MYCELIUM", "SANDGLASS", "CRYOSTONE", "SCRAPIUM", "PYROSTEEL", "BLACKALLOY", "CORRUPTED_CRYSTAL"]
ArtifactStatus: ["DEFAULT", "COOLDOWN", "CHARGING", "READY", "ACTIVE", "BROKEN"]
ArtifactRarity: ["UNKNOWN", "COMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"]
GuildStatus: ["UNEXIST", "ACTIVE", "DISBANDED"]
GuildRole: ["NONE", "MEMBER", "OFFICER", "LEADER"]
SpaceshipType: ["UNKNOWN", "SCOUT", "FIGHTER", "DESTROYER", "CARRIER"]
```

## Core Systems

### 1. PlayerSystem

**Purpose**: Manages player registration and spawning

**Key Functions**:

```solidity
function registerPlayer(string memory name, address burner) public
function changePlayerName(string memory newName) public
function changeBurnerWallet(address newBurner) public
function spawnPlayer(Proof memory _proof, SpawnInput memory _input) public returns (uint256)
function initializePlayer(uint256[2] memory _a, uint256[2][2] memory _b, uint256[2] memory _c, uint256[9] memory _input) public returns (uint256)
```

**Features**:

- Player registration with unique names
- Burner wallet management
- Home planet spawning with cryptographic proofs
- Player limit enforcement
- Backward compatibility support

### 2. MoveSystem

**Purpose**: Handles planet-to-planet movement and combat with spaceship bonus integration

**Key Functions**:

```solidity
function move(Proof memory _proof, MoveInput memory _input, uint256 _population, uint256 _silver, uint256 _artifact, MaterialMove[] calldata _materials) public entryFee
function legacyMove(uint256[2] memory _a, uint256[2][2] memory _b, uint256[2] memory _c, uint256[11] memory _input, uint256 popMoved, uint256 silverMoved, uint256 movedArtifactId, uint256, bytes calldata movedMaterials) public
function _createAndDispatchMove(Planet memory fromPlanet, Planet memory toPlanet, uint256 distanceParam, uint256 pop, uint256 silv, uint256 artifactId, MaterialMove[] memory mats) private returns (Planet memory, Planet memory)
```

**Features**:

- Population, silver, artifact, and material movement
- Combat resolution between different owners
- Distance-based travel time calculation
- Effect system integration (before/after move)
- Space junk ownership validation
- Attack statistics tracking
- **Spaceship Bonus Integration**: Artifact bonuses applied before range validation
- **Extended Range Movement**: Allows movement to planets beyond base range with spaceship bonuses
- **Enhanced Combat**: Spaceship attack bonuses applied to combat calculations

### 3. ArtifactSystem

**Purpose**: Manages artifact lifecycle and operations

**Key Functions**:

```solidity
function registerArtifact(uint256 artifactId) public
function chargeArtifact(uint256 planetHash, uint256 artifactId, bytes memory data) public entryFee
function shutdownArtifact(uint256 planetHash, uint256 artifactId) public entryFee
function activateArtifact(uint256 planetHash, uint256 artifactId, bytes memory data) public entryFee
```

**Features**:

- Artifact registration and validation
- Charging system for artifact preparation
- Activation and deactivation mechanics
- Planet ownership validation
- Statistics tracking

**Implemented Artifact Types**:

- **Pink Bomb (Index 1)**: Offensive bomb launcher with planet destruction capability
- **Bloom Filter (Index 4)**: General utility that fills planet to population cap
- **Wormhole (Index 5)**: General utility that creates instant travel connections
- **Photoid Cannon (Index 6)**: Offensive weapon providing massive stat bonuses

### 4. FoundryCraftingSystem

**Purpose**: Handles spaceship crafting at foundry planets

**Key Functions**:

```solidity
function craftSpaceship(uint256 foundryHash, uint8 spaceshipType, MaterialType[] memory materials, uint256[] memory amounts, Biome biome) public entryFee
function getFoundryCraftingCount(uint256 foundryHash) public view returns (uint8 count, uint64 lastCraftTime)
function getCraftingMultiplier(uint256 foundryHash) public view returns (uint256 multiplier)
```

**Features**:

- Spaceship crafting with material requirements
- Crafting multiplier system (1.0x, 1.5x, 2.25x)
- Rarity calculation based on planet level
- Biome-based stat bonuses
- Crafting limit enforcement (max 3 per foundry)
- NFT integration for spaceship ownership

### 5. GuildSystem

**Purpose**: Manages guild operations and member management

**Key Functions**:

```solidity
function createGuild(string memory name) public payable
function inviteToGuild(address invitee) public
function acceptInvitation(uint8 guildId) public
function applyToGuild(uint8 guildId) public
function approveApplication(address player) public
function leaveGuild() public
function kickMember(address member) public
function setMemberRole(address member, GuildRole newRole) public
function transferOwnership(address newOwner) public
```

**Features**:

- Guild creation with fees
- Invitation and application systems
- Role-based permissions (Leader, Officer, Member)
- Leave cooldown mechanics
- Resource pooling (silver treasury)
- Delegation system for same-guild members
- Member limit enforcement

### 6. PlanetRevealSystem

**Purpose**: Handles planet location revelation

**Key Functions**:

```solidity
function revealLocation(Proof memory proof, RevealInput memory input) public entryFee
function legacyRevealLocation(uint256[2] memory _a, uint256[2][2] memory _b, uint256[2] memory _c, uint256[9] memory _input) public
```

**Features**:

- Cryptographic proof verification
- Cooldown enforcement for reveals
- Planet coordinate storage
- Backward compatibility support

### 7. PlanetUpgradeSystem

**Purpose**: Manages planet upgrades

**Key Functions**:

```solidity
function upgradePlanet(uint256 planetHash, uint256 rangeUpgrades, uint256 speedUpgrades, uint256 defenseUpgrades) public entryFee
function legacyUpgradePlanet(uint256 _location, uint256 _branch) public
```

**Features**:

- Multi-upgrade support (range, speed, defense)
- Fast upgrading capabilities
- Planet ownership validation
- Statistics tracking

## Core Libraries

### 1. Planet.sol

**Purpose**: Core planet logic and state management

**Key Functions**:

```solidity
function readFromStore(Planet memory planet) internal view
function writeToStore(Planet memory planet) internal
function _initPlanet(Planet memory planet) internal view
function _initSpaceType(Planet memory planet) internal view
function _initLevel(Planet memory planet) internal view
function _initPlanetType(Planet memory planet) internal view
function _initPopulationAndSilver(Planet memory planet) internal view
function _materialGrow(Planet memory planet, uint256 tickElapsed) internal view
function getMaterial(Planet memory planet, MaterialType materialId) internal view returns (uint256)
function setMaterial(Planet memory planet, MaterialType materialId, uint256 amount) internal pure
function initMaterial(Planet memory planet, MaterialType materialId) internal pure
```

**Features**:

- Planet initialization and configuration
- Material growth and management
- Space type and level determination
- Population and silver management
- Artifact storage management
- Effect system integration

### 2. Artifact.sol

**Purpose**: Artifact lifecycle and operations

**Key Functions**:

```solidity
function NewArtifact(uint256 seed, uint256 planetHash, uint256 planetLevel, SpaceType spaceType, uint256 biomebase) internal view returns (Artifact memory artifact)
function NewArtifactFromNFT(uint256 tokenId, uint256 planetHash, uint256 index, uint256 rarity, uint256 biome) internal pure returns (Artifact memory artifact)
function readFromStore(Artifact memory artifact, uint256 curTick) internal view
function writeToStore(Artifact memory artifact) internal
```

**Features**:

- Artifact creation and initialization
- Rarity calculation based on planet level
- Status management (charging, active, cooldown)
- NFT integration
- Metadata management

### 3. Material.sol

**Purpose**: Material storage and growth management

**Key Functions**:

```solidity
function ReadFromStore(MaterialStorage memory mat, uint256 planetHash) internal view
function WriteToStore(MaterialStorage memory mat, uint256 planetHash) internal
function getMaterial(MaterialStorage memory mat, uint256 planetHash, MaterialType materialId) internal view returns (uint256)
function setMaterial(MaterialStorage memory mat, uint256 planetHash, MaterialType materialId, uint256 amount) internal pure
function initMaterial(MaterialStorage memory mat, uint256 planetHash, MaterialType materialId) internal pure
```

**Features**:

- Material storage with bitmap optimization
- Growth status tracking
- Material cap management
- Efficient storage operations

### 4. Move.sol

**Purpose**: Movement and arrival logic with spaceship bonus integration

**Key Functions**:

```solidity
function NewMove(Planet memory from, address captain) internal pure returns (MoveData memory)
function loadPopulation(MoveData memory move, Planet memory from, uint256 pop, uint256 distance) internal pure returns (MoveData memory, Planet memory)
function loadSilver(MoveData memory move, Planet memory from, uint256 silv) internal pure returns (MoveData memory, Planet memory)
function loadArtifact(MoveData memory move, Planet memory from, uint256 artifactId) internal view returns (MoveData memory, Planet memory)
function loadMaterials(MoveData memory move, Planet memory from, MaterialMove[] memory mats) internal pure returns (MoveData memory, Planet memory)
function headTo(MoveData memory move, Planet memory to, uint256 distance, uint256 speed) internal returns (MoveData memory, Planet memory)
function arrivedAt(MoveData memory move, Planet memory planet) internal view returns (MoveData memory, Planet memory)
function _applySpaceshipBonuses(Planet memory planet, uint32 artifactId) internal view returns (Planet memory)
```

**Features**:

- Move creation and resource loading
- Distance-based travel time calculation
- Arrival processing and combat resolution
- Material movement support
- Artifact transfer management
- **Spaceship Bonus Application**: Applies spaceship bonuses to planet stats during movement
- **Range Validation**: Uses bonus-enhanced range for movement validation
- **Attack Enhancement**: Applies spaceship attack bonuses to combat calculations

## MUD Tables

### Core Game Tables

#### Player Management

```solidity
Player: {
  owner: "address",
  burner: "address",
  index: "uint32",
  createdAt: "uint64",
  name: "string"
}

SpawnPlanet: {
  player: "address",
  planet: "uint256"
}

PlayerWithdrawSilver: {
  player: "address",
  silver: "uint256"
}

PlayerWithdrawMaterial: {
  player: "address",
  materialType: "uint8",
  amount: "uint256"
}
```

#### Planet Management

```solidity
Planet: {
  id: "bytes32",
  lastUpdateTick: "uint64",
  population: "uint64",
  silver: "uint64",
  upgrades: "uint24",
  useProps: "bool"
}

PlanetConstants: {
  id: "bytes32",
  perlin: "uint8",
  level: "uint8",
  planetType: "PlanetType",
  spaceType: "SpaceType"
}

PlanetProps: {
  id: "bytes32",
  range: "uint32",
  speed: "uint16",
  defense: "uint16",
  populationCap: "uint64",
  populationGrowth: "uint32",
  silverCap: "uint64",
  silverGrowth: "uint32"
}

PlanetOwner: "address"
PlanetFlags: {
  id: "bytes32",
  flags: "uint256"
}
```

#### Artifact Management

```solidity
Artifact: {
  id: "uint32",
  artifactIndex: "uint8",
  rarity: "ArtifactRarity",
  biome: "Biome",
  status: "ArtifactStatus",
  chargeTick: "uint64",
  activateTick: "uint64",
  cooldownTick: "uint64"
}

ArtifactOwner: {
  artifact: "uint32",
  planet: "bytes32"
}

PlanetArtifact: {
  id: "bytes32",
  artifacts: "uint256"
}

CraftedSpaceship: {
  artifactId: "uint32",
  spaceshipType: "uint8",
  biome: "Biome",
  rarity: "ArtifactRarity",
  craftedAt: "uint64",
  nftTokenId: "uint256",
  crafter: "address"
}

SpaceshipBonus: {
  artifactId: "uint32",
  attackBonus: "uint16",
  defenseBonus: "uint16",
  speedBonus: "uint16",
  rangeBonus: "uint16"
}
```

#### Material Management

```solidity
PlanetMaterialStorage: {
  planetId: "bytes32",
  exsitMap: "uint256"
}

PlanetMaterial: {
  planetId: "bytes32",
  resourceId: "uint8",
  amount: "uint256"
}

PlanetMaterialGrowth: {
  planetId: "bytes32",
  resourceId: "uint8",
  growth: "bool"
}

MoveMaterial: {
  moveId: "uint64",
  resourceId: "uint8",
  amount: "uint256"
}
```

#### Movement System

```solidity
Move: {
  to: "bytes32",
  index: "uint8",
  from: "bytes32",
  id: "uint64",
  captain: "address",
  departureTick: "uint64",
  arrivalTick: "uint64",
  population: "uint64",
  silver: "uint64",
  artifact: "uint256"
}

PendingMove: {
  to: "bytes32",
  head: "uint8",
  number: "uint8",
  indexes: "uint240"
}
```

#### Guild System

```solidity
Guild: {
  id: "uint8",
  status: "GuildStatus",
  rank: "uint8",
  number: "uint8",
  registry: "uint16",
  owner: "uint24",
  silver: "uint256"
}

GuildName: {
  id: "uint8",
  name: "string"
}

GuildMember: {
  memberId: "uint24",
  role: "GuildRole",
  grant: "GuildRole",
  joinedAt: "uint64",
  leftAt: "uint64",
  kicked: "bool",
  addr: "address"
}

GuildHistory: {
  player: "address",
  curMemberId: "uint24",
  memberIds: "uint24[]"
}

GuildCandidate: {
  player: "address",
  invitations: "uint8[]",
  applications: "uint8[]"
}
```

#### Configuration Tables

```solidity
UniverseConfig: {
  sparsity: "uint64",
  radius: "uint64"
}

SpaceTypeConfig: {
  perlinThresholds: "uint32[]",
  planetLevelLimits: "uint8[]",
  planetLevelBonus: "int8[]"
}

UniverseZoneConfig: {
  borders: "uint64[]",
  planetLevelLimits: "uint8[]",
  planetLevelBonus: "int8[]"
}

PlanetLevelConfig: {
  thresholds: "uint32[]"
}

PlanetBiomeConfig: {
  threshold1: "uint32",
  threshold2: "uint32"
}

PlanetTypeConfig: {
  spaceType: "SpaceType",
  level: "uint8",
  thresholds: "uint16[]"
}

UpgradeConfig: {
  populationCapMultiplier: "uint8",
  populationGrowthMultiplier: "uint8",
  rangeMultiplier: "uint8",
  speedMultiplier: "uint8",
  defenseMultiplier: "uint8",
  maxSingleLevel: "uint8",
  maxTotalLevel: "uint32",
  silverCost: "uint80"
}
```

#### Statistics Tables

```solidity
GlobalStats: {
  registerPlayerCount: "uint256",
  spawnPlayerCount: "uint256",
  createGuildCount: "uint256",
  prospectPlanetCount: "uint256",
  findArtifactCount: "uint256",
  withdrawArtifactCount: "uint256",
  depositArtifactCount: "uint256",
  chargeArtifactCount: "uint256",
  shutdownArtifactCount: "uint256",
  activateArtifactCount: "uint256",
  buyGPTTokensCount: "uint256",
  spendGPTTokensCount: "uint256",
  sendGPTTokensCount: "uint256",
  moveCount: "uint256",
  attackCount: "uint256",
  setPlanetEmojiCount: "uint256",
  addJunkCount: "uint256",
  clearJunkCount: "uint256",
  revealLocationCount: "uint256",
  upgradePlanetCount: "uint256",
  withdrawSilverCount: "uint256",
  withdrawMaterialCount: "uint256",
  craftSpaceshipCount: "uint256"
}

PlayerStats: {
  player: "address",
  prospectPlanetCount: "uint256",
  findArtifactCount: "uint256",
  withdrawArtifactCount: "uint256",
  depositArtifactCount: "uint256",
  chargeArtifactCount: "uint256",
  shutdownArtifactCount: "uint256",
  activateArtifactCount: "uint256",
  buyGPTTokensCount: "uint256",
  spendGPTTokensCount: "uint256",
  sendGPTTokensCount: "uint256",
  moveCount: "uint256",
  attackCount: "uint256",
  setPlanetEmojiCount: "uint256",
  addJunkCount: "uint256",
  clearJunkCount: "uint256",
  revealLocationCount: "uint256",
  upgradePlanetCount: "uint256",
  withdrawSilverCount: "uint256",
  withdrawMaterialCount: "uint256",
  craftSpaceshipCount: "uint256"
}
```

## System Access Control

### Open Access Systems

- **InitializeSystem**: System initialization
- **TestOnlySystem**: Testing functions
- **PlanetWriteSystem**: Planet state updates
- **DfDelegationControlSystem**: Delegation management

### Restricted Systems

- **FoundryCraftingSystem**: Spaceship crafting
- **MaterialUpgradeSystem**: Material upgrades
- **GuildSystem**: Guild operations
- **ArtifactSystem**: Artifact management

### Excluded Systems

- **BaseSystem**: Base system functionality
- **ArtifactProxySystem**: Artifact proxy operations
- **CannonSystem**: Cannon mechanics
- **WormholeSystem**: Wormhole mechanics
- **BloomFilterSystem**: Bloom filter mechanics
- **PinkBombSystem**: Pink bomb mechanics

## Artifact Proxy Systems

The game implements specialized artifact systems that extend the base ArtifactProxySystem:

### 1. PinkBombSystem

- **Artifact Index**: 1
- **Purpose**: Handles pink bomb artifact activation and planet destruction
- **Key Features**:
  - Bomb launching with cryptographic proof verification
  - Population cost calculation based on distance
  - Destroy window management (300 ticks)
  - Blast radius based on artifact rarity
  - Planet destruction mechanics

### 2. BloomFilterSystem

- **Artifact Index**: 4
- **Purpose**: Handles bloom filter artifact activation
- **Key Features**:
  - Instant population cap restoration
  - No charge or cooldown requirements
  - Simple activation mechanics

### 3. WormholeSystem

- **Artifact Index**: 5
- **Purpose**: Handles wormhole artifact activation and distance manipulation
- **Key Features**:
  - Distance multiplier management
  - Bidirectional connection creation
  - Same-owner validation
  - Rarity-based multiplier effects

### 4. CannonSystem

- **Artifact Index**: 6
- **Purpose**: Handles photoid cannon artifact activation
- **Key Features**:
  - One cannon per planet limitation
  - Rarity-based stat bonuses
  - Before/after move effect management
  - Non-reusable artifact mechanics

## Entry Fee System

Most systems implement an entry fee mechanism:

```solidity
modifier entryFee {
  // Entry fee validation logic
}
```

## Modifiers

### Common Modifiers

```solidity
modifier requireSameOwnerAndJunkOwner(uint256 planetHash) {
  // Validates planet ownership and junk ownership
}

modifier requireOwner() {
  // Validates system owner access
}
```

## Error Handling

### Custom Errors

```solidity
error PlanetAlreadyOwned();
error GuildIdOverflow();
error GuildRoleUnexpected();
error GuildNotActive();
error GuildNotInvited();
error GuildNotApplied();
error GuildHasMembers();
error GuildLeaveCooldownNotExpired();
error GuildMemberLimitReached();
error NeedFundsToCreateGuild();
```

## Gas Optimization

### Storage Optimization

- **Bitmap Storage**: Efficient material existence tracking
- **Packed Structs**: Optimized data layout
- **Batch Operations**: Grouped state updates
- **Lazy Loading**: On-demand data reading

### Computation Optimization

- **View Functions**: Gas-free read operations
- **Pure Functions**: No state access
- **Efficient Loops**: Optimized iteration patterns
- **Early Returns**: Reduced computation paths

## Security Features

### Access Control

- **Owner-only Functions**: Restricted system access
- **Role-based Permissions**: Guild hierarchy enforcement
- **Ownership Validation**: Planet and artifact ownership checks

### Validation

- **Input Validation**: Parameter range checking
- **State Validation**: Game rule enforcement
- **Proof Verification**: Cryptographic validation

### Reentrancy Protection

- **State Updates**: Atomic operations
- **External Calls**: Controlled interactions
- **Resource Management**: Safe resource handling

## Integration Points

### MUD Framework

- **Component System**: State management
- **System Registry**: Contract registration
- **Event System**: Real-time updates
- **Access Control**: Permission management

### External Contracts

- **ArtifactNFT**: NFT integration
- **World Contract**: MUD world interface
- **Balance Management**: ETH and token handling

## Future Enhancements

### Planned Features

- **Advanced Artifact System**: More artifact types
- **Enhanced Guild Features**: Guild wars and territories
- **Material Trading**: Player-to-player trading
- **Advanced Crafting**: Complex recipes

### Technical Improvements

- **Gas Optimization**: Further efficiency improvements
- **Scalability**: Layer 2 integration
- **Security**: Enhanced validation
- **Performance**: Optimized operations

This comprehensive contract system provides a robust foundation for the Dark Forest MUD game, with modular architecture, efficient state management, and secure operations.
