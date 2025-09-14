# Guild System Documentation

## Overview

The Dark Forest MUD game features a comprehensive guild system that allows players to form alliances, share resources, and coordinate strategic gameplay. Guilds provide social features, resource pooling, and delegation mechanics for enhanced cooperative play.

## Guild Structure

### Guild Status

Guilds can exist in different states:

- **UNEXIST** (Status 0): Guild does not exist
- **ACTIVE** (Status 1): Guild is active and operational
- **DISBANDED** (Status 2): Guild has been disbanded

### Guild Roles

The guild system implements a hierarchical role structure:

#### Leader (Role 3)

- **Permissions**: Full control over guild operations
- **Abilities**:
  - Create and disband guild
  - Transfer ownership to another member
  - Set member roles (promote to Officer)
  - Kick members
  - Manage guild settings
  - Access all guild resources

#### Officer (Role 2)

- **Permissions**: Administrative privileges
- **Abilities**:
  - Invite new members
  - Approve applications
  - Manage member roles (except Leader)
  - Access guild resources
  - Cannot kick members or transfer ownership

#### Member (Role 1)

- **Permissions**: Basic guild participation
- **Abilities**:
  - Apply to other guilds
  - Leave guild
  - Access guild resources
  - Cannot invite or manage other members

#### None (Role 0)

- **Permissions**: No guild affiliation
- **Abilities**:
  - Create new guild
  - Apply to existing guilds
  - Accept invitations

## Guild Creation

### Requirements

- **Registration**: Player must be registered in the game
- **No Current Guild**: Player cannot be in another guild
- **Creation Fee**: Must pay the required creation fee
- **Unique Name**: Guild name must be unique

### Creation Process

1. **Payment**: Player pays the creation fee
2. **Guild ID Assignment**: System assigns unique guild ID (1-255)
3. **Owner Setup**: Creator becomes the guild leader
4. **Initial Resources**: Player's silver is added to guild treasury
5. **Member Registration**: Creator is added as first member

### Guild Data Structure

```solidity
struct GuildData {
  status: GuildStatus;
  rank: uint8;
  number: uint8;        // Current member count
  registry: uint8;      // Next member ID
  owner: uint24;        // Owner member ID
  silver: uint256;      // Guild treasury
}
```

## Guild Membership

### Member Data Structure

```solidity
struct GuildMemberData {
  role: GuildRole;
  grant: GuildRole;     // Permission level for delegation
  joinedAt: uint64;     // Join timestamp
  leftAt: uint64;       // Leave timestamp
  kicked: bool;         // Whether member was kicked
  addr: address;        // Member's address
}
```

### Member ID System

- **Format**: `(guildId << 16) | memberId`
- **Guild ID**: Upper 8 bits (1-255)
- **Member ID**: Lower 16 bits (1-65535)
- **Owner ID**: Always member ID 1

## Guild Invitations

### Invitation System

- **Who Can Invite**: Officers and Leaders
- **Invitation Process**:
  1. Officer/Leader sends invitation to player address
  2. Invitation is stored in player's candidate record
  3. Player can accept invitation to join guild
  4. Invitation is cleared upon acceptance or rejection

### Invitation Requirements

- **Inviter**: Must be Officer or Leader
- **Invitee**: Must be registered and not in another guild
- **Guild Status**: Guild must be active
- **Member Limit**: Guild must not be at capacity

## Guild Applications

### Application System

- **Who Can Apply**: Any registered player not in a guild
- **Application Process**:
  1. Player applies to specific guild
  2. Application is stored in player's candidate record
  3. Guild Officers/Leaders can approve applications
  4. Application is cleared upon approval or rejection

### Application Requirements

- **Applicant**: Must be registered and not in another guild
- **Guild Status**: Guild must be active
- **Cooldown**: Must not be on leave cooldown
- **Member Limit**: Guild must not be at capacity

## Guild Leave System

### Leave Mechanics

- **Voluntary Leave**: Members can leave guild at any time
- **Resource Transfer**: Member's silver is removed from guild treasury
- **Member Count**: Guild member count is decremented
- **History Tracking**: Leave timestamp is recorded

### Leave Cooldown

- **Cooldown Period**: Configurable cooldown after leaving guild
- **Cooldown Bypass**: No cooldown if member was kicked
- **Cooldown Check**: Applied when joining new guild or applying

### Cooldown Calculation

```solidity
function _checkGuildLeaveCooldown(address player) internal view {
  uint64 lastLeaveTick = _getLastGuildLeaveTick(player);
  if (lastLeaveTick == 0) return;
  bool kicked = _getLastGuildIfKicked(player);
  if (kicked) return;

  uint64 currentTick = uint64(DFUtils.getCurrentTick());
  if (currentTick - lastLeaveTick < GuildConfig.getCooldownTicks()) {
    revert GuildLeaveCooldownNotExpired();
  }
}
```

## Guild Management

### Member Management

#### Role Assignment

- **Who Can Assign**: Only Leaders
- **Role Restrictions**: Cannot assign Leader or None roles
- **Target Restrictions**: Cannot change Leader's role

#### Member Kicking

- **Who Can Kick**: Leaders and Officers
- **Kick Process**:
  1. Member is marked as kicked
  2. Member's silver is removed from guild treasury
  3. Member count is decremented
  4. Member is removed from active membership

### Ownership Transfer

- **Who Can Transfer**: Only current Leader
- **Transfer Process**:
  1. Leader transfers ownership to another member
  2. New owner becomes Leader
  3. Previous leader becomes Member
  4. Guild data is updated

### Guild Disbanding

