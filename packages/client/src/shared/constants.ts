import { hexToResource, resourceToHex } from "@latticexyz/common";
import { Entity } from "@latticexyz/recs";

import { EthAddress } from "./identifier";

export const WORLD_ADDRESS = "fixed world adress";
// REDSTONE
// todo explorer for garnet? 
export const NETWORK_EXPLORER = "https://explorer.redstone.xyz/";

export const DEFAULT_RPC = "https://rpc.garnet.redstone.xyz";

/**
 * The 0x0 Ethereum address, which is used for unowned planets, artifacts without an owner, etc.
 */
export const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000" as EthAddress;
export const LOW_BALANCE_THRESHOLD = BigInt("1000000000000000"); // 0.001 ETH in wei
export const RECOMMENDED_BALANCE = BigInt("5000000000000000"); // 0.005 ETH in wei
/**
 * A blank LocationID (all zeros).
 */
export const EMPTY_ID = "0x0000000000000000000000000000000000000000000000000000000000000000" as Entity;
