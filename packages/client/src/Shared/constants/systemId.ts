import { resourceToHex } from "@latticexyz/common";
import MoveSystemAbi from "contracts/out/MoveSystem.sol/MoveSystem.abi.json";
import PlanetRevealSystemAbi from "contracts/out/PlanetRevealSystem.sol/PlanetRevealSystem.abi.json";
import PlanetUpgradeSystemAbi from "contracts/out/PlanetUpgradeSystem.sol/PlanetUpgradeSystem.abi.json";
import PlanetWithdrawSilverSystemAbi from "contracts/out/PlanetWithdrawSilverSystem.sol/PlanetWithdrawSilverSystem.abi.json";
import PlayerSystemAbi from "contracts/out/PlayerSystem.sol/PlayerSystem.abi.json";
import TickSystemAbi from "contracts/out/TickSystem.sol/TickSystem.abi.json";
import type { Abi } from "viem";

export const MOVE_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "MoveSystem",
});

export const MOVE_SYSTEM_ABI: Abi = MoveSystemAbi;

export const PLANET_REVEAL_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "PlanetRevealSystem",
});

export const PLANET_REVEAL_SYSTEM_ABI: Abi = PlanetRevealSystemAbi;

export const PLANET_UPGRADE_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "PlanetUpgradeSystem",
});

export const PLANET_UPGRADE_SYSTEM_ABI: Abi = PlanetUpgradeSystemAbi;

export const PLANET_WITHDRAW_SILVER_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "PlanetWithdrawSilverSystem",
});

export const PLANET_WITHDRAW_SILVER_SYSTEM_ABI: Abi =
  PlanetWithdrawSilverSystemAbi;

export const PLAYER_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "PlayerSystem",
});

export const PLAYER_SYSTEM_ABI: Abi = PlayerSystemAbi;

export const TICK_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "TickSystem",
});

export const TICK_SYSTEM_ABI: Abi = TickSystemAbi;
