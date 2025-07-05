import {
  FIXED_DIGIT_NUMBER,
  get_ABI_from_FunctionName,
  get_SystemId_from_FunctionName,
} from "@df/constants";
import { addressToHex } from "@df/serde";
import type { AutoGasSetting } from "@df/types";
import type {
  DiagnosticUpdater,
  NetworkEvent,
  PersistedTransaction,
  Transaction,
  TransactionId,
  TxIntent,
} from "@df/types";
import { encodeSystemCallFrom } from "@latticexyz/world/internal";
import { Mutex } from "async-mutex";
import type { providers } from "ethers";
import { utils } from "ethers";
import deferred from "p-defer";
import timeout from "p-timeout";

import type { EthConnection } from "./EthConnection";
import { waitForTransaction } from "./Network";
import {
  type ConcurrentQueueConfiguration,
  ThrottledConcurrentQueue,
} from "./ThrottledConcurrentQueue";
import { BigNumber } from "ethers";

/**
 * Returns either a string that represents the gas price we should use by default for transactions,
 * or a string that represents the fact that we should be using one of the automatic gas prices.
 */
export type GasPriceSettingProvider = (
  transactionRequest: Transaction,
) => AutoGasSetting | string;

/**
 * {@link TxExecutor} calls this before queueing a function to determine whether or not that
 * function should be queued. If this function rejects, a transaction is not queued.
 */
export type BeforeQueued = (
  id: TransactionId,
  intent: TxIntent,
  overrides?: providers.TransactionRequest,
) => Promise<void>;

/**
 * {@link TxExecutor} calls this before executing a function to determine whether or not that
 * function should execute. If this function rejects, the transaction is cancelled.
 */
export type BeforeTransaction = (
  transactionRequest: Transaction,
) => Promise<void>;

/**
 * {@link TxExecutor} calls this after executing a transaction.
 */
export type AfterTransaction = (
  transactionRequest: Transaction,
  performanceMetrics: unknown,
) => Promise<void>;

export class TxExecutor {
  /**
   * A transaction is considered to have errored if haven't successfully submitted to mempool within
   * this amount of time.
   */
  private static readonly TX_SUBMIT_TIMEOUT = 30000;

  /**
   * Our interface to the blockchain.
   */
  private readonly ethConnection: EthConnection;

  /**
   * Communicates to the {@link TxExecutor} the gas price we should be paying for each transaction,
   * if there is not a manual gas price specified for that transaction.
   */
  private readonly gasSettingProvider: GasPriceSettingProvider;

  /**
   * If present, called before any transaction is queued, to give the user of {@link TxExecutor} the
   * opportunity to cancel the event by rejecting. Useful for interstitials.
   */
  private readonly beforeQueued?: BeforeQueued;

  /**
   * If present, called before every transaction, to give the user of {@link TxExecutor} the
   * opportunity to cancel the event by throwing an exception. Useful for interstitials.
   */
  private readonly beforeTransaction?: BeforeTransaction;

  /**
   * If present, called after every transaction with the transaction info as well as its performance
   * metrics.
   */
  private readonly afterTransaction?: AfterTransaction;

  /**
   * Task queue which executes transactions in a controlled manner.
   */
  private readonly queue: ThrottledConcurrentQueue<Transaction>;

  /**
   * We record the last transaction timestamp so that we know when it's a good time to refresh the
   * nonce.
   */
  private lastTransactionTimestamp: number;

  /**
   * All Ethereum transactions have a nonce. The nonce should strictly increase with each
   * transaction.
   */
  private nonce: number | undefined;

  /**
   * Increments every time a new transaction is created. This is separate from the nonce because
   * it is used solely for ordering transactions client-side.
   */
  private idSequence: TransactionId = 0;

  /**
   * Allows us to record some diagnostics that appear in the DiagnosticsPane of the Dark Forest client.
   */
  private diagnosticsUpdater?: DiagnosticUpdater;

  /**
   * Unless overridden, these are the default transaction options each blockchain transaction will
   * be sent with.
   */
  private defaultTxOptions: providers.TransactionRequest = {
    gasLimit: 5_000_000,
  };

  /**
   * Mutex that ensures only one transaction is modifying the nonce
   * at a time.
   */
  private nonceMutex: Mutex;

  /**
   * Turning this on refreshes the nonce if there has not been
   * a transaction after {@link NONCE_STALE_AFTER_MS}. This is so that
   * we can get the most up to date nonce even if other
   * wallets/applications are sending transactions as the same
   * address.
   */
  private supportMultipleWallets: boolean;

