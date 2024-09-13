// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

interface Errors {
  // player system
  error AlreadyRegistered();
  error NotRegistered();
  error NameAlreadyTaken();
  error BurnerAlreadyTaken();
  error PlayerLimitReached();
  error AlreadyRegisteredAsBurner();
  error AlreadySpawned();
  error InvalidSpawnPlanet();

  // verify system
  error InvalidMoveProof();
  error InvalidProofInput(uint8 index); // 255 for snark and perlin config

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
  error InvalidRevealProof();
  error RevealTooOften();
}
