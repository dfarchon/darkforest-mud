// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { MaterialType } from "codegen/common.sol";
import { PlanetMaterialStorage } from "codegen/tables/PlanetMaterialStorage.sol";
import { PlanetMaterial } from "codegen/tables/PlanetMaterial.sol";

struct MaterialStorage {
  bool[] exists;
  bool[] updates;
  uint256[] amount;
}

using MaterialStorageLib for MaterialStorage global;

library MaterialStorageLib {
  function ReadFromStore(MaterialStorage memory mat, uint256 planetHash) internal view {
    uint256 materialCount = uint8(type(MaterialType).max) + 1;
    mat.exists = new bool[](materialCount);
    mat.updates = new bool[](materialCount);
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
        exsitMap |= (1 << i);
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
}

struct Materials {
  MaterialType materialId;
  uint256 amount;
  uint256 cap;
  uint256 growthRate;
  uint256 lastTick;
}

struct MaterialMove {
  uint8 resourceId; // 0..255
  uint64 amount; // <= 2^64-1
}

// library MaterialLib {
//   function newMaterial(MaterialType id, uint256 cap, uint256 growthRate) internal view returns (Materials memory) {
//     return Materials({ materialId: id, amount: 0, cap: cap, growthRate: growthRate, lastTick: Ticker.getTickNumber() });
//   }

//   function grow(Materials memory mat) internal view returns (uint256) {
//     uint256 currentTick = Ticker.getTickNumber();
//     uint256 elapsed = currentTick - mat.lastTick;
//     uint256 growth = elapsed * mat.growthRate;
//     uint256 newAmount = mat.amount + growth;
//     if (newAmount > mat.cap) {
//       newAmount = mat.cap;
//     }
//     return newAmount;
//   }

//   function tick(Materials storage mat) internal {
//     mat.amount = grow(mat);
//     mat.lastTick = Ticker.getTickNumber();
//   }
// }