  /**
   * If {@link supportMultipleWallets} is true, refresh the nonce if a
   * transaction has not been sent in this amount of time.
   */
  private static readonly NONCE_STALE_AFTER_MS = 5_000;

  constructor(
    ethConnection: EthConnection,
    gasSettingProvider: GasPriceSettingProvider,
    beforeQueued?: BeforeQueued,
    beforeTransaction?: BeforeTransaction,
    afterTransaction?: AfterTransaction,
    queueConfiguration?: ConcurrentQueueConfiguration,
    supportMultipleWallets = true,
  ) {
    this.queue = new ThrottledConcurrentQueue(
      queueConfiguration ?? {
        invocationIntervalMs: 200,
        maxInvocationsPerIntervalMs: 3,
        maxConcurrency: 3,
      },
    );
    this.lastTransactionTimestamp = Date.now();
    this.ethConnection = ethConnection;
    this.gasSettingProvider = gasSettingProvider;
    this.beforeQueued = beforeQueued;
    this.beforeTransaction = beforeTransaction;
    this.afterTransaction = afterTransaction;
    this.nonceMutex = new Mutex();
    this.supportMultipleWallets = supportMultipleWallets;
  }

  /**
   * Given a transaction that has been persisted (and therefore submitted), we return a transaction
   * whose confirmationPromise resolves once the transaction was verified to have been confirmed.
   * Useful for plugging these persisted transactions into our transaction system.
   */
  public waitForTransaction<T extends TxIntent>(
    ser: PersistedTransaction<T>,
  ): Transaction<T> {
    const {
      promise: submittedPromise,
      reject: rejectTxResponse,
      resolve: txResponse,
    } = deferred<providers.TransactionResponse>();

    const {
      promise: confirmedPromise,
      reject: rejectTxReceipt,
      resolve: txReceipt,
    } = deferred<providers.TransactionReceipt>();

    const tx: Transaction<T> = {
      id: this.nextId(),
      lastUpdatedAt: Date.now(),
      state: "Init",
      intent: ser.intent,
      submittedPromise,
      confirmedPromise,
      onSubmissionError: rejectTxResponse,
      onReceiptError: rejectTxReceipt,
      onTransactionResponse: txResponse,
      onTransactionReceipt: txReceipt,
    };

    waitForTransaction(this.ethConnection.getProvider(), ser.hash)
      .then((receipt) => {
        tx.onTransactionReceipt(receipt);
      })
      .catch((err) => {
        tx.onReceiptError(err);
      });

    return tx;
  }

  /**
   * Schedules this transaction for execution.
   */
  public async queueTransaction<T extends TxIntent>(
    intent: T,
    overrides?: providers.TransactionRequest,
  ): Promise<Transaction<T>> {
    this.diagnosticsUpdater?.updateDiagnostics((d) => {
      d.transactionsInQueue++;
    });

    const id = this.nextId();

    // The `beforeQueued` function is run before we do anything with the TX
    // And outside of the try/catch so anything it throws can be bubbled instead of
    // marking it as a reverted TX
    if (this.beforeQueued) {
      await this.beforeQueued(id, intent, overrides);
    }

    const {
      promise: submittedPromise,
      reject: rejectTxResponse,
      resolve: txResponse,
    } = deferred<providers.TransactionResponse>();

    const {
      promise: confirmedPromise,
      reject: rejectTxReceipt,
      resolve: txReceipt,
    } = deferred<providers.TransactionReceipt>();

    const tx: Transaction<T> = {
      id,
      lastUpdatedAt: Date.now(),
      state: "Init",
      intent,
      submittedPromise,
      confirmedPromise,
      overrides,
      onSubmissionError: rejectTxResponse,
      onReceiptError: rejectTxReceipt,
      onTransactionResponse: txResponse,
      onTransactionReceipt: txReceipt,
    };

    const autoGasPriceSetting = this.gasSettingProvider(tx);
    tx.autoGasPriceSetting = autoGasPriceSetting;

    if (tx.overrides?.gasPrice === undefined) {
      tx.overrides = tx.overrides ?? {};

      const t1 = this.ethConnection.getAutoGasPriceGwei(
        this.ethConnection.getAutoGasPrices(),
        autoGasPriceSetting,
      );

      const t2 = t1.toFixed(FIXED_DIGIT_NUMBER);

      tx.overrides.gasPrice = utils.parseUnits(t2, "gwei");
    }

    // PUNK HIGHLIGHT
    const gasPrice = BigNumber.from(tx.overrides.gasPrice);
    tx.overrides.maxFeePerGas = gasPrice;
    tx.overrides.maxPriorityFeePerGas = gasPrice.div(2);
    tx.overrides.gasPrice = undefined;

    this.queue.add(() => {
      this.diagnosticsUpdater?.updateDiagnostics((d) => {
        d.transactionsInQueue--;
      });

      return this.execute(tx);
    }, tx);

    return tx;
  }

