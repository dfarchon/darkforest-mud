// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { TempConfigSet, UniverseConfig, SnarkConfig, SnarkConfigData } from "../codegen/index.sol";
import { InnerCircle } from "../codegen/index.sol";
import { Errors } from "../interfaces/errors.sol";

using MoveInputLib for MoveInput global;

struct MoveInput {
  uint256 fromPlanetHash;
  uint256 toPlanetHash;
  uint256 toPerlin;
  uint256 universeRadius;
  // todo for circuit
  // The move circuit use a distMax to describe the distance between fromPlanet and toPlanet.
  // And the circuit checks that distMax^2 + 1 >= distance^2. We use interger in for circom input.
  // But usually the distance between two planets is a float number. So the interger we used for
  // distMax is the ceil of the real distance. But we could just transfer the distance^2 into the
  // circuit and check an equality.
  uint256 distance;
  uint256 mimcHashKey;
  uint256 spaceTypeKey;
  uint256 perlinLengthScale;
  uint256 perlinMirrorX;
  uint256 perlinMirrorY;
  // todo for circuit
  // The move circuit checkes toRadiusSquare == toPlanet.x^2 + toPlanet.y^2, which leaks infomation of
  // toPlanet's position. We could use the current inner shrinking circle radius to replace toRadiusSquare.
  // Then in the circuit we check that innerCircleRadius <= toPlanet.x^2 + toPlanet.y^2, while we
  // check innerCircleRadius >= curInnerCircleRadius in the contract.
  // But this value is highly related to the determination of a planet's type. Then the best way is
  // to move this determination into the circuit.
  uint256 toRadiusSquare;
}

library MoveInputLib {
  function validate(MoveInput memory input) internal view {
    if (input.universeRadius > UniverseConfig.getRadius()) {
      revert Errors.InvalidMoveInput(4);
    }
    SnarkConfigData memory config = SnarkConfig.get();
    if (input.mimcHashKey != config.planetHashKey) {
      revert Errors.InvalidMoveInput(5);
    }
    if (TempConfigSet.getBiomeCheck()) {
      if (input.spaceTypeKey != config.biomeBaseKey) {
        revert Errors.InvalidMoveInput(6);
      }
    } else {
      if (input.spaceTypeKey != config.spaceTypeKey) {
        revert Errors.InvalidMoveInput(6);
      }
    }
    if (input.perlinLengthScale != config.perlinLengthScale) {
      revert Errors.InvalidMoveInput(7);
    }
    if (input.perlinMirrorX != config.perlinMirrorX) {
      revert Errors.InvalidMoveInput(8);
    }
    if (input.perlinMirrorY != config.perlinMirrorY) {
      revert Errors.InvalidMoveInput(9);
    }
    if (input.toRadiusSquare < InnerCircle.getRadius() ** 2) {
      revert Errors.InvalidMoveInput(10);
    }
  }

  function genFrom(MoveInput memory input, uint256[11] memory rawInput) internal pure {
    input.fromPlanetHash = rawInput[0];
    input.toPlanetHash = rawInput[1];
    input.toPerlin = rawInput[2];
    input.universeRadius = rawInput[3];
    input.distance = rawInput[4];
    input.mimcHashKey = rawInput[5];
    input.spaceTypeKey = rawInput[6];
    input.perlinLengthScale = rawInput[7];
    input.perlinMirrorX = rawInput[8];
    input.perlinMirrorY = rawInput[9];
    input.toRadiusSquare = rawInput[10];
  }

  function flatten(MoveInput memory input) internal pure returns (uint256[] memory res) {
    res = new uint256[](11);
    res[0] = input.fromPlanetHash;
    res[1] = input.toPlanetHash;
    res[2] = input.toPerlin;
    res[3] = input.universeRadius;
    res[4] = input.distance;
    res[5] = input.mimcHashKey;
    res[6] = input.spaceTypeKey;
    res[7] = input.perlinLengthScale;
    res[8] = input.perlinMirrorX;
    res[9] = input.perlinMirrorY;
    res[10] = input.toRadiusSquare;
  }
}
