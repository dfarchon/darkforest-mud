// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { Errors } from "../interfaces/errors.sol";
import { PlanetType, SpaceType, Biome, ArtifactRarity, ArtifactGenre, ArtifactStatus } from "../codegen/common.sol";
import { Counter, Ticker, Artifact as ArtifactTable, ArtifactData, PlanetArtifact } from "../codegen/index.sol";
import { ArtifactConfig, ArtifactConfigData } from "../codegen/index.sol";
import { PlanetArtifact, ArtifactOwner, ArtifactMetadata, ArtifactMetadataData } from "../codegen/index.sol";
import { _artifactMetadataTableId, _artifactIndexToNamespace } from "../modules/atfs/utils.sol";

using ArtifactStorageLib for ArtifactStorage global;

struct ArtifactStorage {
  uint256 planetHash;
  uint256 number;
  uint256 artifacts;
  bool shouldWrite;
  uint256 inArtifacts;
}

library ArtifactStorageLib {
  uint8 constant MAX_ARTIFACTS_PER_PLANET = 8;

  function ReadFromStore(ArtifactStorage memory _s, uint256 _planet) internal view {
    uint256 artifacts = PlanetArtifact.get(bytes32(_planet));
    _s.planetHash = _planet;
    _s.artifacts = artifacts;
    _s.number = MAX_ARTIFACTS_PER_PLANET;
    for (uint256 i; i < MAX_ARTIFACTS_PER_PLANET; ) {
      uint32 artifact = uint32(artifacts);
      if (artifact == 0) {
        _s.number = i;
        break;
      }
      unchecked {
        ++i;
        artifacts >>= 32;
      }
    }
  }

  function WriteToStore(ArtifactStorage memory _s) internal {
    if (!_s.shouldWrite) {
      return;
    }
    PlanetArtifact.set(bytes32(_s.planetHash), _s.artifacts);

    uint256 artifacts = _s.inArtifacts;
    for (uint256 i; i < MAX_ARTIFACTS_PER_PLANET; ) {
      uint32 artifact = uint32(artifacts);
      if (artifact == 0) {
        break;
      }
      ArtifactOwner.set(artifact, bytes32(_s.planetHash));
      unchecked {
        ++i;
        artifacts >>= 32;
      }
    }
  }

  function IsEmpty(ArtifactStorage memory _s) internal pure returns (bool) {
    return _s.number == 0;
  }

  function IsFull(ArtifactStorage memory _s) internal pure returns (bool) {
    return _s.number == MAX_ARTIFACTS_PER_PLANET;
  }

  function Get(ArtifactStorage memory _s, uint256 _index) internal pure returns (uint256 artifact) {
    artifact = uint32(_s.artifacts >> (32 * _index));
  }

  function Has(ArtifactStorage memory _s, uint256 _artifact) internal pure returns (bool) {
    uint256 artifacts = _s.artifacts;
    for (uint256 i; i < _s.number; ) {
      if (uint32(artifacts) == _artifact) {
        return true;
      }
      unchecked {
        ++i;
        artifacts >>= 32;
      }
    }
    return false;
  }

  function GetNumber(ArtifactStorage memory _s) internal pure returns (uint256) {
    return _s.number;
  }

  function Push(ArtifactStorage memory _s, uint256 _artifact) internal pure {
    if (_s.IsFull()) {
      revert Errors.ArtifactStorageFull();
    }
    _s.shouldWrite = true;
    unchecked {
      _s.artifacts += _artifact << (32 * _s.number);
      _s.inArtifacts = (_s.inArtifacts << 32) + _artifact;
      ++_s.number;
    }
  }

  function Remove(ArtifactStorage memory _s, uint256 _artifact) internal view {
    if (_s.IsEmpty()) {
      revert Errors.ArtifactNotOnPlanet();
    }
    if (ArtifactTable.getStatus(uint32(_artifact)) > ArtifactStatus.CHARGING) {
      revert Errors.ArtifactNotAvailable();
    }
    uint256 number = _s.number;
    uint256 artifacts = _s.artifacts;
    for (uint256 i; i < number; ) {
      if (uint32(artifacts) == _artifact) {
        _s.shouldWrite = true;
        unchecked {
          --number;
          uint256 mod = 1 << (32 * i);
          _s.artifacts = (_s.artifacts % mod) + ((_s.artifacts / mod) >> 32) * mod;
        }
        return;
      }
      unchecked {
        ++i;
        artifacts >>= 32;
      }
    }
    revert Errors.ArtifactNotOnPlanet();
  }
}

using ArtifactLib for Artifact global;

