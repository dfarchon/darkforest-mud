// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Ticker } from "codegen/tables/Ticker.sol";
import { ArtifactOwner } from "codegen/tables/ArtifactOwner.sol";
import { Artifact } from "libraries/Artifact.sol";

contract ArtifactReadSystem is BaseSystem {
  /**
   * @notice Read an artifact from storage and update its status to the tick in state.
   * !IMPORTANT! This function is not recommended for use. Artifacts are recommended to
   * be read via {planet.mustGetArtifact(artifactId)}.
   * It does not update the ticker nor the planet where the artifact is located.
   * Then an artifact with a non-zero owner may not be on that planet. It may be on a move.
   * @dev Used for reading artifacts.
   * @param artifactId Artifact ID
   */
  function readArtifact(uint256 artifactId) public view returns (Artifact memory artifact) {
    artifact.planetHash = uint256(ArtifactOwner.get(uint32(artifactId)));
    artifact.id = artifactId;
    artifact.readFromStore(Ticker.getTickNumber());
  }
}
