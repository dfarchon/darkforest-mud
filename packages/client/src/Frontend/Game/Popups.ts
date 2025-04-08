import type { EthConnection } from "@df/network";
import { isPurchase, weiToEth } from "@df/network";
import type { EthAddress, TransactionId, TxIntent } from "@df/types";
import { Setting } from "@df/types";
import type { providers } from "ethers";

import { getBooleanSetting } from "../Utils/SettingsHooks";

// NOTE: old setting: tx is killed if user doesn't click popup within 20s
// const POPUP_TIMEOUT = 20000;

// tx is killed if user doesn't click popup within 200s
const POPUP_TIMEOUT = 200_000;

interface OpenConfirmationConfig {
  contractAddress: EthAddress;
  connection: EthConnection;
  id: TransactionId;
  intent: TxIntent;
  overrides?: providers.TransactionRequest;
  from: EthAddress;
  gasFeeGwei: number;
  gasFeeLimit: number;
}

export async function openConfirmationWindowForTransaction({
  contractAddress,
  connection,
  id,
  intent,
  overrides,
  from,
  gasFeeGwei,
  gasFeeLimit,
}: OpenConfirmationConfig): Promise<void> {
  const config = {
    contractAddress,
    account: connection.getAddress(),
  };
  const autoApprove = getBooleanSetting(
    config,
    Setting.AutoApproveNonPurchaseTransactions,
  );

  // if (!autoApprove || isPurchase(overrides)) {
  if (!autoApprove) {
    localStorage.setItem(`${from}-gasFeeGwei`, gasFeeGwei.toString());
    localStorage.setItem(`${from}-gasFeeLimit`, gasFeeLimit.toString());

    const amount =
      overrides !== undefined && overrides.value !== undefined
        ? overrides.value.toString()
        : 0;
    localStorage.setItem(`${from}-amountSent`, amount.toString());

    const account = connection.getAddress();
    if (!account) {
      throw new Error("no account");
    }
    const balanceEth = weiToEth(await connection.loadBalance(account));
    const method = intent.methodName;
    const popup = window.open(
      `/wallet/${contractAddress}/${from}/${id}/${balanceEth}/${method}`,
      "confirmationwindow",
      "width=600,height=600",
    );
    if (popup) {
      const opened = Date.now();
      await new Promise<void>((resolve, reject) => {
        const interval = setInterval(() => {
          if (popup.closed) {
            const approved =
              localStorage.getItem(`tx-approved-${from}-${id}`) === "true";
            if (approved) {
              resolve();
            } else {
              reject(new Error("User rejected transaction."));
            }
            localStorage.removeItem(`tx-approved-${from}-${id}`);
            clearInterval(interval);
          } else {
            if (Date.now() > opened + POPUP_TIMEOUT) {
              reject(
                new Error(
                  "Approval window popup timed out; check your popups!",
                ),
              );
              localStorage.removeItem(`tx-approved-${from}-${id}`);
              clearInterval(interval);
              popup.close();
            }
          }
        }, 100);
      });
    } else {
      throw new Error(
        "Please enable popups to confirm this transaction. After you've done so, try again.",
      );
    }
  }
}
