// These are loaded as URL paths by a webpack loader
// import diamondContractAbiUrl from "@df/contracts/abis/DarkForest.json";
import type { EthConnection } from "@df/network";
import { createContract, createEthConnection } from "@df/network";
import diamondContractAbiUrl from "contracts/out/IWorld.sol/IWorld.abi.json";
import type { Contract, providers, Wallet } from "ethers";

/**
 * Loads the game contract, which is responsible for updating the state of the game.
 */
export async function loadDiamondContract<T extends Contract>(
  address: string,
  provider: providers.JsonRpcProvider,
  signer?: Wallet,
): Promise<T> {
  const abi = diamondContractAbiUrl; //;await fetch(diamondContractAbiUrl).then((r) => r.json());

  return createContract<T>(address, abi, provider, signer);
}

export function getEthConnection(): Promise<EthConnection> {
  const isProd = import.meta.env.VITE_NODE_ENV === "production";
  const defaultUrl = import.meta.env.VITE_DEFAULT_RPC as string;
  const faucetServiceUrl = process.env.FAUCET_SERVICE_URL as string;

  let url: string;

  if (isProd) {
    url = localStorage.getItem("RPC_ENDPOINT_v5") || defaultUrl;
  } else {
    url = "http://localhost:8545";
  }

  console.log(`GAME METADATA:`);
  console.log(`rpc url: ${url}`);
  console.log(`is production: ${isProd}`);
  console.log(`webserver url: ${import.meta.env.VITE_WEBSERVER_URL}`);
  console.log(`leaderboard url: ${process.env.LEADER_BOARD_URL}`);
  console.log(`faucet service url:${faucetServiceUrl}`);

  return createEthConnection(url);
}
