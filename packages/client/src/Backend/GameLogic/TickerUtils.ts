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

  public getCurrentTick(): number {
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

  public convertTickToMs(tick: number): number {
    const { Ticker } = this.components;
    const tickerData = getComponentValue(Ticker, singletonEntity);
    if (!tickerData) {
      throw new Error("Game not started");
    }

    const rate = Number(tickerData.tickRate);
    const preTickNumber = Number(tickerData.tickNumber);
    const preTimestamp = Number(tickerData.timestamp);

    if (tickerData.paused) {
      return Date.now() + 1000 * ((tick - preTickNumber) / rate);
    } else {
      return Math.floor(1000 * ((tick - preTickNumber) / rate + preTimestamp));
    }
  }

  public convertMsToTick(timestampMs: number): number {
    const { Ticker } = this.components;
    const tickerData = getComponentValue(Ticker, singletonEntity);
    if (!tickerData) {
      throw new Error("Game not started");
    }

    const rate = Number(tickerData.tickRate);
    const preTickNumber = Number(tickerData.tickNumber);
    const preTimestamp = Number(tickerData.timestamp);

    if (timestampMs > 1000 * preTimestamp && tickerData.paused) {
      //PUNK not sure if this is right
      return preTickNumber + 1;
    }
    return (
      Math.floor((timestampMs / 1000 - preTimestamp) * rate) + preTickNumber
    );
  }

  // PUNK
  // public tickerRangeToTime(left: number, right: number): number {
  //   const { Ticker } = this.components;
  //   const tickerData = getComponentValue(Ticker, singletonEntity);
  //   if (!tickerData) {
  //     throw new Error("Game not started");
  //   }
  //   const rate = Number(tickerData.tickRate);
  //   const tickerRange = Math.abs(right - left);
  //   const timeRange = Math.floor(tickerRange / rate);
  //   return timeRange;
  // }
}