- **Who Can Disband**: Only Leader
- **Disband Requirements**: Guild must have no other members
- **Disband Process**:
  1. Guild status is set to DISBANDED
  2. All member records are cleared
  3. Guild resources are distributed

## Guild Resources

### Silver Pooling

- **Joining**: Member's silver is added to guild treasury
- **Leaving**: Member's silver is removed from guild treasury
- **Kicking**: Member's silver is removed from guild treasury
- **Guild Treasury**: Shared pool of silver for guild operations

### Resource Management

- **Access Control**: Role-based access to guild resources
- **Resource Tracking**: All resource movements are logged
- **Resource Limits**: Guilds may have resource capacity limits

## Guild Delegation System

### Delegation Mechanics

- **Grant System**: Members can set permission levels for delegation
- **Delegation Conditions**: Delegates must meet grant requirements
- **Same Guild Requirement**: Delegation only works within same guild

### Permission Levels

- **Grant Setting**: Members can set minimum role requirement for delegation
- **Delegation Check**: System verifies delegate meets grant requirements
- **Role Hierarchy**: Higher roles can delegate to lower roles

### Delegation Functions

```solidity
function meetGrantRequirement(address grantor, address grantee) internal view returns (bool) {
  if (grantor == grantee) return true;

  // Check if they are in the same guild
  if (!inSameGuildNow(grantor, grantee)) {
    return false;
  }

  // Get member data and check grant requirements
  GuildMemberData memory grantorData = GuildMember.get(grantorMemberId);
  GuildMemberData memory granteeData = GuildMember.get(granteeMemberId);

  if (grantorData.grant == GuildRole.NONE) return false;

  return uint8(grantorData.grant) <= uint8(granteeData.role);
}
```

## Guild Configuration

### Configurable Parameters

- **Max Members**: Maximum number of members per guild
- **Creation Fee**: Cost to create a new guild
- **Cooldown Ticks**: Leave cooldown period in game ticks
- **Member Limits**: Various limits and restrictions

### Configuration Management

- **System Owner**: Only system owner can modify configuration
- **Configuration Storage**: Stored in GuildConfig table
- **Real-time Updates**: Configuration changes apply immediately

## Guild History

### Member History

- **Join Tracking**: All join events are recorded
- **Leave Tracking**: All leave events are recorded
- **Role Changes**: Role changes are tracked
- **Guild Transitions**: Member's guild history is maintained

### History Data Structure

```solidity
struct GuildHistory {
  curMemberId: uint24;      // Current member ID
  memberIds: uint24[];      // All member IDs in history
}
```

## Technical Implementation

### Smart Contract Structure

- **GuildSystem.sol**: Main guild management contract
- **GuildUtils.sol**: Utility functions for guild operations
- **MUD Integration**: Uses MUD framework for state management

### Data Tables

- **Guild**: Core guild data
- **GuildMember**: Member information
- **GuildHistory**: Member history tracking
- **GuildCandidate**: Invitations and applications
- **GuildConfig**: Configuration parameters

### Client Integration

- **Real-time Updates**: Guild state updates in real-time
- **UI Components**: Guild management interface
- **Event Handling**: Guild events trigger UI updates

## Guild Economics

### Resource Pooling

- **Silver Sharing**: Members contribute silver to guild treasury
- **Resource Distribution**: Guild resources can be shared among members
- **Economic Benefits**: Guilds provide economic advantages

### Strategic Advantages

- **Coordination**: Guilds enable coordinated gameplay
- **Resource Sharing**: Shared resources for common goals
- **Delegation**: Members can act on behalf of others

## Artifact Integration

### Guild Artifact Coordination

Guilds can coordinate artifact usage for strategic advantage:

#### Artifact Sharing

- **Same-Guild Delegation**: Guild members can activate artifacts on each other's planets
- **Strategic Coordination**: Guilds can plan artifact activation timing
- **Resource Pooling**: Guilds can share resources for artifact activation
- **Defensive Coordination**: Guilds can coordinate defensive artifacts

#### Artifact Effects on Guilds

Activated artifacts can affect guild operations:

- **Wormhole Networks**: Guilds can create instant travel networks
- **Defensive Systems**: Guilds can deploy defensive artifacts
- **Offensive Capabilities**: Guilds can coordinate offensive artifacts
- **Resource Enhancement**: Guilds can boost resource production

### Guild Spaceship Crafting

Guilds can coordinate spaceship crafting efforts:

- **Foundry Sharing**: Guild members can use each other's foundries
- **Material Pooling**: Guilds can share materials for crafting
- **Crafting Coordination**: Guilds can plan spaceship production
- **Strategic Deployment**: Guilds can coordinate spaceship deployment

## Future Enhancements

### Planned Features

- **Guild Wars**: Inter-guild conflict system
- **Guild Quests**: Cooperative quest system
- **Guild Territories**: Guild-controlled areas
- **Advanced Delegation**: More sophisticated delegation mechanics

### Technical Improvements

- **Gas Optimization**: Efficient guild operations
- **Enhanced UI**: Better guild management interface
- **Mobile Support**: Guild features on mobile devices
- **Analytics**: Guild performance tracking

## API Reference

### Guild Functions

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

### Utility Functions

```solidity
function getCurrentGuildId(address player) internal view returns (uint8)
function inSameGuildNow(address player1, address player2) internal view returns (bool)
function meetGrantRequirement(address grantor, address grantee) internal view returns (bool)
function checkGuildLeaveCooldown(address player) internal view
```

This guild system provides the foundation for cooperative gameplay, resource sharing, and strategic coordination in Dark Forest MUD.
