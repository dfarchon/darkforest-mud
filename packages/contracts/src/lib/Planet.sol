// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { Errors } from "../interfaces/errors.sol";
import { PlanetType, SpaceType, Biome } from "../codegen/common.sol";
import { Planet as PlanetTable, PlanetData, PlanetMetadata, PlanetMetadataData } from "../codegen/index.sol";
import { PlanetOwner, PlanetConstants, PlanetConstantsData, PlanetProps, PlanetPropsData } from "../codegen/index.sol";
import { UniverseConfig, UniverseZoneConfig, PlanetLevelConfig } from "../codegen/index.sol";
import { SpaceTypeConfig, PlanetTypeConfig, SpaceTypeConfig } from "../codegen/index.sol";
import { PlanetInitialResource, PlanetInitialResourceData, Ticker } from "../codegen/index.sol";
import { PendingMoveData, MoveData } from "../codegen/index.sol";
import { UpgradeConfig, UpgradeConfigData } from "../codegen/index.sol";
import { ProspectedPlanet, ExploredPlanet } from "../codegen/index.sol";
import { PlanetBiomeConfig, PlanetBiomeConfigData } from "../codegen/index.sol";
import { ABDKMath64x64 } from "abdk-libraries-solidity/ABDKMath64x64.sol";
import { PendingMoveQueue } from "./Move.sol";
import { Artifact, ArtifactLib, ArtifactStorage, ArtifactStorageLib } from "./Artifact.sol";

using PlanetLib for Planet global;

struct Planet {
  uint256 planetHash;
  uint256 distSquare; // only for toPlanet in a move
  uint256 universeZone; // only for newly initialized toPlanet in a move
  // Table: PlanetOwner
  bool ownerChanged;
  address owner;
  // Table: PlanetConstants
  bool isInitialized;
  uint256 perlin;
  uint256 level;
  PlanetType planetType;
  SpaceType spaceType;
  // Table: Planet
  uint256 lastUpdateTick;
  uint256 population;
  uint256 silver;
  uint256 rangeUpgrades;
  uint256 speedUpgrades;
  uint256 defenseUpgrades;
  bool useProps;
  // Table: PlanetProps / PlanetMetadata
  bool updateProps;
  uint256 range;
  uint256 speed;
  uint256 defense;
  uint256 populationCap;
  uint256 populationGrowth;
  uint256 silverCap;
  uint256 silverGrowth;
  // move queue
  PendingMoveQueue moveQueue;
  // artifact storage
  ArtifactStorage artifactStorage;
}

