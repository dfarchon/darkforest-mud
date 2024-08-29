// import { LOCATION_ID_UB } from '@dfares/constants';
// import type { DarkForest } from '@dfares/contracts/typechain';
// import { KardashevCoords } from '@dfares/types';
// import bigInt from 'big-integer';
// import { address } from './address';
// import { locationIdFromDecStr } from './location';

// export type RawKardashevCoords = Awaited<ReturnType<DarkForest['kardashevCoords']>>;

// /**
//  * Converts the result of a typechain-typed ethers.js contract call returning a
//  * `RevealTypes.RevealedCoords` struct into a `RevealedCoords` object (see
//  * @dfares/types)
//  *
//  * @param rawRevealedCoords the result of a typechain-typed ethers.js contract
//  * call returning a RevealTypes.RevealedCoords` struct
//  */
// export function decodeKardashevCoords(rawKardashevCoords: RawKardashevCoords): KardashevCoords {
//   const locationId = locationIdFromDecStr(rawKardashevCoords.locationId.toString());
//   let xBI = bigInt(rawKardashevCoords.x.toString()); // nonnegative residue mod p
//   let yBI = bigInt(rawKardashevCoords.y.toString()); // nonnegative residue mod p
//   let x = 0;
//   let y = 0;
//   if (xBI.gt(LOCATION_ID_UB.divide(2))) {
//     xBI = xBI.minus(LOCATION_ID_UB);
//   }
//   x = xBI.toJSNumber();
//   if (yBI.gt(LOCATION_ID_UB.divide(2))) {
//     yBI = yBI.minus(LOCATION_ID_UB);
//   }
//   y = yBI.toJSNumber();
//   return {
//     hash: locationId,
//     x,
//     y,
//     operator: address(rawKardashevCoords.operator),
//   };
// }
