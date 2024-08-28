// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Move, MoveData, Ticker, PendingMove, PendingMoveData } from "../codegen/index.sol";

struct MoveQueue {
  uint256 planet;
  uint256 head;
  uint256 number;
  uint8[] indexes;
}

using MoveQueueLib for MoveQueue global;

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
    _q.head = pendingMove.head;
    _q.number = pendingMove.number;
    _q.indexes = pendingMove.indexes;
  }

  function WriteIntoStore(MoveQueue memory _q) internal {
    PendingMove.set(bytes32(_q.planet), uint8(_q.head), uint8(_q.number), _q.indexes);
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
    uint256 i = _q.head + _q.number;
    uint8 index = indexes[i % MAX_MOVE_QUEUE_SIZE];
    Move.set(bytes32(_q.planet), index, _move);
    while (i > 0) {
      uint8 curIndex = indexes[(i - 1) % MAX_MOVE_QUEUE_SIZE];
      MoveData memory move = Move.get(bytes32(_q.planet), curIndex);
      if (move.arrivalTime <= _move.arrivalTime) {
        break;
      }
      indexes[i % MAX_MOVE_QUEUE_SIZE] = curIndex;
      --i;
    }
    indexes[i % MAX_MOVE_QUEUE_SIZE] = index;
    ++_q.number;
    _q.indexes = indexes;
  }

  function PopMove(MoveQueue memory _q) internal view returns (MoveData memory move) {
    if (_q.IsEmpty()) {
      return move;
    }
    move = Move.get(bytes32(_q.planet), _q.indexes[_q.head]);
    uint256 currentTick = Ticker.getTickNumber();
    if (move.arrivalTime <= currentTick) {
      _q.head = (_q.head + 1) % MAX_MOVE_QUEUE_SIZE;
      --_q.number;
      return move;
    }
  }
}