  public dequeueTransction(tx: Transaction) {
    this.queue.remove((queuedTx) => queuedTx?.id === tx.id);
    tx.state = "Cancel";
  }

  public prioritizeTransaction(tx: Transaction) {
    this.queue.prioritize((queuedTx) => queuedTx?.id === tx.id);
    tx.state = "Prioritized";
  }

  /**
   * Returns the current nonce and increments it in memory for the next transaction.
   * If nonce is undefined, or there has been a big gap between transactions,
   * refresh the nonce from the blockchain. This only replaces the nonce if the
   * blockchain nonce is found to be higher than the local calculation.
   * The stale timer is to support multiple wallets/applications interacting
   * with the game at the same time.
   */
  private async getNonce() {
    const shouldRefreshNonce =
      this.nonce === undefined ||
      (this.supportMultipleWallets &&
        Date.now() - this.lastTransactionTimestamp >
          TxExecutor.NONCE_STALE_AFTER_MS);

    if (shouldRefreshNonce) {
      const chainNonce = await this.ethConnection.getNonce();
      const localNonce = this.nonce || 0;

      this.nonce = Math.max(chainNonce, localNonce);
    }

    const nonce = this.nonce;
    if (this.nonce !== undefined) {
      this.nonce++;
    }

    return nonce;
  }

  /**
   * Reset nonce.
   * This will trigger a refresh from the blockchain the next time
   * execution starts.
   */
  private async resetNonce() {
    return this.nonceMutex.runExclusive(() => (this.nonce = undefined));
  }

  /**
   * Return current counter and increment.
   */
  private nextId() {
    return ++this.idSequence;
  }

