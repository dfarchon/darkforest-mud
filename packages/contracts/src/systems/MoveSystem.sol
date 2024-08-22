// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "../codegen/world/IWorld.sol";
import { Errors } from "../interfaces/errors.sol";
import { Proof } from "../lib/SnarkProof.sol";
import { MoveInput } from "../lib/VerificationInput.sol";

contract MoveSystem is System, Errors {
  /**
   * @notice Moves population between planets. Silver and at most 1 piece of artifact can be moved along with the population.
   * @dev We divide the scenario of triggering a cannon from general population move.
   * @param _proof Snark proof.
   * @param _input MoveInput.
   * @param _population Amount of population moved.
   * @param _silver Amount of silver moved along with the population.
   * @param _artifact Id of artifact moved along with the population.
   */
  function move(
    Proof calldata _proof,
    MoveInput calldata _input,
    uint256 _population,
    uint256 _silver,
    uint256 _artifact
  ) public returns (uint256) {
    IWorld world = IWorld(_world());
    world.df__tickOncePerBlock();

    _input.validate();
    if (!IWorld(_world()).df__verifyMoveProof(_proof, _input)) {
      revert Errors.InvalidMoveProof();
    }
  }
}
