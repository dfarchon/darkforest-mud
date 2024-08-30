// import { LOCATION_ID_UB } from '@df/constants';
// import type { DarkForest } from '@df/contracts/typechain';
// import type { ClaimedCoords } from '@df/types';
// import bigInt from 'big-integer';
// import { address } from './address';
// import { locationIdFromDecStr } from './location';

// export type RawClaimedCoords = Awaited<ReturnType<DarkForest['claimedCoords']>>;

// /**
//  * Converts the result of a typechain-typed ethers.js contract call returning a
//  * `DarkForestTypes.ClaimedCoords` struct into a `ClaimedCoords` object (see
//  * @darkforest_eth/types)
//  *
//  * @param rawClaimedCoords the result of a typechain-typed ethers.js contract
//  * call returning a DarkForestTypes.RevealedCoords` struct
//  */
// export function decodeClaimedCoords(rawClaimedCoords: RawClaimedCoords): ClaimedCoords {
//   const locationId = locationIdFromDecStr(rawClaimedCoords.locationId.toString());
//   let xBI = bigInt(rawClaimedCoords.x.toString()); // nonnegative residue mod p
//   let yBI = bigInt(rawClaimedCoords.y.toString()); // nonnegative residue mod p
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
//     score: rawClaimedCoords.score.toNumber(),
//     claimer: address(rawClaimedCoords.claimer),
//   };
// }
