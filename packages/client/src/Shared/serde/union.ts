// import type { DarkForest } from '@df/contracts/typechain';
// import type { Union, UnionId } from '@df/types';
// import { address } from './address';

// export type RawUnion = Awaited<ReturnType<DarkForest['unions']>>;

// /**
//  * Converts the raw typechain result of a call which fetches a
//  * `UnionTypes.Union` struct, and converts it into an object
//  * with type `Union` (see @df/types) that can be used by a client.
//  *
//  * @param rawUnion result of an ethers.js contract call which returns a raw
//  * `UnionTypes.Union` struct, typed with typechain.
//  */
// export function decodeUnion(rawUnion: RawUnion): Union {
//   return {
//     unionId: rawUnion.unionId.toString() as UnionId,
//     name: rawUnion.name,
//     leader: address(rawUnion.leader),
//     level: rawUnion.level.toNumber(),
//     members: rawUnion.members.map((x) => address(x)),
//     invitees: rawUnion.invitees.map((x) => address(x)),
//     applicants: rawUnion.applicants.map((x) => address(x)),
//     score: 0,
//     highestRank: undefined,
//   };
// }
