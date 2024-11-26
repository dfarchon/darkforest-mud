// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { Errors } from "../interfaces/errors.sol";
import { Ticker, ArtifactOwner } from "../codegen/index.sol";
import { Planet } from "../lib/Planet.sol";
import { Artifact } from "../lib/Artifact.sol";

contract ArtifactReadSystem is System, Errors {
  /**
   * @notice Read an artifact from storage and update its status to the current tick.
   * @dev Used for reading artifacts.
   * @param artifactId Artifact ID
   */
  function readArtifact(uint256 artifactId) public view returns (Artifact memory artifact) {
    artifact.planetHash = uint256(ArtifactOwner.get(uint32(artifactId)));
    artifact.id = artifactId;
    artifact.readFromStore(Ticker.getTickNumber());
  }

  // /**
  //  * @notice Read an artifact from a planet and update its status to the planet's last update tick.
  //  * @dev Used for getting an artifact from a planet.
  //  * @param artifactId Artifact ID
  //  */
  // function readArtifactFromPlanet(
  //   Planet memory planet,
  //   uint256 artifactId
  // ) public view returns (Artifact memory artifact) {
  //   return planet.mustGetArtifact(artifactId);
  // }
}
