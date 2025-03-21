// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { Errors } from "interfaces/errors.sol";
import { Move, MoveData } from "codegen/tables/Move.sol";
import { Ticker } from "codegen/tables/Ticker.sol";
import { PendingMove, PendingMoveData } from "codegen/tables/PendingMove.sol";
import { Counter } from "codegen/tables/Counter.sol";
import { Artifact as ArtifactTable } from "codegen/tables/Artifact.sol";
import { ArtifactOwner } from "codegen/tables/ArtifactOwner.sol";
import { PlanetType, ArtifactStatus } from "codegen/common.sol";
import { Planet } from "libraries/Planet.sol";
import { ABDKMath64x64 } from "abdk-libraries-solidity/ABDKMath64x64.sol";
import { GuildUtils } from "libraries/GuildUtils.sol";

library MoveLib {
  function NewMove(Planet memory from, address captain) internal view returns (MoveData memory move) {
    if (from.owner != captain) {
      revert Errors.NotPlanetOwner();
    }
    move.id = Counter.getMove() + 1;
    move.captain = captain;
    move.from = bytes32(from.planetHash);
  }

  function loadPopulation(
    MoveData memory move,
    Planet memory from,
    uint256 population,
    uint256 distance
  ) internal pure {
    if (from.population <= population) {
      revert Errors.NotEnoughPopulation();
    }
    int256 constantLoss = ABDKMath64x64.divu(from.populationCap, 20);
    int256 alive = ABDKMath64x64.div(
      ABDKMath64x64.fromUInt(population),
      ABDKMath64x64.exp_2(ABDKMath64x64.divu(distance, from.range))
    );
    if (alive <= constantLoss) {
      revert Errors.NotEnoughPopulationToReach();
    }
    move.population += ABDKMath64x64.toUInt(int128(alive - constantLoss));
    from.population -= population;
  }

  function loadSilver(MoveData memory move, Planet memory from, uint256 silver) internal pure {
    if (from.silver < silver) {
      revert Errors.NotEnoughSilver();
    }
    move.silver += uint64(silver);
    from.silver -= silver;
  }

  function loadArtifact(MoveData memory move, Planet memory from, uint256 artifactId) internal view {
    if (artifactId == 0) {
      return;
    }
    if (ArtifactTable.getStatus(uint32(artifactId)) >= ArtifactStatus.CHARGING) {
      revert Errors.ArtifactNotAvailable();
    }

    move.artifact = artifactId;
    from.removeArtifact(artifactId);
  }

  function headTo(MoveData memory move, Planet memory to, uint256 distance, uint256 speed) internal {
    uint256 time = (distance * 100) / speed;
    uint256 present = to.lastUpdateTick;
    move.departureTick = uint64(present);
    move.arrivalTick = uint64(present + time);
    // check if the target planet is full of artifacts
    if (move.artifact != 0 && !to.hasArtifactSlot()) {
      revert Errors.ArtifactStorageFull();
    }
    // if time == 0, unload immediately
    if (time == 0) {
      arrivedAt(move, to);
    } else {
      to.pushMove(move);
    }
  }

  function arrivedAt(MoveData memory move, Planet memory planet) internal view {
    assert(move.arrivalTick == planet.lastUpdateTick);
    unloadPopulation(move, planet);
    unloadSilver(move, planet);
    unloadArtifact(move, planet);
  }

  function unloadPopulation(MoveData memory move, Planet memory to) internal view {
    uint256 population = to.population;
    uint256 arrivedPopulation = move.population;
    if (move.captain == to.owner || GuildUtils.inSameGuild(move.captain, to.owner, move.arrivalTick)) {
      population += arrivedPopulation;
    } else {
      uint256 defense = to.defense;
      if (population > (arrivedPopulation * 100) / defense) {
        population -= (arrivedPopulation * 100) / defense;
      } else {
        to.changeOwner(move.captain);
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
    if (move.artifact != 0) {
      to.pushArtifact(move.artifact);
    }
  }
}

struct PendingMoveQueue {
  uint256 planetHash;
  uint256 head;
  uint256 number;
  uint256[] indexes;
  bool shouldWrite;
}

using PendingMoveQueueLib for PendingMoveQueue global;

library PendingMoveQueueLib {
  uint8 constant MAX_MOVE_QUEUE_SIZE = 30;
  uint240 constant DEFAULT_INDEXES = 0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d;

  function ReadFromStore(PendingMoveQueue memory _q, uint256 _planet) internal view {
    PendingMoveData memory data = PendingMove.get(bytes32(_planet));
    _q.planetHash = _planet;
    _q.head = data.head;
    _q.number = data.number;
    uint256 indexes = data.indexes;
    if (indexes == 0) {
      indexes = DEFAULT_INDEXES;
    }
    uint256[] memory indexArray = new uint256[](MAX_MOVE_QUEUE_SIZE);
    for (uint256 i = MAX_MOVE_QUEUE_SIZE - 1; i > 0; ) {
      indexArray[i] = uint8(indexes);
      unchecked {
        --i;
        indexes >>= 8;
      }
    }
    indexArray[0] = uint8(indexes);
    _q.indexes = indexArray;
  }

  function WriteToStore(PendingMoveQueue memory _q) internal {
    if (_q.shouldWrite) {
      uint256 indexes;
      for (uint256 i; i < MAX_MOVE_QUEUE_SIZE; ) {
        indexes <<= 8;
        indexes += _q.indexes[i];
        unchecked {
          ++i;
        }
      }
      PendingMove.set(bytes32(_q.planetHash), uint8(_q.head), uint8(_q.number), uint240(indexes));
      return;
    }
  }

  function IsEmpty(PendingMoveQueue memory _q) internal pure returns (bool) {
    return _q.number == 0;
  }

  function IsFull(PendingMoveQueue memory _q) internal pure returns (bool) {
    return _q.indexes.length == _q.number;
  }

  function PushMove(PendingMoveQueue memory _q, MoveData memory _move) internal {
    if (_q.IsFull()) {
      revert Errors.ReachMaxMoveToLimit(MAX_MOVE_QUEUE_SIZE);
    }
    uint256[] memory indexes = _q.indexes;
    uint256 i = _q.head + _q.number;
    uint256 index = indexes[i % MAX_MOVE_QUEUE_SIZE];
    Move.set(bytes32(_q.planetHash), uint8(index), _move);
    while (i > 0) {
      uint256 curIndex = indexes[(i - 1) % MAX_MOVE_QUEUE_SIZE];
      MoveData memory move = Move.get(bytes32(_q.planetHash), uint8(curIndex));
      if (move.arrivalTick <= _move.arrivalTick) {
        break;
      }
      indexes[i % MAX_MOVE_QUEUE_SIZE] = curIndex;
      --i;
    }
    indexes[i % MAX_MOVE_QUEUE_SIZE] = index;
    ++_q.number;
    _q.indexes = indexes;
    _q.shouldWrite = true;
  }

  function PopArrivedMove(PendingMoveQueue memory _q, uint256 until) internal view returns (MoveData memory move) {
    if (_q.IsEmpty()) {
      return move;
    }
    uint256[] memory indexes = _q.indexes;
    uint256 head = _q.head;
    MoveData memory firstMove = Move.get(bytes32(_q.planetHash), uint8(indexes[head]));
    if (firstMove.arrivalTick <= until) {
      // move the index at head to the tail
      uint256 tail = (head + _q.number) % MAX_MOVE_QUEUE_SIZE;
      uint256 temp = indexes[head];
      indexes[head] = indexes[tail];
      indexes[tail] = temp;

      _q.indexes = indexes;
      _q.head = (head + 1) % MAX_MOVE_QUEUE_SIZE;
      --_q.number;
      _q.shouldWrite = true;
      return firstMove;
    }
  }

  function GetFlyingArtifactsNum(PendingMoveQueue memory _q) internal view returns (uint256) {
    uint256[] memory indexes = _q.indexes;
    uint256 count;
    uint256 head = _q.head;
    uint256 tail = head + _q.number;
    for (uint256 i = head; i < tail; ) {
      MoveData memory move = Move.get(bytes32(_q.planetHash), uint8(indexes[i % MAX_MOVE_QUEUE_SIZE]));
      unchecked {
        if (move.artifact != 0) {
          ++count;
        }
        ++i;
      }
    }
    return count;
  }
}
