import { findIndex } from "lodash-es";
import CircularBuffer from "mnemonist/circular-buffer";
import deferred from "p-defer";

/**
 * Represents a task that has been queued for later execution.
 */
interface QueuedTask<T, U> {
  /**
   * This is called when the task succeeds.
   */
  resolve: (t: T) => void;

  /**
   * This is called when the task fails.
   */
  reject: (e: Error | undefined) => void;

  /**
   * Starts the task.
   */
  start: () => Promise<T>;

  /**
   * Optional data to be associated with the task.
   * Currently only used when finding a task during removal.
   */
  metadata: U | undefined;
}

/**
 * Let's keep things flexible by keeping this type small.
 */
export interface Queue {
  add<T>(start: () => Promise<T>): Promise<T>;
  size: () => number;
}

export interface ConcurrentQueueConfiguration {
  maxInvocationsPerIntervalMs: number;
  invocationIntervalMs: number;
  maxConcurrency?: number;
}

/**
 * A queue that executes promises with a max throughput, and optionally max
 * concurrency.
 */
export class ThrottledConcurrentQueue<U = unknown> implements Queue {
  /**
   * The interval during which we only allow a certain maximum amount of tasks
   * to be executed.
   */
  private readonly invocationIntervalMs: number;

  /**
   * Maximum amount of tasks that can be executing at the same time.
   */
  private readonly maxConcurrency: number;

  /**
   * Queue of tasks to execute. Added to the front, popped off the back.
   */
  private taskQueue: Array<QueuedTask<unknown, U>> = [];

  /**
   * Each time a task is executed, record the start of its execution time.
   * Execution timestamps are removed when they become outdated. Used for
   * keeping the amount of executions under the throttle limit.
   */
  private executionTimestamps: CircularBuffer<number>;

  /**
   * Amount of tasks being executed right now.
   */
  private concurrency = 0;

  /**
   * When we schedule an attempt at executing another task in the future,
   * we don't want to schedule it more than once. Therefore, we keep track
   * of this scheduled attempt.
   */
  private executionTimeout: ReturnType<typeof setTimeout> | undefined;

  public constructor(config: ConcurrentQueueConfiguration) {
    this.invocationIntervalMs = config.invocationIntervalMs;
    this.maxConcurrency = config.maxConcurrency ?? Number.POSITIVE_INFINITY;
    this.executionTimestamps = new CircularBuffer(
      Array,
      config.maxInvocationsPerIntervalMs,
    );

    if (config.maxInvocationsPerIntervalMs <= 0) {
      throw new Error("must allow at least one invocation per interval");
    }

    if (this.invocationIntervalMs <= 0) {
      throw new Error("invocation interval must be positive");
    }

    if (this.maxConcurrency <= 0) {
      throw new Error("max concurrency must be positive");
    }
  }

  /**
   * Adds a task to be executed at some point in the future. Returns a promise that resolves when
   * the task finishes successfully, and rejects when there is an error.
   *
   * @param start a function that returns a promise representing the task
   * @param metadata optional data to be associated with the task
   */
  public add<T>(start: () => Promise<T>, metadata?: U): Promise<T> {
    const { resolve, reject, promise } = deferred<T>();

    this.taskQueue.unshift({
      resolve: resolve as (t: unknown) => void,
      reject,
      start,
      metadata,
    });

    setTimeout(() => {
      this.executeNextTasks();
    }, 0);

    return promise;
  }

  /**
   * Remove one task from the queue. For this to work, you have to provide
   * the optional metadata during queue construction and addition of tasks.
   *
   * Throws an error if no matching task is found.
   * @param predicate Should return true for the task you would like removed.
   */
  public remove(
    predicate: (metadata: U | undefined) => boolean,
  ): QueuedTask<unknown, U> {
    const foundIndex = findIndex(
      this.taskQueue,
      (task: QueuedTask<unknown, U>) => predicate(task.metadata),
    );

    if (foundIndex === -1) {
      throw new Error(`specified task was not found`);
    }

    return this.taskQueue.splice(foundIndex, 1)[0];
  }

