// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Move, MoveData, Ticker, PendingMove, PendingMoveData } from "../codegen/index.sol";

struct MoveQueue {
  uint256 planet;
  uint256 number;
  uint8[] indexes;
}

using MoveQueueLib for MoveQueue global;

// uint256 constant DEFAULT_INDEXES = 0x00001d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100;
uint8 constant MAX_MOVE_QUEUE_SIZE = 30;

library MoveQueueLib {
  function New(MoveQueue memory _q, uint256 _planet) internal pure {
    _q.planet = _planet;
    _q.indexes = new uint8[](MAX_MOVE_QUEUE_SIZE);
    for (uint256 i; i < MAX_MOVE_QUEUE_SIZE;) {
      _q.indexes[i] = uint8(i);
      unchecked {
        ++i;
      }
    }
  }

  function ReadFromStore(MoveQueue memory _q, uint256 _planet) internal view {
    _q.planet = _planet;
    PendingMoveData memory pendingMove = PendingMove.get(bytes32(_planet));
    _q.number = pendingMove.number;
    _q.indexes = pendingMove.indexes;
  }

  function IsEmpty(MoveQueue memory _q) internal pure returns (bool) {
    return _q.number == 0;
  }

  function IsFull(MoveQueue memory _q) internal pure returns (bool) {
    return _q.indexes.length == _q.number;
  }

  function PushMove(MoveQueue memory _q, MoveData memory _move) internal {
    assert(!_q.IsFull());
    uint8[] memory indexes = _q.indexes;
    uint256 i = _q.number;
    uint8 index = indexes[i];
    Move.set(bytes32(_q.planet), index, _move);
    while (i > 0) {
      uint8 curIndex = indexes[i - 1];
      MoveData memory move = Move.get(bytes32(_q.planet), curIndex);
      if (move.arrivalTime <= _move.arrivalTime) {
        break;
      }
      indexes[i] = curIndex;
      --i;
    }
    indexes[i] = index;
    ++_q.number;
    _q.indexes = indexes;
  }

  function PopArrivedMoves(MoveQueue memory _q) internal view returns (MoveData[] memory moves) {
    if (_q.IsEmpty()) {
      return moves;
    }
    uint256 number = _q.number;
    uint256 popNumber = number;
    uint256 currentTick = Ticker.getTickNumber();
    for (uint256 i; i < number;) {
      MoveData memory move = Move.get(bytes32(_q.planet), _q.indexes[i]);
      if (move.arrivalTime > currentTick) {
        popNumber = i;
        break;
      }
      unchecked {
        ++i;
      }
    }
    moves = new MoveData[](popNumber);
    for (uint256 i; i < popNumber;) {
      moves[i] = Move.get(bytes32(_q.planet), _q.indexes[i]);
      unchecked {
        ++i;
      }
    }
    for (uint256 i = popNumber; i < number; i++) {
      uint8 temp = _q.indexes[i];
      _q.indexes[i] = _q.indexes[i - popNumber];
      _q.indexes[i - popNumber] = temp;
    }
  }
}
