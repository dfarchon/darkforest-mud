import { numberToHex, padHex, parseEther, type Hex, stringToHex } from "viem";

export const MINIMUM_BALANCE = parseEther("0.000006");
export const LOW_BALANCE_THRESHOLD = parseEther("0.0005");
export const RECOMMENDED_BALANCE = parseEther("0.005");
export const zeroAddress = padHex(numberToHex(0, { size: 4 }), {
  size: 20,
  dir: "right",
});

export const formatAddress = (address: Hex) =>
  address.slice(0, 6) + "..." + address.slice(-4);

function encode(value: string | number, length: number): Hex {
  if (typeof value === "number") {
    return `0x${value}`;
  }
  return stringToHex(value.substring(0, length), { size: length });
}

export default function encodeBytes32(value: string | number): Hex {
  return encode(value, 32);
}
