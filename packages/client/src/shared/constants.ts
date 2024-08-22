import { hexToResource, resourceToHex } from "@latticexyz/common";
import { Entity } from "@latticexyz/recs";

import { EthAddress } from "./identifier";

export const WORLD_ADDRESS = "fixed world adress";
// REDSTONE

export const NETWORK_EXPLORER = "https://explorer.redstone.xyz/";

export const DEFAULT_RPC = "https://rpc.garnet.redstone.xyz";

/**
 * The 0x0 Ethereum address, which is used for unowned planets, artifacts without an owner, etc.
 */
export const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000" as EthAddress;

/**
 * A blank LocationID (all zeros).
 */
export const EMPTY_ID = "0x0000000000000000000000000000000000000000000000000000000000000000" as Entity;