  /**
   * Executes the given queued transaction. This is a field rather than a method declaration on
   * purpose for `this` purposes.
   */
  private execute = async (tx: Transaction) => {
    console.log(`[TX ${tx.id}] ====== Starting execute ======`);
    console.log(`[TX ${tx.id}] Transaction type: ${tx.intent.methodName}`);

    let time_called: number | undefined = undefined;
    let error: Error | undefined = undefined;
    let time_submitted: number | undefined = undefined;
    let time_confirmed: number | undefined = undefined;
    let time_errored: number | undefined = undefined;
    let tx_hash: string | undefined = undefined;

    const time_exec_called = Date.now();
    console.log(
      `[TX ${tx.id}] Execution started at: ${new Date(time_exec_called).toISOString()}`,
    );

    try {
      tx.state = "Processing";
      console.log(`[TX ${tx.id}] State changed to Processing`);

      if (this.beforeTransaction) {
        console.log(`[TX ${tx.id}] Running beforeTransaction hook`);
        await this.beforeTransaction(tx);
      }

      console.log(`[TX ${tx.id}] Acquiring nonce mutex`);
      const releaseMutex = await this.nonceMutex.acquire();
      console.log(`[TX ${tx.id}] Acquired nonce mutex`);

      const nonce = await this.getNonce();
      console.log(`[TX ${tx.id}] Got nonce: ${nonce}`);

      const requestWithDefaults = Object.assign(
        JSON.parse(JSON.stringify(this.defaultTxOptions)),
        tx.overrides,
      );
      console.log(`[TX ${tx.id}] Request options:`, requestWithDefaults);

      time_called = Date.now();
      console.log(
        `[TX ${tx.id}] Preparing transaction call at: ${new Date(time_called).toISOString()}`,
      );

      const args = await tx.intent.args;
      console.log(`[TX ${tx.id}] Got transaction args`);

      const methodName = tx.intent.methodName;
      console.log(`[TX ${tx.id}] Method name: ${methodName}`);

      const functionName =
        methodName.slice(0, 4) === "df__"
          ? methodName.substring(4)
          : methodName;

      console.log(`[TX ${tx.id}] Getting ABI and SystemId`);
      const abi = get_ABI_from_FunctionName(functionName);
      const systemId = get_SystemId_from_FunctionName(functionName);

      console.log(`[TX ${tx.id}] Encoding system call`);
      const callFromArgs = encodeSystemCallFrom({
        abi: abi,
        from: addressToHex(tx.intent.delegator),
        systemId: systemId,
        functionName: functionName,
        args: args,
      });

      console.log(`[TX ${tx.id}] Submitting transaction`);
      const submitted = await timeout<providers.TransactionResponse>(
        tx.intent.contract["callFrom"](...callFromArgs, {
          ...requestWithDefaults,
          nonce,
        }),
        TxExecutor.TX_SUBMIT_TIMEOUT,
        `tx request ${tx.id} failed to submit: timed out`,
      );

      console.log(`[TX ${tx.id}] Releasing nonce mutex`);
      releaseMutex();
      console.log(`[TX ${tx.id}] Released nonce mutex`);

      tx.state = "Submit";
      tx.hash = submitted.hash;
      console.log(
        `[TX ${tx.id}] Transaction submitted with hash: ${submitted.hash}`,
      );

      time_submitted = Date.now();
      tx.lastUpdatedAt = time_submitted;
      tx_hash = submitted.hash;
      this.lastTransactionTimestamp = time_submitted;
      console.log(
        `[TX ${tx.id}] Submission time: ${new Date(time_submitted).toISOString()}`,
      );

      tx.onTransactionResponse(submitted);
      console.log(`[TX ${tx.id}] Waiting for confirmation`);

      const confirmed = await this.ethConnection.waitForTransaction(
        submitted.hash,
      );
      console.log(
        `[TX ${tx.id}] Got confirmation, status: ${confirmed.status}`,
      );

      if (confirmed.status !== 1) {
        time_errored = Date.now();
        tx.lastUpdatedAt = time_errored;
        tx.state = "Fail";
        console.log(
          `[TX ${tx.id}] Transaction failed at: ${new Date(time_errored).toISOString()}`,
        );
        await this.resetNonce();
        throw new Error("transaction reverted");
      } else {
        tx.state = "Confirm";
        time_confirmed = Date.now();
        tx.lastUpdatedAt = time_confirmed;
        console.log(
          `[TX ${tx.id}] Transaction confirmed at: ${new Date(time_confirmed).toISOString()}`,
        );
        tx.onTransactionReceipt(confirmed);
      }
    } catch (e) {
      console.error(`[TX ${tx.id}] Error in execute:`, e);
      tx.state = "Fail";
      error = e as Error;

      if (!time_submitted) {
        await this.resetNonce();
        time_errored = Date.now();
        console.log(
          `[TX ${tx.id}] Submission error at: ${new Date(time_errored).toISOString()}`,
        );
        tx.onSubmissionError(error);
      } else {
        // Ran out of retries, set nonce to undefined to refresh it
        if (!time_errored) {
          await this.resetNonce();
          time_errored = Date.now();
        }
        tx.lastUpdatedAt = time_errored;
        console.log(
          `[TX ${tx.id}] Receipt error at: ${new Date(time_errored).toISOString()}`,
        );
        tx.onReceiptError(error);
      }
    } finally {
      this.diagnosticsUpdater?.updateDiagnostics((d) => {
        d.totalTransactions++;
      });
      console.log(`[TX ${tx.id}] ====== Finished execute ======\n`);
    }

    const logEvent: NetworkEvent = {
      tx_to: tx.intent.contract.address,
      tx_type: tx.intent.methodName,
      auto_gas_price_setting: tx.autoGasPriceSetting,
      time_exec_called,
      tx_hash,
    };

    if (time_called && time_submitted) {
      logEvent.wait_submit = time_submitted - time_called;
      if (time_confirmed) {
        logEvent.wait_confirm = time_confirmed - time_called;
      }
    }

    if (error && time_errored) {
      logEvent.error = error.message || JSON.stringify(error);
      logEvent.wait_error = time_errored - time_exec_called;

      try {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        if ((error as any).body) {
          logEvent.parsed_error = String.fromCharCode.apply(
            null,
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            (error as any).body || [],
          );
        }
      } catch (e) {
        // EMPTY
      }
    }

    logEvent.rpc_endpoint = this.ethConnection.getRpcEndpoint();
    logEvent.user_address = this.ethConnection.getAddress();

    this.afterTransaction && this.afterTransaction(tx, logEvent);
  };

  public setDiagnosticUpdater(diagnosticUpdater?: DiagnosticUpdater) {
    this.diagnosticsUpdater = diagnosticUpdater;
  }

  /**
   * Get all transaction IDs currently in the queue
   */
  public getQueuedTransactionIds(): TransactionId[] {
    const tasks = this.queue.getTaskQueue();
    return tasks.map((task) => {
      const tx = task.metadata as Transaction;
      return tx.id;
    });
  }

  /**
   * Get all queued transactions
   */
  public getQueuedTransactions(): Transaction[] {
    const queuedTasks = this.queue.getTaskQueue();
    return queuedTasks.map((task) => task.metadata as Transaction);
  }
}
