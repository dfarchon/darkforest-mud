import { defineSystem, getComponentValue, getComponentValueStrict, runQuery } from "@latticexyz/recs";

import { useStore } from "./useStore";

export const useMUD = () => {
  const { networkLayer, localLayer, externalWalletClient, externalWorldContract } = useStore();

  if (networkLayer === null || localLayer === null) {
    throw new Error("Store not initialized");
  }
  //      phaserLayer,      headlessLayer,
  if ((window as any).layers === undefined) {
    (window as any).layers = {
      networkLayer,

      localLayer,
    };

    (window as any).components = {
      ...networkLayer.components,

      ...localLayer.components,
    };
    // ...headlessLayer.components,
    //...phaserLayer.components,
    (window as any).ecs = {
      getComponentValue,
      getComponentValueStrict,
      runQuery,
      defineSystem,
    };
  }
  //    phaserLayer,
  // headlessLayer,
  return {
    networkLayer,

    localLayer,

    externalWalletClient,
    externalWorldContract,
  };
};
