import { DEFAULT_MAX_CALL_RETRIES } from "@df/constants";
import type { DiagnosticUpdater } from "@df/types";
import type { ContractFunction } from "ethers";
import retry, { AbortError } from "p-retry";

import type { Queue } from "./ThrottledConcurrentQueue";
import { ThrottledConcurrentQueue } from "./ThrottledConcurrentQueue";

/**
 * Instead of allowing the game to call `view` functions on the blockchain directly, all contract
 * calls should go through this class. Its purpose is to throttle the calls to a reasonable rate,
 * and to gracefully handle errors and retries
 */
export class ContractCaller {
  /**
   * Queue which stores future contract calls.
   */
  private readonly queue: Queue = new ThrottledConcurrentQueue({
    maxInvocationsPerIntervalMs: 10,
    invocationIntervalMs: 200,
    maxConcurrency: 20,
  });

  /**
   * The maximum amount of times that we want the game to retry any individual call. Retries are
   * appended to the end of the queue, meaning they respect the throttling settings of this class.
   */
  private maxRetries: number = DEFAULT_MAX_CALL_RETRIES;

  /**
   * Allows us to update the data that might be displayed in the UI.
   */
  private diagnosticsUpdater?: DiagnosticUpdater;

  public constructor(queue?: Queue, maxRetries?: number) {
    if (queue) {
      this.queue = queue;
    }
    if (maxRetries) {
      this.maxRetries = maxRetries;
    }
  }

  /**
   * Submits a call to the call queue. Each call is retried a maximum of
   * {@link ContractCaller.DEFAULT_MAX_CALL_RETRIES} times. Returns a promise that resolves if the call was
   * successful, and rejects if it failed even after all the retries.
   */
  public async makeCall<T>(
    contractViewFunction: ContractFunction<T>,
    args: unknown[] = [],
  ): Promise<T> {
    const result = retry(
      async () => {
        const callPromise = this.queue.add(() => {
          this.diagnosticsUpdater?.updateDiagnostics((d) => {
            d.totalCalls++;
          });
          return contractViewFunction(...args);
        });

        this.diagnosticsUpdater?.updateDiagnostics((d) => {
          d.callsInQueue = this.queue.size();
        });

        try {
          const callResult = await callPromise;
          this.diagnosticsUpdater?.updateDiagnostics((d) => {
            d.callsInQueue = this.queue.size();
          });

          return callResult;
        } catch (err) {
          if ((<Error & { code?: string }>err).code === "CALL_EXCEPTION") {
            throw new AbortError("Could not call function on given contract");
          } else {
            console.warn("retrying after err:", err);
            throw err;
          }
        }
      },
      { retries: this.maxRetries },
    );

    this.diagnosticsUpdater?.updateDiagnostics((d) => {
      d.totalCalls++;
    });

    return result;
  }

  /**
   * Sets the diagnostics updater to the one you provide. If you don't set this, everything apart
   * from diagnostics continues to function.
   */
  public setDiagnosticUpdater(diagnosticUpdater?: DiagnosticUpdater) {
    this.diagnosticsUpdater = diagnosticUpdater;
  }
}
