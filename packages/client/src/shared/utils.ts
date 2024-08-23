import { type ClassValue, clsx } from "clsx";
import { BigNumberish, ethers } from "ethers";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortedAddress(address: `0x${string}`): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function addressToEntity(walletAddress: string): string {
  // Remove the '0x' prefix if it's present
  walletAddress = walletAddress.replace(/^0x/, "");

  // Ensure the address is exactly 40 characters (20 bytes)
  if (walletAddress.length !== 40) {
    throw new Error("Invalid address length");
  }

  // Pad the address with zeros to make it 32 bytes
  const paddedAddress = walletAddress.padStart(62, "0");

  // Add '0x' prefix to the padded address
  return "0x" + "00" + paddedAddress;
}

export function entityToAddress(entity: string): string {
  return entity.slice(0, 2) + entity.slice(26);
}

export function hexToString(hex) {
  if (hex) {
    const hexString = hex.replace(/^0x/, ""); // Remove '0x' prefix if present
    const pairs = hexString.match(/.{2}/g); // Split the string into pairs of two characters
    const result = pairs
      .map((pair) => parseInt(pair, 16))
      .filter((charCode) => charCode >= 32 && charCode <= 126) // Filter printable ASCII characters
      .map((charCode) => String.fromCharCode(charCode))
      .join("");
    return result;
  }
}

export function stringToHex(str) {
  let hexString = "";
  for (let i = 0; i < str.length; i++) {
    hexString += str.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return "0x" + hexString;
}

export function numberToHex(value) {
  const hexValue = value.toString(16); // Convert the decimal value to hexadecimal
  const paddedHexValue = hexValue.padStart(64, "0"); // Pad the hexadecimal value with zeros to make it 32 bytes long
  return "0x" + paddedHexValue; // Add the "0x" prefix
}

export function formatBN(bn: BigNumberish, unit: number | string = 0) {
  return Number(ethers.formatUnits(bn, unit));
}

export function cutString(entity: string, symbol?: string): string {
  const splitter = symbol ? symbol : "...";

  return entity.slice(0, 4) + splitter + entity.slice(-4);
}

export function formatNumberCommas(number: number): string {
  return new Intl.NumberFormat("en-US").format(number);
}

export function formatNumber(number: number): number | string {
  if (number < 100) {
    return Number(number.toFixed(2));
  }

  const roundedNumber = Math.floor(number);
  const digits = roundedNumber.toString().split("");
  let convertedNumber: number | string;
  let digitsString: string;

  switch (digits.length) {
    case 4:
    case 5:
    case 6:
      const thousandIndex = digits.length - 3;
      digitsString = `${digits.slice(0, thousandIndex).join("")}.${digits[thousandIndex]}${digits[thousandIndex + 1]}`;
      convertedNumber = `${getCutStringZeroDigitsFromString(digitsString)}k`;
      break;
    case 7:
    case 8:
    case 9:
      const millionIndex = digits.length - 6;
      digitsString = `${digits.slice(0, millionIndex).join("")}.${digits[millionIndex]}${digits[millionIndex + 1]}`;
      convertedNumber = `${getCutStringZeroDigitsFromString(digitsString)}m`;
      break;
    case 10:
    case 11:
    case 12:
      const billionIndex = digits.length - 9;
      digitsString = `${digits.slice(0, billionIndex).join("")}.${digits[billionIndex]}${digits[billionIndex + 1]}`;
      convertedNumber = `${getCutStringZeroDigitsFromString(digitsString)}bn`;
      break;
    case 13:
    case 14:
    case 15:
      const trillionIndex = digits.length - 12;
      digitsString = `${digits.slice(0, trillionIndex).join("")}.${digits[trillionIndex]}${digits[trillionIndex + 1]}`;
      convertedNumber = `${getCutStringZeroDigitsFromString(digitsString)}tn`;
      break;
    case 16:
    case 17:
    case 18:
      const quadrillionIndex = digits.length - 15;
      digitsString = `${digits.slice(0, quadrillionIndex).join("")}.${digits[quadrillionIndex]}${
        digits[quadrillionIndex + 1]
      }`;
      convertedNumber = `${getCutStringZeroDigitsFromString(digitsString)}qd`;
      break;
    case 19:
    case 20:
    case 21:
      const quintillionIndex = digits.length - 18;
      digitsString = `${digits.slice(0, quintillionIndex).join("")}.${digits[quintillionIndex]}${
        digits[quintillionIndex + 1]
      }`;
      convertedNumber = `${getCutStringZeroDigitsFromString(digitsString)}qt`;
      break;
    default:
      convertedNumber = roundedNumber;
  }

  return convertedNumber;
}

function getCutStringZeroDigitsFromString(s: string): string {
  return s.endsWith(".00") ? s.slice(0, -3) : s.endsWith("0") ? s.slice(0, -1) : s;
}
