import { GasPrices } from "@df/types";
import React from "react";

export function DisplayGasPrices({ gasPrices }: { gasPrices?: GasPrices }) {
  return (
    <div>
      {!gasPrices ? (
        "unknown"
      ) : (
        <>
          slo: {gasPrices.slow + " "}
          avg: {gasPrices.average + " "}
          fst: {gasPrices.fast + " "}
        </>
      )}
    </div>
  );
}
