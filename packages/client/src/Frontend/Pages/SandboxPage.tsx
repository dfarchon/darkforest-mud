import { useComponentValue } from "@latticexyz/react";
import { useMUD } from "../../MUDContext";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { hello } from "utils";

export const SandboxPage = () => {
  const {
    components: { Counter },
    systemCalls: { increment },
  } = useMUD();

  const counter = useComponentValue(Counter, singletonEntity);

  return (
    <>
      <div> {hello(" Sandbox Page!")}</div>
      <div>
        Counter: <span>{counter?.value ?? "??"}</span>
      </div>

      <button className="bg-blue-500 text-white font-bold py-2 px-4 rounded">
        Basic Button
      </button>
      <button
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-lg"
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
