// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { ABDKMath64x64 } from "abdk-libraries-solidity/ABDKMath64x64.sol";
import { Math } from "openzeppelin-contracts/contracts/utils/math/Math.sol";
import { Planet } from "../../../lib/Planet.sol";
import { Artifact } from "../../../lib/Artifact.sol";
import { Errors } from "../../../interfaces/errors.sol";
import { ArtifactStatus, ArtifactRarity, PlanetStatus } from "../../../codegen/common.sol";
import { ArtifactProxySystem } from "../ArtifactProxySystem.sol";
import { EffectLib } from "../../../lib/Effect.sol";
import { ARTIFACT_INDEX, GENERAL_ACTIVATE } from "./constant.sol";
import { Proof } from "../../../lib/SnarkProof.sol";
import { RevealInput } from "../../../lib/VerificationInput.sol";
import { IWorld } from "../../../codegen/world/IWorld.sol";
import { Planet as PlanetTable } from "../../../codegen/index.sol";
import { RevealedPlanet, RevealedPlanetData, Artifact as ArtifactTable, Ticker } from "../../../codegen/index.sol";
import { PinkBomb, PinkBombData } from "./tables/PinkBomb.sol";
import { _pinkBombTableId } from "./utils.sol";

contract PinkBombSystem is ArtifactProxySystem {
  using EffectLib for Planet;

  error PinkBombLauncherMismatch(); // 0xa73715e9
  error PinkBombInsufficientPopulationToLaunch(); // 0x3d87952d
  error PinkBombOutOfDestroyWindow(); //0xbee205bf
  error PinkBombOutOfRange(); // 0x26d5a017
  error PinkBombNotLaunched(); // 0x738856e5

  uint32[] BOMB_RADIUS = [0, 500 * 500, 1000 * 1000, 1500 * 1500, 2000 * 2000, 2500 * 2500];

  uint32 DESTROY_WINDOW = 300;

  function getArtifactIndex() public pure override returns (uint8) {
    return ARTIFACT_INDEX;
  }

  function destroy(uint256 bombId, Proof memory proof, RevealInput memory input) public {
    // reveal destroyed planet
    if (!IWorld(_world()).df__verifyRevealProof(proof, input)) {
      revert Errors.InvalidRevealProof();
    }
    int256 x = _getIntFromUintCoords(input.x);
    int256 y = _getIntFromUintCoords(input.y);
    RevealedPlanet.set(bytes32(input.planetHash), int32(x), int32(y), _msgSender());

    // check bomb arrival tick
    ResourceId pinkBombTableId = _pinkBombTableId(_namespace());
    PinkBombData memory bomb = PinkBomb.get(pinkBombTableId, uint32(bombId));
    if (bomb.target == 0 || bomb.arrivalTick == 0) {
      revert PinkBombNotLaunched();
    }
    // TODO let tick function be accessible for everyone
    uint256 currentTick = Ticker.getTickNumber();
    if (currentTick < bomb.arrivalTick || currentTick >= bomb.arrivalTick + DESTROY_WINDOW) {
      revert PinkBombOutOfDestroyWindow();
    }

    // check distance
    RevealedPlanetData memory target = RevealedPlanet.get(bomb.target);
    int256 xDiff = (target.x - x);
    int256 yDiff = (target.y - y);
    uint256 distSquared = uint256(xDiff * xDiff + yDiff * yDiff);
    if (distSquared > BOMB_RADIUS[uint8(ArtifactTable.getRarity(uint32(bombId)))]) {
      revert PinkBombOutOfRange();
    }

    // destroy planet
    PlanetTable.setStatus(bytes32(input.planetHash), PlanetStatus.DESTROYED);
  }

  function _charge(Planet memory planet, Artifact memory artifact, bytes memory inputData) internal virtual override {
    super._charge(planet, artifact, inputData);

    (Proof memory proof, RevealInput memory input) = abi.decode(inputData, (Proof, RevealInput));
    if (!IWorld(_world()).df__verifyRevealProof(proof, input)) {
      revert Errors.InvalidRevealProof();
    }

    // reveal bomb target
    int256 x = _getIntFromUintCoords(input.x);
    int256 y = _getIntFromUintCoords(input.y);
    RevealedPlanet.set(bytes32(input.planetHash), int32(x), int32(y), planet.owner);

    PinkBomb.setTarget(_pinkBombTableId(_namespace()), uint32(artifact.id), bytes32(input.planetHash));
  }

  function _shutdown(Planet memory planet, Artifact memory artifact) internal virtual override {
    super._shutdown(planet, artifact);

    PinkBomb.setTarget(_pinkBombTableId(_namespace()), uint32(artifact.id), bytes32(0));
  }

  function _activate(Planet memory planet, Artifact memory artifact, bytes memory inputData) internal virtual override {
    super._activate(planet, artifact, inputData);

    (Proof memory proof, RevealInput memory input) = abi.decode(inputData, (Proof, RevealInput));
    if (!IWorld(_world()).df__verifyRevealProof(proof, input)) {
      revert Errors.InvalidRevealProof();
    }
    if (planet.planetHash != input.planetHash) {
      revert PinkBombLauncherMismatch();
    }

    // reveal bomb launcher
    int256 launcherX = _getIntFromUintCoords(input.x);
    int256 launcherY = _getIntFromUintCoords(input.y);
    RevealedPlanet.set(bytes32(input.planetHash), int32(launcherX), int32(launcherY), planet.owner);

    // apply effect before launching
    planet.applyEffect(GENERAL_ACTIVATE);

    // calculate distance and required population
    ResourceId pinkBombTableId = _pinkBombTableId(_namespace());
    RevealedPlanetData memory target = RevealedPlanet.get(PinkBomb.getTarget(pinkBombTableId, uint32(artifact.id)));
    uint256 distance;
    {
      int256 xDiff = (target.x - launcherX);
      int256 yDiff = (target.y - launcherY);
      distance = Math.sqrt(uint256(xDiff * xDiff + yDiff * yDiff));
    }
    uint256 requiredPopulation = _calPopulationForLaunching(planet, distance);
    if (planet.population <= requiredPopulation) {
      revert PinkBombInsufficientPopulationToLaunch();
    }
    planet.population -= requiredPopulation;

    // set bomb launch data
    PinkBomb.setDepartureTick(pinkBombTableId, uint32(artifact.id), uint64(planet.lastUpdateTick));
    PinkBomb.setArrivalTick(
      pinkBombTableId,
      uint32(artifact.id),
      uint64(planet.lastUpdateTick + (distance * 100) / planet.speed)
    );

    // remove effect after launching
    planet.removeEffect(GENERAL_ACTIVATE);
  }

  function _getIntFromUintCoords(uint256 _in) internal pure returns (int256 out) {
    uint256 p = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    assert(_in < p);
    if (_in > (p / 2)) {
      return 0 - int256(p - _in);
    }
    return int256(_in);
  }

  function _calPopulationForLaunching(
    Planet memory planet,
    uint256 distance
  ) internal pure returns (uint256 population) {
    int256 needed = ABDKMath64x64.mul(
      ABDKMath64x64.divu(planet.populationCap, 20),
      ABDKMath64x64.exp_2(ABDKMath64x64.divu(distance, planet.range))
    );
    population = ABDKMath64x64.toUInt(int128(needed));
  }
}
