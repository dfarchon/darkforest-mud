// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { MaterialType } from "codegen/common.sol";
import { PlanetMaterialStorage } from "codegen/tables/PlanetMaterialStorage.sol";
import { PlanetMaterial } from "codegen/tables/PlanetMaterial.sol";

struct MaterialStorage {
  bool[] exists;
  bool[] updates;
  bool[] growth;
  uint256[] amount;
}

using MaterialStorageLib for MaterialStorage global;

library MaterialStorageLib {
  function ReadFromStore(MaterialStorage memory mat, uint256 planetHash) internal view {
    uint256 materialCount = uint8(type(MaterialType).max) + 1;
    mat.exists = new bool[](materialCount);
    mat.updates = new bool[](materialCount);
    mat.growth = new bool[](materialCount);
    mat.amount = new uint256[](materialCount);
    uint256 exsitMap = PlanetMaterialStorage.get(bytes32(planetHash));
    for (uint256 i; i < materialCount; ) {
      mat.exists[i] = (exsitMap & (1 << i)) != 0;
      unchecked {
        ++i;
      }
    }
  }

  function WriteToStore(MaterialStorage memory mat, uint256 planetHash) internal {
    uint256 exsitMap = 0;
    uint256 materialCount = uint8(type(MaterialType).max) + 1;
    for (uint256 i; i < materialCount; ) {
      if (mat.exists[i]) {
        // Mark material as existing in the bitmap regardless of amount
        exsitMap |= (1 << i);
        if (mat.updates[i]) {
          PlanetMaterial.set(bytes32(planetHash), uint8(i), mat.amount[i]);
        }
      }
      unchecked {
        ++i;
      }
    }
    PlanetMaterialStorage.set(bytes32(planetHash), exsitMap);
  }

  function getMaterial(
    MaterialStorage memory mat,
    uint256 planetHash,
    MaterialType materialId
  ) internal view returns (uint256) {
    if (!mat.exists[uint8(materialId)]) {
      return 0;
    }
    if (mat.updates[uint8(materialId)]) {
      return mat.amount[uint8(materialId)];
    }
    uint256 amount = PlanetMaterial.get(bytes32(planetHash), uint8(materialId));
    mat.amount[uint8(materialId)] = amount;
    mat.updates[uint8(materialId)] = true;
    return amount;
  }

  function setMaterial(
    MaterialStorage memory mat,
    uint256 planetHash,
    MaterialType materialId,
    uint256 amount
  ) internal pure {
    mat.exists[uint8(materialId)] = true;
    mat.amount[uint8(materialId)] = amount;
    mat.updates[uint8(materialId)] = true;
  }

  function initMaterial(MaterialStorage memory mat, uint256 planetHash, MaterialType materialId) internal pure {
    mat.exists[uint8(materialId)] = true;
    mat.updates[uint8(materialId)] = true;
    mat.growth[uint8(materialId)] = true;
  }
}

struct Materials {
  MaterialType materialId;
  uint256 amount;
  uint256 cap;
  uint256 growthRate;
}

struct MaterialMove {
  uint8 resourceId; // 0..255
  uint256 amount; // <= 2^256-1
}
