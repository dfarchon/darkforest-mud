// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { BaseSystem } from "systems/internal/BaseSystem.sol";
import { GPTTokens } from "codegen/index.sol";

import { SystemRegistry } from "@latticexyz/world/src/codegen/tables/SystemRegistry.sol";
import { RevenueStats } from "codegen/tables/RevenueStats.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";

contract GPTTokensSystem is BaseSystem {
  uint256 public creditPrice = 0.00001 ether; // Price for GPT tokens

  event TokensSpent(address indexed user, uint256 amount);

  /**
   * @notice Allows users to buy GPT tokens for 0.00001 ETH per token.
   * @param amount Number of GPT tokens to buy
   */
  function buyGPTTokens(uint256 amount) public payable {
    // Check if enough ETH is sent
    if (_msgValue() < amount * creditPrice) revert NotEnoughETH();

    // Update the player's GPT token balance
    address executor = _msgSender();
    GPTTokens.set(executor, GPTTokens.get(executor) + amount);

    ResourceId resourceId = SystemRegistry.get(address(this));
    bytes32 key = ResourceId.unwrap(resourceId);
    uint256 amount = RevenueStats.get(key) + _msgValue();
    RevenueStats.set(key, amount);
  }

  /**
   * @notice Allows users to spend 1 GPT token.
   */
  function spendGPTTokens() public {
    address executor = _msgSender();
    uint256 executorAmount = GPTTokens.get(executor);

    // Check if the player has at least 1 GPT token
    if (executorAmount < 1) revert NotEnoughGPTTokens();

    // Deduct 1 GPT token
    GPTTokens.set(executor, executorAmount - 1);
    // Emit event
    emit TokensSpent(executor, 1);
  }

  /**
   * @notice Allows users to send GPT tokens to another player.
   * @param player Address of the recipient
   * @param amount Number of GPT tokens to send
   */
  function sendGPTTokens(address player, uint256 amount) public {
    address executor = _msgSender();
    uint256 executorAmount = GPTTokens.get(executor);

    // Check if the sender has enough tokens
    if (executorAmount < amount) revert NotEnoughGPTTokens();

    // Deduct tokens from the sender and add to the recipient
    GPTTokens.set(executor, executorAmount - amount);
    GPTTokens.set(player, GPTTokens.get(player) + amount);
  }
}
