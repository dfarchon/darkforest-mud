// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Ticker } from "codegen/tables/Ticker.sol";
import { RevealedPlanet } from "codegen/tables/RevealedPlanet.sol";
import { LastReveal } from "codegen/tables/LastReveal.sol";
import { TempConfigSet } from "codegen/tables/TempConfigSet.sol";
import { Planet } from "libraries/Planet.sol";
import { Proof } from "libraries/SnarkProof.sol";
import { RevealInput } from "libraries/VerificationInput.sol";
import { DFUtils } from "libraries/DFUtils.sol";

contract PlanetRevealSystem is BaseSystem {
  function revealLocation(Proof memory proof, RevealInput memory input) public entryFee {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    DFUtils.verify(worldAddress, proof, input);

    address player = _msgSender();
    uint256 currentTick = Ticker.getTickNumber();

    if (LastReveal.get(player) == 0 || LastReveal.get(player) + TempConfigSet.getRevealCd() <= currentTick) {
      LastReveal.set(player, uint64(currentTick));
    } else {
      revert RevealTooOften();
    }

    int256 x = _getIntFromUintCoords(input.x);
    int256 y = _getIntFromUintCoords(input.y);
    Planet memory planet = DFUtils.readAnyPlanet(worldAddress, input.planetHash, input.perlin, uint256(x * x + y * y));
    if (planet.owner != planet.junkOwner) {
      revert PlanetOwnershipMismatch();
    }
    RevealedPlanet.set(bytes32(input.planetHash), int32(x), int32(y), _msgSender());
    planet.writeToStore();
  }

  function legacyRevealLocation(
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
