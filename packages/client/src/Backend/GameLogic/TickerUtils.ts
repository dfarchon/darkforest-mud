import { getComponentValue } from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import type { ClientComponents } from "@mud/createClientComponents";

interface MoveUtilsConfig {
  components: ClientComponents;
}

export class TickerUtils {
  private components: ClientComponents;

  public constructor({ components }: MoveUtilsConfig) {
    this.components = components;
  }

  public getTickNumber(): number {
    const { Ticker } = this.components;
    const tickerData = getComponentValue(Ticker, singletonEntity);
    if (!tickerData) {
      throw new Error("Game not started");
    }
    const rate = Number(tickerData.tickRate);
    const preTickNumber = Number(tickerData.tickNumber);
    const preTimestamp = Number(tickerData.timestamp);
    if (tickerData.paused) {
      return preTickNumber;
    } else {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const newTickNumber =
        preTickNumber + (currentTimestamp - preTimestamp) * rate;
      return newTickNumber;
    }
  }
}
