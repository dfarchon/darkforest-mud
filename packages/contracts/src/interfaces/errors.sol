// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

interface Errors {
  // ex. error AlreadyRegistered's selector = bytes4(keccak256("AlreadyRegistered()"));

  // player system
  error AlreadyRegistered(); // 0x3a81d6fc
  error NotRegistered(); // 0xaba47339
  error NameAlreadyTaken(); // 0x35c1bb34
  error BurnerAlreadyTaken(); // 0xd240a556
  error PlayerLimitReached(); // 0x7eed032c
  error AlreadyRegisteredAsBurner(); // 0xb7887dbe
  error AlreadySpawned(); // 0xb7298922
  error InvalidSpawnPlanet(); // 0x486b36b3

  // verify system
  error InvalidMoveProof(); // 0x217623c0
  error InvalidProofInput(uint8 index); // 255 for snark and perlin config, 0xde56fcb9

  // move system
  error NotPlanetOwner(); // 0xab2bcfd3
  error NotEnoughPopulation(); // 0xb4560519
  error NotEnoughSilver(); // 0xb973ef98
  error NotArtifactOwner(); // 0xa4c7eb90
  error ReachMaxMoveToLimit(uint8 limit); // 0x0edddad6
  error ArtifactStorageFull(); // 0xb3643b72
  error ArtifactNotOnPlanet(); // 0x37a29a4e

  // tick system
  error Paused(); // 0x9e87fac8
  error NotPaused(); // 0x6cd60201

  // planet system
  error InvalidPlanetHash(); // 0xf4cf9e37
  error UnknownPlanetType(); // 0xa6fa3da7
  error InvalidUpgradeTarget(); // 0x0ec7b300
  error UpgradeExceedMaxLevel(); // 0x1d245dc9
  error NotEnoughSilverToUpgrade(); // 0x3c1137b2

  // reveal system
  error InvalidRevealProof(); // 0x5d655004
  error RevealTooOften(); // 0xbdbe7784

  // prospect system
  error InvalidProspectTarget(); // 0x341e4b4d
  error PlanetAlreadyProspected(); // 0x56887924
  error InvalidBiomebaseProof(); // 0x128087c4
  error PlanetNotProspected(); // 0x9b8b75ee
  error PlanetAlreadyExplored(); // 0x46b8aa3d
  error UnkonwnArtifactType(); // 0xe5d5eab9
}
