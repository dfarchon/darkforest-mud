// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { TempConfigSet, TempConfigSetData } from "codegen/tables/TempConfigSet.sol";
import { UniverseConfig } from "codegen/tables/UniverseConfig.sol";
import { SnarkConfig, SnarkConfigData } from "codegen/tables/SnarkConfig.sol";
import { InnerCircle } from "codegen/tables/InnerCircle.sol";
import { Errors } from "interfaces/errors.sol";

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
      revert Errors.InvalidProofInput(3);
    }
    if (
      !CommonLib.checkSnarkAndPerlinConfig(
        input.mimcHashKey,
        input.spaceTypeKey,
        0,
        input.perlinLengthScale,
        input.perlinMirrorX,
        input.perlinMirrorY
      )
    ) {
      revert Errors.InvalidProofInput(255);
    }
    if (input.toRadiusSquare < InnerCircle.getRadius() ** 2) {
      revert Errors.InvalidProofInput(10);
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

using SpawnInputLib for SpawnInput global;

struct SpawnInput {
  uint256 planetHash;
  uint256 perlin;
  uint256 universeRadius;
  uint256 mimcHashKey;
  uint256 spaceTypeKey;
  uint256 perlinLengthScale;
  uint256 perlinMirrorX;
  uint256 perlinMirrorY;
  uint256 radiusSquare;
}

library SpawnInputLib {
  function validate(SpawnInput memory input) internal view {
    TempConfigSetData memory configSet = TempConfigSet.get();
    if (input.perlin < configSet.spawnPerlinMin || input.perlin >= configSet.spawnPerlinMax) {
      revert Errors.InvalidProofInput(1);
    }
    if (input.universeRadius > UniverseConfig.getRadius()) {
      revert Errors.InvalidProofInput(2);
    }
    if (
      !CommonLib.checkSnarkAndPerlinConfig(
        input.mimcHashKey,
        input.spaceTypeKey,
        0,
        input.perlinLengthScale,
        input.perlinMirrorX,
        input.perlinMirrorY
      )
    ) {
      revert Errors.InvalidProofInput(255);
    }
    if (input.radiusSquare < InnerCircle.getRadius() ** 2) {
      revert Errors.InvalidProofInput(8);
    }
  }

  function genFrom(SpawnInput memory input, uint256[9] memory rawInput) internal pure {
    input.planetHash = rawInput[0];
    input.perlin = rawInput[1];
    input.universeRadius = rawInput[2];
    input.mimcHashKey = rawInput[3];
    input.spaceTypeKey = rawInput[4];
    input.perlinLengthScale = rawInput[5];
    input.perlinMirrorX = rawInput[6];
    input.perlinMirrorY = rawInput[7];
    input.radiusSquare = rawInput[8];
  }

  function flatten(SpawnInput memory input) internal pure returns (uint256[] memory res) {
    res = new uint256[](9);
    res[0] = input.planetHash;
    res[1] = input.perlin;
    res[2] = input.universeRadius;
    res[3] = input.mimcHashKey;
    res[4] = input.spaceTypeKey;
    res[5] = input.perlinLengthScale;
    res[6] = input.perlinMirrorX;
    res[7] = input.perlinMirrorY;
    res[8] = input.radiusSquare;
  }
}

using RevealInputLib for RevealInput global;

struct RevealInput {
  uint256 planetHash;
  uint256 perlin;
  uint256 x;
  uint256 y;
  uint256 mimcHashKey;
  uint256 spaceTypeKey;
  uint256 perlinLengthScale;
  uint256 perlinMirrorX;
  uint256 perlinMirrorY;
}

library RevealInputLib {
  function validate(RevealInput memory input) internal view {
    if (
      !CommonLib.checkSnarkAndPerlinConfig(
        input.mimcHashKey,
        input.spaceTypeKey,
        0,
        input.perlinLengthScale,
        input.perlinMirrorX,
        input.perlinMirrorY
      )
    ) {
      revert Errors.InvalidProofInput(255);
    }
  }

  function genFrom(RevealInput memory input, uint256[9] memory rawInput) internal pure {
    input.planetHash = rawInput[0];
    input.perlin = rawInput[1];
    input.x = rawInput[2];
    input.y = rawInput[3];
    input.mimcHashKey = rawInput[4];
    input.spaceTypeKey = rawInput[5];
    input.perlinLengthScale = rawInput[6];
    input.perlinMirrorX = rawInput[7];
    input.perlinMirrorY = rawInput[8];
  }

  function flatten(RevealInput memory input) internal pure returns (uint256[] memory res) {
    res = new uint256[](9);
    res[0] = input.planetHash;
    res[1] = input.perlin;
    res[2] = input.x;
    res[3] = input.y;
    res[4] = input.mimcHashKey;
    res[5] = input.spaceTypeKey;
    res[6] = input.perlinLengthScale;
    res[7] = input.perlinMirrorX;
    res[8] = input.perlinMirrorY;
  }
}

using BiomebaseInputLib for BiomebaseInput global;

struct BiomebaseInput {
  uint256 planetHash;
  uint256 biomebase;
  uint256 mimcHashKey;
  uint256 biomebaseKey;
  uint256 perlinLengthScale;
  uint256 perlinMirrorX;
  uint256 perlinMirrorY;
}

library BiomebaseInputLib {
  function validate(BiomebaseInput memory input) internal view {
    if (
      !CommonLib.checkSnarkAndPerlinConfig(
        input.mimcHashKey,
        0,
        input.biomebaseKey,
        input.perlinLengthScale,
        input.perlinMirrorX,
        input.perlinMirrorY
      )
    ) {
      revert Errors.InvalidProofInput(255);
    }
  }

  function genFrom(BiomebaseInput memory input, uint256[7] memory rawInput) internal pure {
    input.planetHash = rawInput[0];
    input.biomebase = rawInput[1];
    input.mimcHashKey = rawInput[2];
    input.biomebaseKey = rawInput[3];
    input.perlinLengthScale = rawInput[4];
    input.perlinMirrorX = rawInput[5];
    input.perlinMirrorY = rawInput[6];
  }

  function flatten(BiomebaseInput memory input) internal pure returns (uint256[] memory res) {
    res = new uint256[](7);
    res[0] = input.planetHash;
    res[1] = input.biomebase;
    res[2] = input.mimcHashKey;
    res[3] = input.biomebaseKey;
    res[4] = input.perlinLengthScale;
    res[5] = input.perlinMirrorX;
    res[6] = input.perlinMirrorY;
  }
}

library CommonLib {
  function checkSnarkAndPerlinConfig(
    uint256 mimcHashKey,
    uint256 spaceTypeKey,
    uint256 biomebaseKey,
    uint256 perlinLengthScale,
    uint256 perlinMirrorX,
    uint256 perlinMirrorY
  ) internal view returns (bool) {
    SnarkConfigData memory config = SnarkConfig.get();
    if (mimcHashKey != config.planetHashKey) {
      return false;
    }
    if (spaceTypeKey != 0 && spaceTypeKey != config.spaceTypeKey) {
      return false;
    }
    if (biomebaseKey != 0 && biomebaseKey != config.biomeBaseKey) {
      return false;
    }
    if (perlinLengthScale != config.perlinLengthScale) {
      return false;
    }
    if (perlinMirrorX != config.perlinMirrorX) {
      return false;
    }
    if (perlinMirrorY != config.perlinMirrorY) {
      return false;
    }
    return true;
  }
}
