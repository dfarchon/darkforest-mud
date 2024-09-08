// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

interface Errors {
  // verify system
  error InvalidMoveProof();
  error InvalidMoveInput(uint8 index);

  // move system
  error NotPlanetOwner();
  error NotEnoughPopulation();
  error NotEnoughSilver();
  error ReachMaxMoveToLimit(uint8 limit);

  // tick system
  error Paused();
  error NotPaused();

  // planet system
  error InvalidPlanetHash();
  error UnknownPlanetType();
  error InvalidUpgradeTarget();
  error UpgradeExceedMaxLevel();
  error NotEnoughSilverToUpgrade();
}
