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
      <button
        type="button"
        onClick={async (event) => {
          event.preventDefault();
          console.log("new counter value:", await increment());
        }}
      >
        Increment
      </button>
    </>
  );
};
