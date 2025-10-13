// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

uint8 constant ARTIFACT_INDEX = 5;

bytes16 constant WORMHOLE_DEST_TABLE_NAME = "WormholeDest";
bytes16 constant WORMHOLE_RECORD_TABLE_NAME = "WormholeRecord";

// Material consumption rates for wormhole activation and maintenance
uint256 constant WORMHOLE_ACTIVATION_MYCELIUM_COST = 100000;
uint256 constant WORMHOLE_ACTIVATION_SANDGLASS_COST = 50000;
uint256 constant WORMHOLE_MAINTENANCE_MYCELIUM_RATE = 10000;