  /**
   * Prioritize a currently queued task so that it is up next for execution.
   * For this to work, you have to provide the optional metadata during
   * queue construction and addition of tasks.
   *
   * Prioritized tasks are executed in FILO order.
   *
   * Throws an error if no matching task is found.
   * @param predicate Should return true for the task you would like prioritized.
   */
  public prioritize(
    predicate: (metadata: U | undefined) => boolean,
  ): QueuedTask<unknown, U> {
    const foundIndex = findIndex(
      this.taskQueue,
      (task: QueuedTask<unknown, U>) => predicate(task.metadata),
    );

    if (foundIndex === -1) {
      throw new Error(`specified task was not found`);
    }

    const foundTask = this.taskQueue.splice(foundIndex, 1)[0];
    this.taskQueue.push(foundTask);

    return foundTask;
  }

  /**
   * Returns the amount of queued items, not including the ones that are being executed at this
   * moment.
   */
  public size() {
    return this.taskQueue.length;
  }

  /**
   * Runs tasks until it's at either the throttle or concurrency limit. If there are more tasks to
   * be executed after that, schedules itself to execute again at the soonest possible moment.
   */
  private async executeNextTasks(): Promise<void> {
    this.deleteOutdatedExecutionTimestamps();

    const tasksToExecute = Math.min(
      this.throttleQuotaRemaining(),
      this.concurrencyQuotaRemaining(),
      this.taskQueue.length,
    );

    for (let i = 0; i < tasksToExecute; i++) {
      this.next().then(this.executeNextTasks.bind(this));
    }

    const nextPossibleExecution = this.nextPossibleExecution();

    if (this.taskQueue.length > 0 && nextPossibleExecution) {
      if (this.executionTimeout) {
        clearTimeout(this.executionTimeout);
      }

      this.executionTimeout = setTimeout(
        this.executeNextTasks.bind(this),
        nextPossibleExecution,
      );
    }
  }

  /**
   * Returns the soonest possible time from now we could execute another task without going over the
   * throttle limit.
   */
  private nextPossibleExecution(): number | undefined {
    const oldestExecution = this.executionTimestamps.peekFirst();

    if (!oldestExecution || this.concurrencyQuotaRemaining() === 0) {
      return undefined;
    }

    return Date.now() - oldestExecution + this.invocationIntervalMs;
  }

  /**
   * At this moment, how many more tasks we could execute without exceeding the concurrency quota.
   */
  private concurrencyQuotaRemaining(): number {
    return this.maxConcurrency - this.concurrency;
  }

  /**
   * At this moment, how many more tasks we could execute without exceeding the throttle quota.
   */
  private throttleQuotaRemaining(): number {
    return this.executionTimestamps.capacity - this.executionTimestamps.size;
  }

  /**
   * Removes all task execution timestamps that are older than [[this.invocationIntervalMs]],
   * because those invocations have no bearing on whether or not we can execute another task.
   */
  private deleteOutdatedExecutionTimestamps() {
    const now = Date.now();

    let oldestInvocation = this.executionTimestamps.peekFirst();

    while (
      oldestInvocation &&
      oldestInvocation < now - this.invocationIntervalMs
    ) {
      this.executionTimestamps.shift();
      oldestInvocation = this.executionTimestamps.peekFirst();
    }
  }

  /**
   * If there is a next task to execute, executes it. Records the time of execution in
   * [[executionTimestamps]]. Increments and decrements concurrency counter. Neither throttles nor
   * limits concurrency.
   */
  private async next(): Promise<void> {
    const task = this.taskQueue.pop();

    if (!task) {
      return;
    }

    this.executionTimestamps.push(Date.now());
    this.concurrency++;

    try {
      task.resolve(await task.start());
    } catch (e) {
      task.reject(e as Error);
    }

    this.concurrency--;
  }
}
