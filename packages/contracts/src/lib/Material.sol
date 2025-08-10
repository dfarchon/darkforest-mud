// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { MaterialType } from "codegen/common.sol";
import { Ticker } from "codegen/tables/Ticker.sol";

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

library MaterialLib {
  function newMaterial(MaterialType id, uint256 cap, uint256 growthRate) internal view returns (Materials memory) {
    return Materials({ materialId: id, amount: 0, cap: cap, growthRate: growthRate, lastTick: Ticker.getTickNumber() });
  }

  function grow(Materials memory mat) internal view returns (uint256) {
    uint256 currentTick = Ticker.getTickNumber();
    uint256 elapsed = currentTick - mat.lastTick;
    uint256 growth = elapsed * mat.growthRate;
    uint256 newAmount = mat.amount + growth;
    if (newAmount > mat.cap) {
      newAmount = mat.cap;
    }
    return newAmount;
  }

  function tick(Materials storage mat) internal {
    mat.amount = grow(mat);
    mat.lastTick = Ticker.getTickNumber();
  }
}
