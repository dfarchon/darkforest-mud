import { resourceToHex } from "@latticexyz/common";

export const MOVE_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "MoveSystem",
});

export const PLANET_REVEAL_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "PlanetRevealSystem",
});

export const PLANET_UPGRADE_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "PlanetUpgradeSystem",
});

export const PLANET_WITHDRAW_SILVER_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "PlanetWithdrawSilverSystem",
});

export const PLAYER_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "PlayerSystem",
});

export const TICK_SYSTEM_ID = resourceToHex({
  type: "system",
  namespace: "df",
  name: "TickSystem",
});
