export const MARKETPLACE_CONTRACTS: Record<number, string> = {
  8453: "0x14a11B17105cC70F154f84eDe21E9B08dd832577", // Base mainnet
  690: "0xYourRedstoneMarketplaceAddress", // Redstone mainnet
  1: "0x9724fDF5aE41570dEcC2D3094C65eafA7E1aB7D4", // Mainnet
  31337: "0x14a11B17105cC70F154f84eDe21E9B08dd832577", // Mainnet
  // Add more chain IDs and addresses as needed
};

export function getMarketplaceContract(
  chainId: number | undefined,
): string | undefined {
  if (!chainId) return undefined;
  return MARKETPLACE_CONTRACTS[chainId];
}
