// import { useComponentValue } from "@latticexyz/react";
// import { useMUD } from "../../MUDContext";
// import { singletonEntity } from "@latticexyz/store-sync/recs";
import { getNetworkConfig } from "@mud/getNetworkConfig";

export const SandboxPage = () => {
  const networkConfig = getNetworkConfig();

  return (
    <>
      <div> {"Sandbox"}</div>
      <button
        onClick={() => {
          console.log(networkConfig);
        }}
        className="rounded bg-blue-500 px-4 py-2 font-bold text-white"
      >
        Print Network Config
      </button>
    </>
  );
};
