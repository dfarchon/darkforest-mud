import { useEffect, useState } from "react";

import { StorageAdapterBlock } from "@latticexyz/store-sync";

import { Observable } from "rxjs";
import { Hex, TransactionReceipt, createPublicClient } from "viem";

import { createWaitForTransaction } from "@mud/waitForTransaction";

// Adjust import as necessary

// Define your hook
export function useWaitForTransaction({
  storedBlockLogs$,
  client,
}: {
  storedBlockLogs$: Observable<StorageAdapterBlock>;
  client: ReturnType<typeof createPublicClient>;
}) {
  const [waitForTransaction, setWaitForTransaction] = useState<
    ((tx: Hex, onReceipt?: (receipt: TransactionReceipt) => void) => Promise<void>) | null
  >(null);

  useEffect(() => {
    const waitForTransactionFn = createWaitForTransaction({
      client,
      storedBlockLogs$,
    });
    setWaitForTransaction(() => waitForTransactionFn);
  }, [client, storedBlockLogs$]);

  return waitForTransaction;
}
