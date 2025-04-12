// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { BaseTest } from "../BaseTest.t.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { Math } from "openzeppelin-contracts/contracts/utils/math/Math.sol";

import { IWorld } from "../../src/codegen/world/IWorld.sol";
import { Planet as PlanetTable, ProspectedPlanet, PlanetArtifact, ArtifactOwner, Round } from "../../src/codegen/index.sol";
import { Counter, Artifact as ArtifactTable, ArtifactData, PlanetConstants, Ticker, TempConfigSet } from "../../src/codegen/index.sol";
import { RevealedPlanet } from "../../src/codegen/index.sol";
import { Errors } from "../../src/interfaces/errors.sol";
import { Proof } from "../../src/lib/SnarkProof.sol";
import { RevealInput, MoveInput } from "../../src/lib/VerificationInput.sol";
import { Planet } from "../../src/lib/Planet.sol";
import { EffectLib } from "../../src/lib/Effect.sol";
import { PlanetType, SpaceType, ArtifactStatus, ArtifactRarity, PlanetStatus, PlanetFlagType } from "../../src/codegen/common.sol";
import { Artifact, ArtifactLib } from "../../src/lib/Artifact.sol";
import { ARTIFACT_INDEX as PINK_BOMB_INDEX } from "../../src/modules/atfs/PinkBomb/constant.sol";
import { GENERAL_ACTIVATE } from "../../src/modules/atfs/PinkBomb/constant.sol";
import { PinkBombSystem } from "../../src/modules/atfs/PinkBomb/PinkBombSystem.sol";
import { PinkBomb, PinkBombData } from "../../src/modules/atfs/PinkBomb/tables/PinkBomb.sol";
import { _artifactIndexToNamespace, _artifactProxySystemId } from "../../src/modules/atfs/utils.sol";
import { _pinkBombTableId } from "../../src/modules/atfs/PinkBomb/utils.sol";
import "forge-std/console.sol";

