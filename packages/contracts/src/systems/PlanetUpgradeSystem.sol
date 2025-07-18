// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Planet } from "libraries/Planet.sol";
import { DFUtils } from "libraries/DFUtils.sol";
import { GlobalStats } from "codegen/tables/GlobalStats.sol";
import { PlayerStats } from "codegen/tables/PlayerStats.sol";

contract PlanetUpgradeSystem is BaseSystem {
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
  ) public entryFee requireSameOwnerAndJunkOwner(planetHash) {
    GlobalStats.setUpgradePlanetCount(GlobalStats.getUpgradePlanetCount() + 1);
    PlayerStats.setUpgradePlanetCount(_msgSender(), PlayerStats.getUpgradePlanetCount(_msgSender()) + 1);

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
