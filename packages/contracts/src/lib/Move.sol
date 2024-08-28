// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Errors } from "../interfaces/errors.sol";
import { Move, MoveData, Ticker, PendingMove, PendingMoveData } from "../codegen/index.sol";
import { PlanetType } from "../codegen/common.sol";
import { Planet } from "./Planet.sol";

struct MoveQueue {
  uint256 planet;
  uint256 head;
  uint256 number;
  uint8[] indexes;
}

using MoveQueueLib for MoveQueue global;

uint8 constant MAX_MOVE_QUEUE_SIZE = 32;

library MoveLib {
  function NewMove(Planet memory from, address captain) internal pure returns (MoveData memory move) {
    if (from.owner != captain) {
      revert Errors.NotPlanetOwner();
    }
    move.captain = captain;
    move.from = bytes32(from.planetHash);
  }

  function loadPopulation(MoveData memory move, Planet memory from, uint256 population) internal pure {
    if (from.population <= population) {
      revert Errors.NotEnoughPopulation();
    }
    move.population += uint64(population);
    from.population -= population;
  }

  function loadSilver(MoveData memory move, Planet memory from, uint256 silver) internal pure {
    if (from.silver < silver) {
      revert Errors.NotEnoughSilver();
    }
    move.silver += uint64(silver);
    from.silver -= silver;
  }

  function loadArtifact(MoveData memory move, Planet memory from, uint256 artifact) internal pure {
    //todo
  }

  function headTo(MoveData memory move, Planet memory to, uint256 distance, uint256 speed) internal {
    uint256 time = distance * 100 / speed;
    uint256 present = Ticker.getTickNumber();
    move.departureTime = uint64(present);
    move.arrivalTime = uint64(present + time);
    to.moveQueue.PushMove(move);
  }

  function unloadPopulation(MoveData memory move, Planet memory to) internal pure {
    uint256 population = to.population;
    uint256 arrivedPopulation = move.population;
    if (move.captain == to.owner) {
      population += arrivedPopulation;
    } else {
      uint256 defense = to.defense;
      if (population > (arrivedPopulation * 100) / defense) {
        population -= (arrivedPopulation * 100) / defense;
      } else {
        to.owner = move.captain;
        population = arrivedPopulation - ((population * defense) / 100);
        if (population == 0) {
          population = 1;
        }
      }
    }
    if (to.planetType == PlanetType.QUASAR) {
      if (population > to.populationCap) {
        population = to.populationCap;
      }
    }
    to.population = population;
  }

  function unloadSilver(MoveData memory move, Planet memory to) internal pure {
    to.silver += move.silver;
    if (to.silver > to.silverCap) {
      to.silver = to.silverCap;
    }
  }

  function unloadArtifact(MoveData memory move, Planet memory to) internal pure {
    //todo
  }
}

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

  function WriteToStore(MoveQueue memory _q) internal {
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

  function PopArrivedMove(MoveQueue memory _q) internal view returns (MoveData memory move) {
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
