// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";

import { PlayersTable } from "../codegen/index.sol";

contract PlayerSpawnSystem is System {
  uint32 private totalSpawned;
  uint32 private MAX_TOTAL_MINT = 50;

  function mintPlayer(string memory name) public {
    // TODO require PLAY/PAUSE
    // TODO spawn plant init
    // payable mint require(msg.value == (MINT_COST), '"You must send a ETH value with this transaction."');

    require(bytes(name).length >= 1 && bytes(name).length <= 8, "1-8 length");

    string memory already = PlayersTable.getName(_msgSender());
    require(bytes(already).length == 0, "ONLY ONE SPAWN PER PLAYER ENABLED");

    // Check the total mint limit before minting
    require(totalSpawned < MAX_TOTAL_MINT, "MAX LIMIT OF PLAYERS 50 REACHED");

    PlayersTable.setName(_msgSender(), name);
    PlayersTable.setMinted(_msgSender(), block.number);

    // Update the total minted count
    totalSpawned++;
  }
}
