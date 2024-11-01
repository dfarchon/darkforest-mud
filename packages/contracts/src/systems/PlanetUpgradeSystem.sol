// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "../codegen/world/IWorld.sol";
import { Planet } from "../lib/Planet.sol";
import { DFUtils } from "../lib/DFUtils.sol";

contract PlanetUpgradeSystem is System {
  /**
   * @notice Upgrade a planet. Supports fast upgrading.
   * @param planetHash Planet hash
   * @param rangeUpgrades Times of range upgrades
   * @param speedUpgrades Times of speed upgrades
   * @param defenseUpgrades Times of defense upgrades
   */

  function upgradePlanet(
    uint256 planetHash,
    uint256 rangeUpgrades,
    uint256 speedUpgrades,
    uint256 defenseUpgrades
  ) public {
    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);
    address executor = _msgSender();
    planet.upgrade(executor, rangeUpgrades, speedUpgrades, defenseUpgrades);
    planet.writeToStore();
  }

  /**
   * @notice For backward compatibility.
   * @param _location Planet location
   * @param _branch Branch to upgrade. 0 for defense, 1 for range, 2 for speed
   */
  function legacyUpgradePlanet(uint256 _location, uint256 _branch) public {
    assert(_branch < 3);
    if (_branch == 0) {
      upgradePlanet(_location, 0, 0, 1);
    } else if (_branch == 1) {
      upgradePlanet(_location, 1, 0, 0);
    } else {
      upgradePlanet(_location, 0, 1, 0);
    }
  }
}
