// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "../codegen/world/IWorld.sol";
import { Errors } from "../interfaces/errors.sol";
import { Planet } from "../lib/Planet.sol";
import { PlanetType, SpaceType, Biome } from "../codegen/common.sol";
import { PlayerWithdrawSilver } from "../codegen/index.sol";

contract PlanetWithdrawSilverSystem is System, Errors {
  /**
   * @notice Withdraw silver on Spacetime RIP.
   * @param planetHash Planet hash
   * @param silverToWithdraw Silver amount to withdraw
   */

  function withdrawSilver(uint256 planetHash, uint256 silverToWithdraw) public {
    IWorld world = IWorld(_world());
    world.df__tick();

    Planet memory planet = world.df__readPlanet(planetHash);
    address executor = _msgSender();
    uint256 playerWithdrawSilverAmount = PlayerWithdrawSilver.get(executor);

    if (planet.owner != executor) revert Errors.NotPlanetOwner();
    if (planet.planetType != PlanetType.SPACETIME_RIP) revert Errors.InvalidPlanetType();
    if (planet.silver < silverToWithdraw) revert Errors.InsufficientSilverOnPlanet();
    if (planet.silverCap > silverToWithdraw * 5) revert Errors.WithdrawAmountTooLow();

    planet.silver -= silverToWithdraw;
    playerWithdrawSilverAmount += silverToWithdraw;

    planet.writeToStore();
    PlayerWithdrawSilver.set(executor, playerWithdrawSilverAmount);
  }
}
