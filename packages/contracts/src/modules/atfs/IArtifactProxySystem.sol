// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { Planet } from "../../lib/Planet.sol";
import { Artifact } from "../../lib/Artifact.sol";

interface IArtifactProxySystem {
  function getArtifactIndex() external view returns (uint8);

  function shutdown(Planet memory planet, Artifact memory artifact) external returns (Planet memory, Artifact memory);

  function charge(Planet memory planet, Artifact memory artifact) external returns (Planet memory, Artifact memory);

  function activate(
    Planet memory planet,
    Artifact memory artifact,
    bytes memory inputData
  ) external returns (Planet memory, Artifact memory);

  // function deactivate(Planet memory planet, Artifact memory artifact) external returns (Planet memory, Artifact memory);
}
