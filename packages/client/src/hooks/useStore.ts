import IWorldAbi from "contracts/out/IWorld.sol/IWorld.abi.json";
import type {
  GetContractReturnType,
  PublicClient,
  Transport,
  Chain,
  WalletClient,
  Address,
  Account,
} from "viem";
import type { Config } from "wagmi";
import { create } from "zustand";
// import { HeadlessLayer } from "./layers/Headless";
// import { LocalLayer } from "./layers/Local";
// import { NetworkLayer } from "./layers/Network";
// import { PhaserLayer } from "./layers/Renderer/Phaser";

// export type ContractType = GetContractReturnType<typeof IWorldAbi, PublicClient, Address>;
export type ContractType = GetContractReturnType<
  typeof IWorldAbi,
  PublicClient<Transport, Chain, Account>,
  Address
>;

export type Store = {
  // networkLayer: NetworkLayer | null;
  // headlessLayer: HeadlessLayer | null;
  // localLayer: LocalLayer | null;
  // phaserLayer: PhaserLayer | null;
  wagmiConfig: Config | null;
  externalWalletClient: WalletClient | null;
  externalWorldContract: ContractType | null;
  loadingPageHidden: boolean;
};

export const useStore = create<Store>(() => ({
  // networkLayer: null,
  // headlessLayer: null,
  // localLayer: null,
  // phaserLayer: null,
  wagmiConfig: null,
  externalWalletClient: null,
  externalWorldContract: null,
  loadingPageHidden: false,
}));
