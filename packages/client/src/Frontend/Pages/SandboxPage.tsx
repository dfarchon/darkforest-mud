// import { useComponentValue } from "@latticexyz/react";
// import { useMUD } from "../../MUDContext";
// import { singletonEntity } from "@latticexyz/store-sync/recs";
import { hello } from "utils";
import { getNetworkConfig } from "../../mud/getNetworkConfig";

export const SandboxPage = () => {
  const networkConfig = getNetworkConfig();

  return (
    <>
      <div> {hello("Sandbox")}</div>
      <button
        onClick={() => {
          console.log(networkConfig);
        }}
        className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
      >
        Print Network Config
      </button>
    </>
  );

  // const {
  //   components: { Counter },
  //   systemCalls: { increment },
  // } = useMUD();

  // const counter = useComponentValue(Counter, singletonEntity);

  // return (
  //   <>
  //     <div> {hello(" Sandbox Page!")}</div>
  //     <button
  //       className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
  //       onClick={() => {
  //         console.log(networkConfig);
  //       }}
  //     >
  //       {" "}
  //       show network config{" "}
  //     </button>
  //     <div>
  //       Counter: <span>{counter?.value ?? "??"}</span>
  //     </div>

  //     <button className="bg-blue-500 text-white font-bold py-2 px-4 rounded">
  //       Basic Button
  //     </button>
  //     <button
  //       className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-lg"
  //       onClick={async (event) => {
  //         event.preventDefault();
  //         console.log("new counter value:", await increment());
  //       }}
  //     >
  //       Increment
  //     </button>

  //     <button type="button">Increment</button>
  //   </>
  // );
};
