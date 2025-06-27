// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { IBaseWorld } from "@latticexyz/world/src/codegen/interfaces/IBaseWorld.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";
import { TickSystem } from "systems/internal/TickSystem.sol";
import { IPlanetReadSystem } from "codegen/world/IPlanetReadSystem.sol";
import { IPlanetWriteSystem } from "codegen/world/IPlanetWriteSystem.sol";
import { VerifySystem } from "systems/internal/VerifySystem.sol";
import { Proof } from "libraries/SnarkProof.sol";
import { MoveInput, SpawnInput, RevealInput, BiomebaseInput } from "libraries/VerificationInput.sol";
import { Planet } from "libraries/Planet.sol";
import { Ticker, TickerData } from "codegen/tables/Ticker.sol";
import { PlanetStatus } from "codegen/common.sol";
import { Errors } from "interfaces/errors.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";

bytes14 constant DF_NAMESPACE = "df";

bytes16 constant TICK_SYSMTEM_NAME = "TickSystem";
bytes16 constant PLANET_READ_SYSTEM_NAME = "PlanetReadSystem";
bytes16 constant VERIFY_SYSTEM_NAME = "VerifySystem";

bytes16 constant MOVE_SYSTEM_NAME = "MoveSystem";
bytes16 constant PLANET_UPGRADE_SYSTEM_NAME = "PlanetUpgradeSys";
bytes16 constant ARTIFACT_CREATE_SYSTEM_NAME = "ArtifactCreateSy";
bytes16 constant ARTIFACT_SYSTEM_NAME = "ArtifactSystem";
bytes16 constant PLANET_WITHDRAW_SILVER_SYSTEM_NAME = "PlanetWithdrawSi";
bytes16 constant PLANET_EMOJI_SYSTEM_NAME = "PlanetEmojiSyste";

library DFUtils {
  /**
   * Used to save gas.
   */
  function tick(address worldAddress) internal {
    IBaseWorld(worldAddress).call(
      WorldResourceIdLib.encode({ typeId: RESOURCE_SYSTEM, namespace: DF_NAMESPACE, name: TICK_SYSMTEM_NAME }),
      abi.encodeWithSelector(TickSystem.tick.selector)
    );
  }

  /**
   * Used to save gas.
   */
  function verify(address worldAddress, Proof memory proof, MoveInput memory input) internal {
    bytes memory data = IBaseWorld(worldAddress).call(
      WorldResourceIdLib.encode({ typeId: RESOURCE_SYSTEM, namespace: DF_NAMESPACE, name: VERIFY_SYSTEM_NAME }),
      abi.encodeWithSelector(VerifySystem.verifyMoveProof.selector, proof, input)
    );
    if (abi.decode(data, (bool)) == false) {
      revert Errors.InvalidMoveProof();
    }
  }

  function verify(address worldAddress, Proof memory proof, SpawnInput memory input) internal {
    bytes memory data = IBaseWorld(worldAddress).call(
      WorldResourceIdLib.encode({ typeId: RESOURCE_SYSTEM, namespace: DF_NAMESPACE, name: VERIFY_SYSTEM_NAME }),
      abi.encodeWithSelector(VerifySystem.verifySpawnProof.selector, proof, input)
    );
    if (abi.decode(data, (bool)) == false) {
      revert Errors.InvalidSpawnProof();
    }
  }

  function verify(address worldAddress, Proof memory proof, RevealInput memory input) internal {
    bytes memory data = IBaseWorld(worldAddress).call(
      WorldResourceIdLib.encode({ typeId: RESOURCE_SYSTEM, namespace: DF_NAMESPACE, name: VERIFY_SYSTEM_NAME }),
      abi.encodeWithSelector(VerifySystem.verifyRevealProof.selector, proof, input)
    );
    if (abi.decode(data, (bool)) == false) {
      revert Errors.InvalidRevealProof();
    }
  }

  function verify(address worldAddress, Proof memory proof, BiomebaseInput memory input) internal {
    bytes memory data = IBaseWorld(worldAddress).call(
      WorldResourceIdLib.encode({ typeId: RESOURCE_SYSTEM, namespace: DF_NAMESPACE, name: VERIFY_SYSTEM_NAME }),
      abi.encodeWithSelector(VerifySystem.verifyBiomebaseProof.selector, proof, input)
    );
    if (abi.decode(data, (bool)) == false) {
      revert Errors.InvalidBiomebaseProof();
    }
  }

  /**
   * Used to add global checks based on planet reading system.
   */
  function readInitedPlanet(address worldAddress, uint256 planetHash) internal view returns (Planet memory planet) {
    // Note.
    // Use World.call would cost more gas due to manually decoding the returned planet data.
    planet = IPlanetReadSystem(worldAddress).df__readPlanet(planetHash);
    if (planet.isInitialized) {
      revert Errors.PlanetNotInitialized();
    }
    if (planet.status != PlanetStatus.DEFAULT) {
      revert Errors.PlanetNotAvailable();
    }
  }

  /**
   * Used to add global checks based on planet reading system.
   */
  function readAnyPlanet(
    address worldAddress,
    uint256 planetHash,
    uint256 perlin,
    uint256 distanceSquare
  ) internal view returns (Planet memory planet) {
    planet = IPlanetReadSystem(worldAddress).df__readPlanet(planetHash, perlin, distanceSquare);
    if (planet.status != PlanetStatus.DEFAULT) {
      revert Errors.PlanetNotAvailable();
    }
  }

  /**
   * Used to write a planet to storage.
   */
  function writePlanet(address worldAddress, Planet memory planet) internal {
    IPlanetWriteSystem(worldAddress).df__writePlanet(planet);
  }

  /**
   * Used to get the current tick number.
   */
  function getCurrentTick() internal view returns (uint256) {
    TickerData memory ticker = Ticker.get();
    if (ticker.paused) {
      return ticker.tickNumber;
    }
    return ticker.tickNumber + uint64((block.timestamp - ticker.timestamp) * ticker.tickRate);
  }

  function getDFNamespace() internal pure returns (ResourceId) {
    return WorldResourceIdLib.encodeNamespace(DF_NAMESPACE);
  }

  function getSystemResourceId(bytes16 name) internal pure returns (ResourceId) {
    return WorldResourceIdLib.encode({ typeId: RESOURCE_SYSTEM, namespace: DF_NAMESPACE, name: name });
  }

  function isValidSystemResourceId(ResourceId resourceId) internal pure returns (bool) {
    return (ResourceId.unwrap(resourceId) == ResourceId.unwrap(getSystemResourceId(MOVE_SYSTEM_NAME)) ||
      ResourceId.unwrap(resourceId) == ResourceId.unwrap(getSystemResourceId(PLANET_UPGRADE_SYSTEM_NAME)) ||
      ResourceId.unwrap(resourceId) == ResourceId.unwrap(getSystemResourceId(ARTIFACT_CREATE_SYSTEM_NAME)) ||
      ResourceId.unwrap(resourceId) == ResourceId.unwrap(getSystemResourceId(ARTIFACT_SYSTEM_NAME)) ||
      ResourceId.unwrap(resourceId) == ResourceId.unwrap(getSystemResourceId(PLANET_WITHDRAW_SILVER_SYSTEM_NAME)) ||
      ResourceId.unwrap(resourceId) == ResourceId.unwrap(getSystemResourceId(PLANET_EMOJI_SYSTEM_NAME)));
  }
}