library PlanetLib {
  function readFromStore(Planet memory planet) internal view {
    if (PlanetConstants.getPlanetType(bytes32(planet.planetHash)) == PlanetType.UNKNOWN) {
      _validateHash(planet);
      _initPlanet(planet);
    } else {
      _readPlanetData(planet);
      _readConstants(planet);
    }

    planet.artifactStorage.ReadFromStore(planet.planetHash);
    planet.moveQueue.ReadFromStore(planet.planetHash);

    _readPropsOrMetadata(planet);
  }

  function writeToStore(Planet memory planet) internal {
    if (planet.isInitialized) {
      PlanetConstants.set(
        bytes32(planet.planetHash),
        PlanetConstantsData({
          perlin: uint8(planet.perlin),
          level: uint8(planet.level),
          planetType: planet.planetType,
          spaceType: planet.spaceType
        })
      );
    }
    if (planet.ownerChanged) {
      PlanetOwner.set(bytes32(planet.planetHash), planet.owner);
    }
    if (planet.updateProps) {
      PlanetProps.set(
        bytes32(planet.planetHash),
        PlanetPropsData({
          range: uint32(planet.range),
          speed: uint16(planet.speed),
          defense: uint16(planet.defense),
          populationCap: uint64(planet.populationCap),
          populationGrowth: uint32(planet.populationGrowth),
          silverCap: uint64(planet.silverCap),
          silverGrowth: uint32(planet.silverGrowth)
        })
      );
    }
    planet.moveQueue.WriteToStore();
    planet.artifactStorage.WriteToStore();
    PlanetTable.set(
      bytes32(planet.planetHash),
      PlanetData({
        lastUpdateTick: uint64(planet.lastUpdateTick),
        population: uint64(planet.population),
        silver: uint64(planet.silver),
        upgrades: uint24((planet.rangeUpgrades << 16) | (planet.speedUpgrades << 8) | planet.defenseUpgrades),
        useProps: planet.useProps
      })
    );
  }

  function naturalGrowth(Planet memory planet, uint256 untilTick) internal pure {
    if (planet.lastUpdateTick >= untilTick) {
      return;
    }
    uint256 tickElapsed = untilTick - planet.lastUpdateTick;
    planet.lastUpdateTick = untilTick;
    if (planet.owner == address(0)) {
      return;
    }
    _populationGrow(planet, tickElapsed);
    _silverGrow(planet, tickElapsed);
  }

  function pushMove(Planet memory planet, MoveData memory move) internal {
    planet.moveQueue.PushMove(move);
  }

  function popArrivedMove(Planet memory planet, uint256 untilTick) internal view returns (MoveData memory move) {
    return planet.moveQueue.PopArrivedMove(untilTick);
  }

  function hasArtifactSlot(Planet memory planet) internal view returns (bool) {
    return
      planet.artifactStorage.GetNumber() + planet.moveQueue.GetFlyingArtifactsNum() <
      ArtifactStorageLib.MAX_ARTIFACTS_PER_PLANET;
  }

  function pushArtifact(Planet memory planet, uint256 artifact) internal pure {
    planet.artifactStorage.Push(artifact);
  }

  function removeArtifact(Planet memory planet, uint256 artifact) internal view {
    planet.artifactStorage.Remove(artifact);
  }

  function chargeArtifact(Planet memory planet, uint256 artifactId, address executor) internal {
    Artifact memory artifact = planet.mustGetArtifact(artifactId);
    _validateChargeArtifact(planet, artifact, executor);
    artifact.charging(planet.lastUpdateTick);
    artifact.writeToStore();
  }

  function activateArtifact(Planet memory planet, uint256 artifactId, address executor) internal {
    Artifact memory artifact = planet.mustGetArtifact(artifactId);
    _validateActivateArtifact(planet, artifact, executor);
    planet.population -= artifact.reqPopulation;
    planet.silver -= artifact.reqSilver;
    artifact.activate(planet.lastUpdateTick);
    artifact.writeToStore();
    _applyArtifactEffect(planet, artifact);
  }

  function deactivateArtifact(Planet memory planet, uint256 artifactId, address executor) internal {
    if (planet.owner != executor) {
      revert Errors.NotPlanetOwner();
    }
    Artifact memory artifact = planet.mustGetArtifact(artifactId);
    artifact.deactivate(planet.lastUpdateTick);
    artifact.writeToStore();
    _removeArtifactEffect(planet, artifact);
  }

  function changeOwner(Planet memory planet, address newOwner) internal pure {
    planet.owner = newOwner;
    planet.ownerChanged = true;
  }

  function upgrade(
    Planet memory planet,
    address executor,
    uint256 rangeUpgrades,
    uint256 speedUpgrades,
    uint256 defenseUpgrades
  ) internal view {
    _validateUpgrade(planet, executor, rangeUpgrades, speedUpgrades, defenseUpgrades);
    uint256 silverCost = _calUpgradeCost(planet, rangeUpgrades, speedUpgrades, defenseUpgrades);
    if (planet.silver < silverCost) {
      revert Errors.NotEnoughSilverToUpgrade();
    }
    planet.rangeUpgrades += rangeUpgrades;
    planet.speedUpgrades += speedUpgrades;
    planet.defenseUpgrades += defenseUpgrades;
    planet.silver -= silverCost;
    _activateUpgrades(planet, rangeUpgrades, speedUpgrades, defenseUpgrades);
  }

  function prospect(Planet memory planet, address executor) internal {
    _validateProspect(planet, executor);
    ProspectedPlanet.set(bytes32(planet.planetHash), uint64(block.number));
  }

  function findArtifact(Planet memory planet, address executor) internal returns (Artifact memory artifact) {
    _validateFindingArtifact(planet, executor);
    artifact = ArtifactLib.NewArtifact(_createArtifactSeed(planet), planet.planetHash, planet.level);
    if (planet.hasArtifactSlot()) {
      planet.pushArtifact(artifact.id);
    } else {
      revert Errors.ArtifactStorageFull();
    }
    ExploredPlanet.set(bytes32(planet.planetHash), true);
  }

  function mustGetArtifact(Planet memory planet, uint256 artifactId) internal view returns (Artifact memory artifact) {
    if (planet.artifactStorage.Has(artifactId)) {
      artifact.planetHash = planet.planetHash;
      artifact.id = artifactId;
      artifact.readFromStore();
    } else {
      revert Errors.ArtifactNotOnPlanet();
    }
  }

  function _validateHash(Planet memory planet) internal view {
    if (
      planet.planetHash >=
      (21888242871839275222246405745257275088548364400416034343698204186575808495617 / UniverseConfig.getSparsity())
    ) {
      revert Errors.InvalidPlanetHash();
    }
  }

  function _initPlanet(Planet memory planet) internal view {
    planet.isInitialized = true;
    _initZone(planet);
    _initSpaceType(planet);
    _initLevel(planet);
    _initPlanetType(planet);
    _initPopulationAndSilver(planet);
    planet.lastUpdateTick = Ticker.getTickNumber();
  }

  function _initSpaceType(Planet memory planet) internal view {
    uint32[] memory thresholds = SpaceTypeConfig.getPerlinThresholds();
    uint256 perlin = planet.perlin;
    uint256 length = thresholds.length;
    // if a planet locates at the last second zone, its space type is NEBULA
    if (planet.universeZone + 1 == UniverseZoneConfig.lengthBorders()) {
      planet.spaceType = SpaceType.NEBULA;
      return;
    }
    for (uint256 i; i < length; ) {
      if (perlin < thresholds[i]) {
        planet.spaceType = SpaceType(i + 1);
        return;
      }
      unchecked {
        ++i;
      }
    }
    planet.spaceType = SpaceType(length + 1);
  }

  function _initZone(Planet memory planet) internal view {
    uint64[] memory borders = UniverseZoneConfig.getBorders();
    uint256 distanceSquare = planet.distSquare;
    uint256 maxZone = borders.length;
    for (uint256 i; i < maxZone; ) {
      if (distanceSquare < borders[i] ** 2) {
        planet.universeZone = i;
        return;
      }
      unchecked {
        ++i;
      }
    }
    planet.universeZone = maxZone;
  }

  function _initLevel(Planet memory planet) internal view {
    uint256 value = uint24(planet.planetHash);
    uint32[] memory thresholds = PlanetLevelConfig.getThresholds();
    uint256 maxLvl = thresholds.length;
    for (uint256 i; i < maxLvl; ) {
      if (value < thresholds[i]) {
        planet.level = maxLvl - i;
        break;
      }
      unchecked {
        ++i;
      }
    }
    _bounceAndBoundLevel(planet);
  }

  function _bounceAndBoundLevel(Planet memory planet) internal view {
    // bounce level
    int256 level = int256(planet.level) + SpaceTypeConfig.getPlanetLevelBonus()[uint8(planet.spaceType) - 1];
    level += UniverseZoneConfig.getPlanetLevelBonus()[uint8(planet.universeZone)];

    // bound level
    if (level < 0) {
      planet.level = 0;
      return;
    }
    uint256 posLevel = uint256(level);
    uint256 limit = SpaceTypeConfig.getPlanetLevelLimits()[uint8(planet.spaceType) - 1];
    if (posLevel > limit) {
      posLevel = limit;
    }
    limit = UniverseZoneConfig.getPlanetLevelLimits()[uint8(planet.universeZone)];
    if (posLevel > limit) {
      posLevel = limit;
    }
    planet.level = posLevel;
  }

  function _initPlanetType(Planet memory planet) internal view {
    uint256 value = uint8(planet.planetHash >> 24);
    uint16[] memory thresholds = PlanetTypeConfig.getThresholds(planet.spaceType, uint8(planet.level));
    uint256 length = thresholds.length;
    uint256 cumulativeThreshold;
    for (uint256 i; i < length; ) {
      cumulativeThreshold += thresholds[i];
      if (value < cumulativeThreshold) {
        planet.planetType = PlanetType(i + 1);
        return;
      }
      unchecked {
        ++i;
      }
    }
    revert Errors.UnknownPlanetType();
  }

  function _initPopulationAndSilver(Planet memory planet) internal view {
    PlanetInitialResourceData memory initialResources = PlanetInitialResource.get(
      planet.spaceType,
      planet.planetType,
      uint8(planet.level)
    );
    planet.population = initialResources.population;
    planet.silver = initialResources.silver;
  }

  function _readPlanetData(Planet memory planet) internal view {
    planet.owner = PlanetOwner.get(bytes32(planet.planetHash));
    PlanetData memory data = PlanetTable.get(bytes32(planet.planetHash));
    planet.lastUpdateTick = data.lastUpdateTick;
    planet.population = data.population;
    planet.silver = data.silver;
    uint256 upgrades = data.upgrades;
    planet.rangeUpgrades = uint8(upgrades >> 16);
    planet.speedUpgrades = uint8(upgrades >> 8);
    planet.defenseUpgrades = uint8(upgrades);
    planet.useProps = data.useProps;
  }

  function _readConstants(Planet memory planet) internal view {
    PlanetConstantsData memory constants = PlanetConstants.get(bytes32(planet.planetHash));
    planet.perlin = constants.perlin;
    planet.level = constants.level;
    planet.planetType = constants.planetType;
    planet.spaceType = constants.spaceType;
  }

  function _readPropsOrMetadata(Planet memory planet) internal view {
    if (planet.useProps) {
      _readProps(planet);
    } else {
      _readMetadata(planet);
      _luckilyDouble(planet);
      _activateUpgrades(planet, planet.rangeUpgrades, planet.speedUpgrades, planet.defenseUpgrades);
    }
  }

  function _readProps(Planet memory planet) internal view {
    PlanetPropsData memory props = PlanetProps.get(bytes32(planet.planetHash));
    planet.range = props.range;
    planet.speed = props.speed;
    planet.defense = props.defense;
    planet.populationCap = props.populationCap;
    planet.populationGrowth = props.populationGrowth;
    planet.silverCap = props.silverCap;
    planet.silverGrowth = props.silverGrowth;
  }

  function _readMetadata(Planet memory planet) internal view {
    PlanetMetadataData memory metadata = PlanetMetadata.get(planet.spaceType, planet.planetType, uint8(planet.level));
    planet.range = metadata.range;
    planet.speed = metadata.speed;
    planet.defense = metadata.defense;
    planet.populationCap = metadata.populationCap;
    planet.populationGrowth = metadata.populationGrowth;
    planet.silverCap = metadata.silverCap;
    planet.silverGrowth = metadata.silverGrowth;
  }

  function _luckilyDouble(Planet memory planet) internal pure {
    uint256 value = planet.planetHash >> 32;
    if (uint8(value) < 16) {
      planet.populationCap *= 2;
    }
    value >>= 8;
    if (uint8(value) < 16) {
      planet.populationGrowth *= 2;
    }
    value >>= 8;
    if (uint8(value) < 16) {
      planet.range *= 2;
    }
    value >>= 8;
    if (uint8(value) < 16) {
      planet.speed *= 2;
    }
    value >>= 8;
    if (uint8(value) < 16) {
      planet.defense *= 2;
    }
  }

  function _activateUpgrades(
    Planet memory planet,
    uint256 rangeUpgrades,
    uint256 speedUpgrades,
    uint256 defenseUpgrades
  ) internal view {
    uint256 totalLevel = rangeUpgrades + speedUpgrades + defenseUpgrades;
    if (totalLevel == 0) {
      return;
    }
    UpgradeConfigData memory config = UpgradeConfig.get();
    planet.populationCap =
      (planet.populationCap * uint256(config.populationCapMultiplier) ** totalLevel) /
      uint256(100) ** totalLevel;
    planet.populationGrowth =
      (planet.populationGrowth * uint256(config.populationGrowthMultiplier) ** totalLevel) /
      uint256(100) ** totalLevel;
    if (rangeUpgrades > 0) {
      planet.range =
        (planet.range * uint256(config.rangeMultiplier) ** rangeUpgrades) /
        uint256(100) ** planet.rangeUpgrades;
    }
    if (speedUpgrades > 0) {
      planet.speed =
        (planet.speed * uint256(config.speedMultiplier) ** speedUpgrades) /
        uint256(100) ** planet.speedUpgrades;
    }
    if (defenseUpgrades > 0) {
      planet.defense =
        (planet.defense * uint256(config.defenseMultiplier) ** defenseUpgrades) /
        uint256(100) ** planet.defenseUpgrades;
    }
    planet.useProps = true;
    planet.updateProps = true;
  }

  function _populationGrow(Planet memory planet, uint256 tickElapsed) internal pure {
    if (planet.populationGrowth == 0) {
      return;
    }
    int128 time = ABDKMath64x64.fromUInt(tickElapsed);
    int128 one = ABDKMath64x64.fromUInt(1);

    int128 denominator = ABDKMath64x64.add(
      ABDKMath64x64.mul(
        ABDKMath64x64.exp(
          ABDKMath64x64.div(
            ABDKMath64x64.mul(
              ABDKMath64x64.mul(ABDKMath64x64.fromInt(-4), ABDKMath64x64.fromUInt(planet.populationGrowth)),
              time
            ),
            ABDKMath64x64.fromUInt(planet.populationCap)
          )
        ),
        ABDKMath64x64.sub(
          ABDKMath64x64.div(ABDKMath64x64.fromUInt(planet.populationCap), ABDKMath64x64.fromUInt(planet.population)),
          one
        )
      ),
      one
    );

    planet.population = ABDKMath64x64.toUInt(
      ABDKMath64x64.div(ABDKMath64x64.fromUInt(planet.populationCap), denominator)
    );
  }

  function _silverGrow(Planet memory planet, uint256 tickElapsed) internal pure {
    uint256 silver = planet.silver;
    uint256 cap = planet.silverCap;
    if (planet.silverGrowth == 0 || silver >= cap) {
      return;
    }
    silver += planet.silverGrowth * tickElapsed;
    planet.silver = silver > cap ? cap : silver;
  }

  function _validateUpgrade(
    Planet memory planet,
    address executor,
    uint256 rangeUpgrades,
    uint256 speedUpgrades,
    uint256 defenseUpgrades
  ) internal view {
    if (planet.owner != executor) {
      revert Errors.NotPlanetOwner();
    }
    if (planet.planetType != PlanetType.PLANET || planet.level == 0) {
      revert Errors.InvalidUpgradeTarget();
    }

    uint256 rangeLvl = planet.rangeUpgrades + rangeUpgrades;
    uint256 speedLvl = planet.speedUpgrades + speedUpgrades;
    uint256 defenseLvl = planet.defenseUpgrades + defenseUpgrades;

    UpgradeConfigData memory config = UpgradeConfig.get();
    uint256 maxSingleLevel = config.maxSingleLevel;
    uint256 maxTotalLevel = uint8(config.maxTotalLevel >> ((uint8(planet.spaceType) - 1) * 8));

    if (
      rangeLvl + speedLvl + defenseLvl > maxTotalLevel ||
      rangeLvl > maxSingleLevel ||
      speedLvl > maxSingleLevel ||
      defenseLvl > maxSingleLevel
    ) {
      revert Errors.UpgradeExceedMaxLevel();
    }
  }

  function _calUpgradeCost(
    Planet memory planet,
    uint256 rangeUpgrades,
    uint256 speedUpgrades,
    uint256 defenseUpgrades
  ) internal view returns (uint256 cost) {
    uint256 totalLevel = planet.rangeUpgrades + planet.speedUpgrades + planet.defenseUpgrades;
    uint256 curTotalLevel = totalLevel + rangeUpgrades + speedUpgrades + defenseUpgrades;

    uint256 silverCost = UpgradeConfig.getSilverCost() >> (totalLevel * 8);
    for (uint256 i = totalLevel; i < curTotalLevel; ) {
      cost += uint8(silverCost);
      unchecked {
        silverCost >>= 8;
        ++i;
      }
    }
    cost = (cost * planet.silverCap) / 100;
  }

  function _validateProspect(Planet memory planet, address executor) internal view {
    if (planet.owner != executor) {
      revert Errors.NotPlanetOwner();
    }
    if (planet.planetType != PlanetType.FOUNDRY) {
      revert Errors.InvalidProspectTarget();
    }
    if (ProspectedPlanet.get(bytes32(planet.planetHash)) + 256 >= block.number) {
      revert Errors.PlanetAlreadyProspected();
    }
    if (ExploredPlanet.get(bytes32(planet.planetHash))) {
      revert Errors.PlanetAlreadyExplored();
    }
    // todo check whether the gear spaceship is on this planet
  }

  function _validateFindingArtifact(Planet memory planet, address executor) internal view {
    if (ExploredPlanet.get(bytes32(planet.planetHash))) {
      revert Errors.PlanetAlreadyExplored();
    }
    if (planet.owner != executor) {
      revert Errors.NotPlanetOwner();
    }
    if (ProspectedPlanet.get(bytes32(planet.planetHash)) + 256 < block.number) {
      revert Errors.PlanetNotProspected();
    }
    // todo check whether the gear spaceship is on this planet
  }

  function _getBiome(Planet memory planet, uint256 biomeBase) internal view returns (Biome biome) {
    uint256 res = uint8(planet.spaceType) * 3;
    PlanetBiomeConfigData memory config = PlanetBiomeConfig.get();
    if (biomeBase < config.threshold1) {
      res -= 2;
    } else if (biomeBase < config.threshold2) {
      res -= 1;
    }
    biome = res > uint8(type(Biome).max) ? type(Biome).max : Biome(res);
  }

  function _createArtifactSeed(Planet memory planet) internal view returns (uint256 seed) {
    seed = uint256(
      keccak256(
        abi.encodePacked(
          planet.planetHash,
          block.timestamp,
          blockhash(ProspectedPlanet.get(bytes32(planet.planetHash)))
        )
      )
    );
  }

  function _validateChargeArtifact(Planet memory planet, Artifact memory artifact, address executor) internal pure {
    if (planet.owner != executor) {
      revert Errors.NotPlanetOwner();
    }
    if (planet.level < artifact.reqLevel) {
      revert Errors.ArtifactLevelTooLow();
    }
  }

  function _validateActivateArtifact(Planet memory planet, Artifact memory artifact, address executor) internal pure {
    if (planet.owner != executor) {
      revert Errors.NotPlanetOwner();
    }
    if (planet.level < artifact.reqLevel) {
      revert Errors.ArtifactLevelTooLow();
    }
    if (planet.population <= artifact.reqPopulation || planet.silver < artifact.reqSilver) {
      revert Errors.NotEnoughResourceToActivate();
    }
  }

  function _applyArtifactEffect(Planet memory planet, Artifact memory artifact) internal {
    // todo
  }

  function _removeArtifactEffect(Planet memory planet, Artifact memory artifact) internal {
    // todo
  }
}
