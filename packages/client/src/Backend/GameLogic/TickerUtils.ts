import { getComponentValue } from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import type { ClientComponents } from "@mud/createClientComponents";

interface MoveUtilsConfig {
  components: ClientComponents;
}

export class TickerUtils {
  private components: ClientComponents;

  private paused: boolean;
  private syncTick: number;
  private tickerRate: number;
  private syncTimestamp: number;

  public constructor({ components }: MoveUtilsConfig) {
    this.components = components;
    this.sync();
  }

  public sync(): void {
    const { Ticker } = this.components;
    const tickerData = getComponentValue(Ticker, singletonEntity);
    if (!tickerData) {
      throw new Error("Game not started");
    }

    this.paused = tickerData.paused;
    this.syncTick = Number(tickerData.tickNumber);
    this.tickerRate = Number(tickerData.tickRate);
    this.syncTimestamp = Date.now();
  }

  public getTickNumber(): number {
    const rate = Number(this.tickerRate);
    const preTickNumber = Number(this.syncTick);
    const preTimestamp = Number(this.syncTimestamp);
    if (this.paused) {
      return preTickNumber;
    } else {
      const currentTimestamp = Date.now();
      const newTickNumber =
        preTickNumber +
        Math.floor((currentTimestamp - preTimestamp) / 1000) * rate;
      return newTickNumber;
    }
  }

  public convertTickToTimeMilliSeconds(tick: number): number {
    if (this.paused && tick > this.syncTick) {
      return Number.MAX_VALUE;
    }

    return (
      (1000 * (tick - this.syncTick)) / this.tickerRate + this.syncTimestamp
    );
  }

  public tickerRangeToTimeSeconds(left: number, right: number): number {
    const rate = Number(this.tickerRate);
    const tickerRange = Math.abs(right - left);
    const timeRange = Math.floor(tickerRange / rate);
    return timeRange;
  }
}
