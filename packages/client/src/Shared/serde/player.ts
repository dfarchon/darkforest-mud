// import { CONTRACT_PRECISION } from '@df/constants';
// import type { DarkForest } from '@df/contracts/typechain';
// import type { Player, UnionId } from '@df/types';
// import { address } from './address';
// import { locationIdFromEthersBN } from './location';

// export type RawPlayer = Awaited<ReturnType<DarkForest['players']>>;

// /**
//  * Converts the raw typechain result of a call which fetches a
//  * `PlayerTypes.Player` struct, and converts it into an object
//  * with type `Player` (see @df/types) that can be used by a client.
//  *
//  * @param rawPlayer result of an ethers.js contract call which returns a raw
//  * `PlayerTypes.Player` struct, typed with typechain.
//  */
// export function decodePlayer(rawPlayer: RawPlayer): Player {
//   return {
//     address: address(rawPlayer.player),
//     initTimestamp: rawPlayer.initTimestamp.toNumber(),
//     homePlanetId: locationIdFromEthersBN(rawPlayer.homePlanetId),
//     lastRevealTimestamp: rawPlayer.lastRevealTimestamp.toNumber(),
//     lastClaimTimestamp: rawPlayer.lastRevealTimestamp.toNumber(),
//     lastBurnTimestamp: rawPlayer.lastRevealTimestamp.toNumber(),
//     lastKardashevTimestamp: rawPlayer.lastRevealTimestamp.toNumber(),
//     lastActivateArtifactTimestamp: rawPlayer.lastRevealTimestamp.toNumber(),
//     lastBuyArtifactTimestamp: rawPlayer.lastRevealTimestamp.toNumber(),
//     score: rawPlayer.score.toNumber(),
//     rank: undefined,
//     spaceJunk: rawPlayer.spaceJunk.toNumber(),
//     spaceJunkLimit: rawPlayer.spaceJunkLimit.toNumber(),
//     claimedShips: rawPlayer.claimedShips,
//     finalRank: rawPlayer.finalRank.toNumber(),
//     claimedReward: rawPlayer.claimedReward,
//     activateArtifactAmount: rawPlayer.activateArtifactAmount.toNumber(),
//     buyArtifactAmount: rawPlayer.buyArtifactAmount.toNumber(),
//     silver: rawPlayer.silver.toNumber() / CONTRACT_PRECISION,
//     dropBombAmount: rawPlayer.dropBombAmount.toNumber(),
//     pinkAmount: rawPlayer.pinkAmount.toNumber(),
//     pinkedAmount: rawPlayer.pinkedAmount.toNumber(),
//     moveCount: rawPlayer.moveCount.toNumber(),
//     hatCount: rawPlayer.hatCount.toNumber(),
//     kardashevAmount: rawPlayer.kardashevAmount.toNumber(),
//     buyPlanetAmount: rawPlayer.buyPlanetAmount.toNumber(),
//     buySpaceshipAmount: rawPlayer.buySpaceshipAmount.toNumber(),
//     unionId: rawPlayer.unionId.toString() as UnionId,
//     leaveUnionTimestamp: rawPlayer.leaveUnionTimestamp.toNumber(),
//   };
// }
