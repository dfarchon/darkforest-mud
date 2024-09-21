// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { Errors } from "../interfaces/errors.sol";
import { PlanetType, SpaceType, Biome, ArtifactType, ArtifactRarity } from "../codegen/common.sol";
import { Counter, ArtifactConfig, Artifact as ArtifactTable, PlanetArtifact } from "../codegen/index.sol";
import { PlanetArtifact, PlanetArtifactData, ArtifactOwner } from "../codegen/index.sol";

using ArtifactStorageLib for ArtifactStorage global;

struct ArtifactStorage {
  bool initialized;
  uint256 planetHash;
  uint256 number;
  uint256[] artifacts;
  bool shouldWrite;
  uint256 inNumber;
  uint256[] inArtifacts;
  uint256 outNumber;
  uint256[] outArtifacts;
}

library ArtifactStorageLib {
  uint8 constant MAX_ARTIFACTS_PER_PLANET = 5;

  function readFromStore(ArtifactStorage memory _s) private view {
    uint256[] memory artifacts = new uint256[](MAX_ARTIFACTS_PER_PLANET);
    PlanetArtifactData memory data = PlanetArtifact.get(bytes32(_s.planetHash));
    uint256 number = data.number;
    if (number == 0) {
      _s.artifacts = artifacts;
      return;
    }
    _s.number = number;
    uint256 artifactsArray = data.artifacts;
    for (uint256 i; i < number; ) {
      artifacts[i] = uint32(artifactsArray);
      unchecked {
        artifactsArray >>= 32;
        ++i;
      }
    }
    _s.artifacts = artifacts;
    _s.initialized = true;
  }

  function WriteToStore(ArtifactStorage memory _s) internal {
    if (!_s.shouldWrite) {
      return;
    }
    uint256 artifactsArray;
    uint256 number = _s.number;
    for (uint256 i; i < number; ) {
      artifactsArray <<= 32;
      artifactsArray += _s.artifacts[i];
      unchecked {
        ++i;
      }
    }
    PlanetArtifact.set(bytes32(_s.planetHash), uint8(number), uint160(artifactsArray));

    number = _s.inNumber;
    for (uint256 i; i < number; ) {
      uint32 artifact = uint32(_s.inArtifacts[i]);
      ArtifactTable.setAvailability(artifact, true);
      ArtifactOwner.set(artifact, bytes32(_s.planetHash));
      unchecked {
        ++i;
      }
    }

    number = _s.outNumber;
    for (uint256 i; i < number; ) {
      uint32 artifact = uint32(_s.outArtifacts[i]);
      ArtifactTable.setAvailability(artifact, false);
      unchecked {
        ++i;
      }
    }
  }

  function isEmpty(ArtifactStorage memory _s) internal pure returns (bool) {
    return _s.number == 0;
  }

  function isFull(ArtifactStorage memory _s) internal pure returns (bool) {
    return _s.number == MAX_ARTIFACTS_PER_PLANET;
  }

  function Push(ArtifactStorage memory _s, uint256 _artifact) internal view {
    if (!_s.initialized) {
      readFromStore(_s);
    }
    if (_s.isFull()) {
      revert Errors.ArtifactStorageFull();
    }
    _s.artifacts[_s.number] = _artifact;
    if (_s.inNumber == 0) {
      _s.inArtifacts = new uint256[](MAX_ARTIFACTS_PER_PLANET);
    }
    _s.inArtifacts[_s.inNumber] = _artifact;
    _s.shouldWrite = true;
    unchecked {
      ++_s.number;
      ++_s.inNumber;
    }
  }

  function Remove(ArtifactStorage memory _s, uint256 _artifact) internal view {
    if (!_s.initialized) {
      readFromStore(_s);
    }
    if (_s.isEmpty()) {
      revert Errors.ArtifactNotOnPlanet();
    }
    if (ArtifactTable.getAvailability(uint32(_artifact)) == false) {
      revert Errors.ArtifactNotOnPlanet();
    }
    uint256 number = _s.number;
    uint256[] memory artifacts = _s.artifacts;
    for (uint256 i; i < number; ) {
      if (artifacts[i] == _artifact) {
        unchecked {
          --number;
        }
        artifacts[i] = artifacts[number];
        _s.number = number;
        _s.artifacts = artifacts;
        _s.shouldWrite = true;
        if (_s.outNumber == 0) {
          _s.outArtifacts = new uint256[](MAX_ARTIFACTS_PER_PLANET);
        }
        _s.outArtifacts[_s.outNumber] = _artifact;
        unchecked {
          ++_s.outNumber;
        }
        return;
      }
      unchecked {
        ++i;
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
