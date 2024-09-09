import type { GasPrices } from "@df/types";

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
