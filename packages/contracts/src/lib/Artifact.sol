// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { Errors } from "../interfaces/errors.sol";
import { PlanetType, SpaceType, Biome, ArtifactType, ArtifactRarity } from "../codegen/common.sol";
import { Counter, ArtifactConfig, Artifact as ArtifactTable, PlanetArtifact } from "../codegen/index.sol";
import { PlanetArtifact, ArtifactOwner } from "../codegen/index.sol";

using ArtifactStorageLib for ArtifactStorage global;

struct ArtifactStorage {
  uint256 planetHash;
  uint256 number;
  uint256 artifacts;
  bool shouldWrite;
  uint256 inArtifacts;
  uint256 outArtifacts;
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
      ArtifactTable.setAvailability(artifact, true);
      ArtifactOwner.set(artifact, bytes32(_s.planetHash));
      unchecked {
        ++i;
        artifacts >>= 32;
      }
    }

    artifacts = _s.outArtifacts;
    for (uint256 i; i < MAX_ARTIFACTS_PER_PLANET; ) {
      uint32 artifact = uint32(artifacts);
      if (artifact == 0) {
        break;
      }
      ArtifactTable.setAvailability(artifact, false);
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

  function Push(ArtifactStorage memory _s, uint256 _artifact) internal pure {
    if (_s.IsFull()) {
      // revert Errors.ArtifactStorageFull();
      // in order to get rid of stuck planet updating, we just ignore the new artifact
      return;
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
    if (ArtifactTable.getAvailability(uint32(_artifact)) == false) {
      revert Errors.ArtifactNotOnPlanet();
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
          _s.outArtifacts = (_s.outArtifacts << 32) + _artifact;
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
  ArtifactRarity rarity;
  ArtifactType artifactType;
  bool available;
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
    artifact.available = true;
  }

  function writeToStore(Artifact memory artifact) internal {
    ArtifactTable.set(uint32(artifact.id), artifact.rarity, artifact.artifactType, artifact.available);
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
    uint16[] memory thresholds = ArtifactConfig.get(artifact.rarity);
    uint256 length = thresholds.length;
    uint256 cumulativeThreshold;
    for (uint256 i; i < length; ) {
      cumulativeThreshold += thresholds[i];
      if (typeSeed < cumulativeThreshold) {
        artifact.artifactType = ArtifactType(i + 1);
        return;
      }
      unchecked {
        ++i;
      }
    }
    revert Errors.UnkonwnArtifactType();
  }
}
