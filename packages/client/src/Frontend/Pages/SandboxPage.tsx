import { useComponentValue } from "@latticexyz/react";

import { singletonEntity } from "@latticexyz/store-sync/recs";

import { hello } from "utils";

import { useMUD } from "../../MUDContext";
import { getNetworkConfig } from "../../mud/getNetworkConfig";

export const SandboxPage = () => {
  const networkConfig = getNetworkConfig();

  const {
    components: { Counter },
    systemCalls: { increment },
  } = useMUD();

  const counter = useComponentValue(Counter, singletonEntity);

  return (
    <>
      <div> {hello(" Sandbox Page!")}</div>
      <button
        className="rounded bg-blue-500 px-4 py-2 font-bold text-white"
        onClick={() => {
          console.log(networkConfig);
        }}
      >
        {" "}
        show network config{" "}
      </button>
      <div>
        Counter: <span>{counter?.value ?? "??"}</span>
      </div>

      <button className="rounded bg-blue-500 px-4 py-2 font-bold text-white">Basic Button</button>
      <button
        className="rounded bg-green-500 px-4 py-2 font-bold text-white shadow-lg hover:bg-green-700"
        onClick={async (event) => {
          event.preventDefault();
          console.log("new counter value:", await increment());
        }}
      >
        Increment
      </button>

      <button type="button">Increment</button>
    </>
  );
};
