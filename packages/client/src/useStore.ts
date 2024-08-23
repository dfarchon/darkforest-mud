import IWorldAbi from "contracts/out/IWorld.sol/IWorld.abi.json";
import { Address, Chain, GetContractReturnType, PublicClient, Transport, WalletClient } from "viem";
import { Config } from "wagmi";
import { create } from "zustand";

// import { HeadlessLayer } from "./layers/Headless";
import { LocalLayer } from "./layers/Local";
import { NetworkLayer } from "./layers/Network";

// import { ThreeJsLayer } from "./layers/Renderer/Phaser";

export type ContractType = GetContractReturnType<typeof IWorldAbi, PublicClient<Transport, Chain>, Address>;
//  headlessLayer: HeadlessLayer | null;
// localLayer: LocalLayer | null;
// threeJsLayer: ThreeJsLayer | null;
//  loadingPageHidden: boolean;
export type Store = {
  networkLayer: NetworkLayer | null;
  localLayer: LocalLayer | null;
  wagmiConfig: Config | null;
  externalWalletClient: WalletClient | null;
  externalWorldContract: ContractType | null;
};

//  headlessLayer: null,
// localLayer: null,
// threeJsLayer: null,
//  loadingPageHidden: false,
export const useStore = create<Store>(() => ({
  networkLayer: null,
  localLayer: null,
  wagmiConfig: null,
  externalWalletClient: null,
  externalWorldContract: null,
}));
