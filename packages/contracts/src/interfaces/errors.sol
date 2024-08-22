// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

interface Errors {
  // move system
  error InvalidMoveProof();
  error InvalidMoveInput(uint8 index);

  // tick system
  error Paused();
  error NotPaused();

  // planet system
  error InvalidPlanetHash();
}