struct Artifact {
  uint256 id;
  uint256 planetHash;
  // Table: Artifact
  ArtifactStatus status;
  ArtifactRarity rarity;
  uint256 artifactIndex;
  uint256 chargeTick;
  uint256 activateTick;
  uint256 cooldownTick;
  // Table: ArtifactMetadata
  ArtifactGenre genre;
  uint256 charge;
  uint256 cooldown;
  bool durable;
  bool reusable;
  uint256 reqLevel;
  uint256 reqPopulation;
  uint256 reqSilver;
}

library ArtifactLib {
  function NewArtifact(
    uint256 seed,
    uint256 planetHash,
    uint256 planetLevel
  ) internal view returns (Artifact memory artifact) {
    uint256 id = Counter.getArtifact() + 1;
    artifact.id = id;
    artifact.planetHash = planetHash;
    artifact._initRarity(seed, planetLevel);
    artifact._initType(seed);
  }

  // never directly call this function
  // artifact should be got from planet.mustGetArtifact(artifactId)
  function readFromStore(Artifact memory artifact, uint256 curTick) internal view {
    ArtifactData memory data = ArtifactTable.get(uint32(artifact.id));
    artifact.rarity = data.rarity;
    artifact.artifactIndex = data.artifactIndex;
    artifact.status = data.status;
    artifact.chargeTick = data.chargeTick;
    artifact.activateTick = data.activateTick;
    artifact.cooldownTick = data.cooldownTick;
    ArtifactMetadataData memory metadata = _getMetadata(artifact);
    artifact.genre = metadata.genre;
    artifact.charge = metadata.charge;
    artifact.cooldown = metadata.cooldown;
    artifact.durable = metadata.durable;
    artifact.reusable = metadata.reusable;
    artifact.reqLevel = metadata.reqLevel;
    artifact.reqPopulation = metadata.reqPopulation;
    artifact.reqSilver = metadata.reqSilver;
    _updateArtifactStatus(artifact, curTick);
  }

  function writeToStore(Artifact memory artifact) internal {
    ArtifactTable.set(
      uint32(artifact.id),
      uint8(artifact.artifactIndex),
      artifact.rarity,
      artifact.status,
      uint64(artifact.chargeTick),
      uint64(artifact.activateTick),
      uint64(artifact.cooldownTick)
    );
  }

  function _getMetadata(Artifact memory artifact) internal view returns (ArtifactMetadataData memory) {
    return
      ArtifactMetadata.get(
        _artifactMetadataTableId(_artifactIndexToNamespace(artifact.artifactIndex)),
        artifact.rarity
      );
  }

  function _updateArtifactStatus(Artifact memory artifact, uint256 curTick) internal pure {
    if (artifact.status == ArtifactStatus.CHARGING && curTick >= artifact.chargeTick + artifact.charge) {
      artifact.status = ArtifactStatus.READY;
    } else if (artifact.status == ArtifactStatus.COOLDOWN && curTick >= artifact.cooldownTick + artifact.cooldown) {
      artifact.status = ArtifactStatus.READY;
    }
  }

  function _initRarity(Artifact memory artifact, uint256 seed, uint256 planetLevel) internal pure {
    uint256 lvlBonusSeed = seed & 0xfff000;
    if (lvlBonusSeed < 0x40000) {
      // possibility 1/64
      planetLevel += 2;
    } else if (lvlBonusSeed < 0x100000) {
      // possibility 1/16
      planetLevel += 1;
    }
    if (planetLevel <= 1) {
      artifact.rarity = ArtifactRarity.COMMON;
    } else if (planetLevel <= 3) {
      artifact.rarity = ArtifactRarity.RARE;
    } else if (planetLevel <= 5) {
      artifact.rarity = ArtifactRarity.EPIC;
    } else if (planetLevel <= 7) {
      artifact.rarity = ArtifactRarity.LEGENDARY;
    } else {
      artifact.rarity = ArtifactRarity.MYTHIC;
    }
  }

  function _initType(Artifact memory artifact, uint256 seed) internal view {
    uint256 typeSeed = seed % 0x1000;
    uint16[] memory thresholds = ArtifactConfig.getProbabilities(artifact.rarity);
    uint256 length = thresholds.length;
    uint256 cumulativeThreshold;
    for (uint256 i; i < length; ) {
      cumulativeThreshold += thresholds[i];
      if (typeSeed < cumulativeThreshold) {
        artifact.artifactIndex = ArtifactConfig.getItemIndexes(artifact.rarity, i);
        return;
      }
      unchecked {
        ++i;
      }
    }
    revert Errors.UnkonwnArtifactType();
  }
}
