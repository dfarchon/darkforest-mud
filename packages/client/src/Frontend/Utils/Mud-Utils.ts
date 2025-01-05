import type { Entity } from "@latticexyz/recs";

export function addressToEntity(walletAddress: string): Entity {
  // Remove the '0x' prefix if it's present
  walletAddress = walletAddress.replace(/^0x/, "");

  // Ensure the address is exactly 40 characters (20 bytes)
  if (walletAddress.length !== 40) {
    throw new Error("Invalid address length");
  }

  // Pad the address with zeros to make it 32 bytes
  const paddedAddress = walletAddress.padStart(62, "0");

  // Add '0x' prefix to the padded address
  return ("0x" + "00" + paddedAddress) as Entity;
}
