// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "../codegen/world/IWorld.sol";
import { Errors } from "../interfaces/errors.sol";
import { Ticker, RevealedPlanet, LastReveal, TempConfigSet } from "../codegen/index.sol";
import { Planet } from "../lib/Planet.sol";
import { Proof } from "../lib/SnarkProof.sol";
import { RevealInput } from "../lib/VerificationInput.sol";

contract RevealPlanetSystem is System, Errors {
  function revealLocation(Proof memory proof, RevealInput memory input) public {
    IWorld world = IWorld(_world());
    world.df__tick();

    if (!world.df__verifyRevealProof(proof, input)) {
      revert Errors.InvalidRevealProof();
    }

    address player = _msgSender();
    uint256 currentTick = Ticker.getTickNumber();
    if (LastReveal.get(player) + TempConfigSet.getRevealCd() <= currentTick) {
      LastReveal.set(player, uint64(currentTick));
    } else {
      revert Errors.RevealTooOften();
    }

    int256 x = _getIntFromUintCoords(input.x);
    int256 y = _getIntFromUintCoords(input.y);
    Planet memory planet = world.df__readPlanet(input.planetHash, input.perlin, uint256(x * x + y * y));

    RevealedPlanet.set(bytes32(input.planetHash), int32(x), int32(y), _msgSender());
    planet.writeToStore();
  }

  function revealLocation(
    uint256[2] memory _a,
    uint256[2][2] memory _b,
    uint256[2] memory _c,
    uint256[9] memory _input
  ) public {
    Proof memory proof;
    proof.genFrom(_a, _b, _c);
    RevealInput memory input;
    input.genFrom(_input);
    revealLocation(proof, input);
  }

  function _getIntFromUintCoords(uint256 _in) internal pure returns (int256 out) {
    uint256 p = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    assert(_in < p);
    if (_in > (p / 2)) {
      return 0 - int256(p - _in);
    }
    return int256(_in);
  }
}
