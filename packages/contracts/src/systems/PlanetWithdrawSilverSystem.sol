// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { Planet } from "libraries/Planet.sol";
import { PlanetType } from "codegen/common.sol";
import { PlayerWithdrawSilver } from "codegen/tables/PlayerWithdrawSilver.sol";
import { DFUtils } from "libraries/DFUtils.sol";
import { GuildUtils } from "libraries/GuildUtils.sol";
import { Guild } from "codegen/tables/Guild.sol";
import { GlobalStats } from "codegen/tables/GlobalStats.sol";
import { PlayerStats } from "codegen/tables/PlayerStats.sol";

contract PlanetWithdrawSilverSystem is BaseSystem {
  /**
   * @notice Withdraw silver on Spacetime RIP.
   * @param planetHash Planet hash
   * @param silverToWithdraw Silver amount to withdraw
   */
  function withdrawSilver(
    uint256 planetHash,
    uint256 silverToWithdraw
  ) public entryFee requireSameOwnerAndJunkOwner(planetHash) {
    GlobalStats.setWithdrawSilverCount(GlobalStats.getWithdrawSilverCount() + 1);
    PlayerStats.setWithdrawSilverCount(_msgSender(), PlayerStats.getWithdrawSilverCount(_msgSender()) + 1);

    address worldAddress = _world();
    DFUtils.tick(worldAddress);

    Planet memory planet = DFUtils.readInitedPlanet(worldAddress, planetHash);

    address executor = _msgSender();
    uint256 playerWithdrawSilverAmount = PlayerWithdrawSilver.get(executor);

    if (planet.owner != executor) revert NotPlanetOwner();
    if (planet.planetType != PlanetType.SPACETIME_RIP) revert InvalidPlanetType();
    if (planet.silver < silverToWithdraw) revert InsufficientSilverOnPlanet();
    if (planet.silverCap > silverToWithdraw * 5) revert WithdrawAmountTooLow();

    planet.silver -= silverToWithdraw;
    playerWithdrawSilverAmount += silverToWithdraw;

    uint8 guildId = GuildUtils.getCurrentGuildId(executor);
    if (guildId != 0) {
      Guild.setSilver(guildId, Guild.getSilver(guildId) + silverToWithdraw);
    }

    planet.writeToStore();
    PlayerWithdrawSilver.set(executor, playerWithdrawSilverAmount);
  }
}