contract PinkBombTest is BaseTest {
  using EffectLib for Planet;

  uint256 p = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

  function setUp() public virtual override {
    super.setUp();
    vm.startPrank(admin);
    // set round number 0
    Round.set(0);
    // skip snark check
    TempConfigSet.setSkipProofCheck(true);
    IWorld(worldAddress).df__unpause();
    IWorld(worldAddress).df__createPlanet(1, address(1), 0, 1, PlanetType.FOUNDRY, SpaceType.NEBULA, 300000, 10000, 0);
    IWorld(worldAddress).df__createPlanet(2, address(2), 0, 1, PlanetType.PLANET, SpaceType.NEBULA, 300000, 10000, 0);
    IWorld(worldAddress).df__createPlanet(3, address(2), 0, 1, PlanetType.PLANET, SpaceType.NEBULA, 300000, 10000, 0);
    Counter.setArtifact(2);
    PlanetArtifact.set(bytes32(uint256(1)), (1 << 32) + 2);
    ArtifactOwner.set(1, bytes32(uint256(1)));
    ArtifactOwner.set(2, bytes32(uint256(1)));
    ArtifactTable.set(1, PINK_BOMB_INDEX, ArtifactRarity.COMMON, ArtifactStatus.DEFAULT, 0, 0, 0);
    ArtifactTable.set(2, PINK_BOMB_INDEX, ArtifactRarity.COMMON, ArtifactStatus.DEFAULT, 0, 0, 0);
    vm.stopPrank();
  }

  function testChargePinkBomb() public {
    Artifact memory artifact = IWorld(worldAddress).df__readArtifact(1);
    assertTrue(artifact.status == ArtifactStatus.DEFAULT);
    Proof memory proof;
    RevealInput memory input;
    input.planetHash = 2;
    input.x = 200;
    input.y = 200;
    vm.prank(address(1));
    IWorld(worldAddress).df__chargeArtifact(1, 1, abi.encode(proof, input));
    assertEq(RevealedPlanet.getX(bytes32(uint256(2))), 200);
    assertEq(RevealedPlanet.getY(bytes32(uint256(2))), 200);
    Planet memory planet = IWorld(worldAddress).df__readPlanet(1);
    assertEq(planet.checkFlag(PlanetFlagType.OFFENSIVE_ARTIFACT), true);
    artifact = IWorld(worldAddress).df__readArtifact(1);
    assertTrue(artifact.status == ArtifactStatus.CHARGING);
    assertTrue(artifact.chargeTick == Ticker.getTickNumber());
    ResourceId pinkBombResourceId = _pinkBombTableId(_artifactIndexToNamespace(PINK_BOMB_INDEX));
    PinkBombData memory pinkBomb = PinkBomb.get(pinkBombResourceId, 1);
    assertEq(pinkBomb.target, bytes32(uint256(2)));

    // charge another pink bomb
    vm.prank(address(1));
    vm.expectRevert(Errors.ArtifactNotAvailable.selector);
    IWorld(worldAddress).df__chargeArtifact(1, 2, abi.encode(proof, input));
  }

  function testShutdownPinkBomb() public {
    Proof memory proof;
    RevealInput memory input;
    input.planetHash = 2;
    input.x = 200;
    input.y = 200;
    vm.prank(address(1));
    IWorld(worldAddress).df__chargeArtifact(1, 1, abi.encode(proof, input));
    vm.warp(block.timestamp + 100);
    vm.roll(block.number + 100);
    vm.prank(address(1));
    IWorld(worldAddress).df__shutdownArtifact(1, 1);
    Artifact memory artifact = IWorld(worldAddress).df__readArtifact(1);
    assertTrue(artifact.status == ArtifactStatus.COOLDOWN);
    assertTrue(artifact.cooldownTick == Ticker.getTickNumber());
    PinkBombData memory pinkBomb = PinkBomb.get(_pinkBombTableId(_artifactIndexToNamespace(PINK_BOMB_INDEX)), 1);
    assertEq(pinkBomb.target, bytes32(""));
  }

  function testActivatePinkBomb() public {
    Proof memory proof;
    RevealInput memory input;
    input.planetHash = 2;
    input.x = 200;
    input.y = 200;
    vm.prank(address(1));
    IWorld(worldAddress).df__chargeArtifact(1, 1, abi.encode(proof, input));
    Artifact memory artifact = IWorld(worldAddress).df__readArtifact(1);

    vm.warp(block.timestamp + artifact.charge / Ticker.getTickRate() + 1);
    input.planetHash = 1;
    input.x = 5000;
    input.y = 5000;
    vm.expectRevert(PinkBombSystem.PinkBombInsufficientPopulationToLaunch.selector);
    vm.prank(address(1));
    IWorld(worldAddress).df__activateArtifact(1, 1, abi.encode(proof, input));

    input.x = 100;
    input.y = 100;
    uint256 distance = Math.sqrt(100 * 100 + 100 * 100);
    vm.prank(address(1));
    IWorld(worldAddress).df__activateArtifact(1, 1, abi.encode(proof, input));
    assertEq(RevealedPlanet.getX(bytes32(uint256(1))), 100);
    assertEq(RevealedPlanet.getY(bytes32(uint256(1))), 100);
    artifact = IWorld(worldAddress).df__readArtifact(1);
    assertTrue(artifact.status == ArtifactStatus.BROKEN);
    assertTrue(artifact.activateTick == Ticker.getTickNumber());
    ResourceId pinkBombResourceId = _pinkBombTableId(_artifactIndexToNamespace(PINK_BOMB_INDEX));
    PinkBombData memory pinkBomb = PinkBomb.get(pinkBombResourceId, 1);
    Planet memory planet = IWorld(worldAddress).df__readPlanet(1);
    assertEq(planet.checkFlag(PlanetFlagType.OFFENSIVE_ARTIFACT), false);
    planet.applyEffect(GENERAL_ACTIVATE);
    assertEq(pinkBomb.target, bytes32(uint256(2)));
    assertEq(pinkBomb.arrivalTick, Ticker.getTickNumber() + (distance * 100) / planet.speed);
  }

  function testDestroyPlanet() public {
    // charge and activate pink bomb
    Proof memory proof;
    RevealInput memory input;
    input.planetHash = 2;
    input.x = 200;
    input.y = 200;
    vm.prank(address(1));
    IWorld(worldAddress).df__chargeArtifact(1, 1, abi.encode(proof, input));
    Artifact memory artifact = IWorld(worldAddress).df__readArtifact(1);
    vm.warp(block.timestamp + artifact.charge / Ticker.getTickRate() + 1);
    input.planetHash = 1;
    input.x = 100;
    input.y = 100;
    vm.prank(address(1));
    IWorld(worldAddress).df__activateArtifact(1, 1, abi.encode(proof, input));

    // destroy planet
    //  out of distroy window
    vm.expectRevert(PinkBombSystem.PinkBombOutOfDestroyWindow.selector);
    IWorld(worldAddress).call(
      _artifactProxySystemId(_artifactIndexToNamespace(PINK_BOMB_INDEX)),
      abi.encodeWithSelector(PinkBombSystem.destroy.selector, 1, proof, input)
    );

    // out of range
    ResourceId pinkBombResourceId = _pinkBombTableId(_artifactIndexToNamespace(PINK_BOMB_INDEX));
    PinkBombData memory pinkBomb = PinkBomb.get(pinkBombResourceId, 1);
    vm.warp(block.timestamp + (pinkBomb.arrivalTick - pinkBomb.departureTick) / Ticker.getTickRate() + 1);
    input.planetHash = 3;
    input.x = 701;
    input.y = 200;
    vm.expectRevert(PinkBombSystem.PinkBombOutOfRange.selector);
    IWorld(worldAddress).call(
      _artifactProxySystemId(_artifactIndexToNamespace(PINK_BOMB_INDEX)),
      abi.encodeWithSelector(PinkBombSystem.destroy.selector, 1, proof, input)
    );

    input.x = 700;
    input.y = 200;
    IWorld(worldAddress).call(
      _artifactProxySystemId(_artifactIndexToNamespace(PINK_BOMB_INDEX)),
      abi.encodeWithSelector(PinkBombSystem.destroy.selector, 1, proof, input)
    );
    Planet memory planet = IWorld(worldAddress).df__readPlanet(3);
    assertTrue(planet.status == PlanetStatus.DESTROYED);

    vm.prank(address(3));
    vm.expectRevert(Errors.PlanetNotAvailable.selector);
    _move(3, 1, 100, 100000, 1000, 0);
  }

  function _move(
    uint256 from,
    uint256 to,
    uint256 distance,
    uint256 population,
    uint256 silver,
    uint256 artifact
  ) internal {
    Proof memory proof;
    MoveInput memory input;
    input.fromPlanetHash = from;
    input.toPlanetHash = to;
    input.distance = distance;
    IWorld(worldAddress).df__move(proof, input, population, silver, artifact);
  }
}
