import { mimcHash, perlin } from "@df/hashing";
import { locationIdFromBigInt } from "@df/serde";
import type { Chunk, PerlinConfig, Rectangle, WorldLocation } from "@df/types";
import { toWorldLocation } from "@df/world/locations";
import type { BigInteger } from "big-integer";
import bigInt from "big-integer";

import type { MinerWorkerMessage } from "../../_types/global/GlobalTypes";
import { LOCATION_ID_UB } from "../../Frontend/Utils/constants";
import { getPlanetLocations } from "./permutation";

/* eslint-disable @typescript-eslint/no-explicit-any */
const ctx: Worker = self as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const exploreChunk = (
  chunkFootprint: Rectangle,
  workerIndex: number,
  totalWorkers: number,
  planetRarity: number,
  jobId: number,
  useFakeHash: boolean,
  planetHashKey: number,
  spaceTypeKey: number,
  biomebaseKey: number,
  perlinLengthScale: number,
  perlinMirrorX: boolean,
  perlinMirrorY: boolean,
) => {
  const planetHashFn = mimcHash(planetHashKey);
  const spaceTypePerlinOpts: PerlinConfig = {
    key: spaceTypeKey,
    scale: perlinLengthScale,
    mirrorX: perlinMirrorX,
    mirrorY: perlinMirrorY,
    floor: true,
  };
  const biomebasePerlinOpts: PerlinConfig = {
    key: biomebaseKey,
    scale: perlinLengthScale,
    mirrorX: perlinMirrorX,
    mirrorY: perlinMirrorY,
    floor: true,
  };

  let planetLocations: WorldLocation[] = [];
  if (useFakeHash) {
    planetLocations =
      workerIndex > 0
        ? []
        : getPlanetLocations(
            spaceTypeKey,
            biomebaseKey,
            perlinLengthScale,
            perlinMirrorY,
            perlinMirrorY,
          )(chunkFootprint, planetRarity);
  } else {
    const planetRarityBI: BigInteger = bigInt(planetRarity);
    let count = 0;
    const { x: bottomLeftX, y: bottomLeftY } = chunkFootprint.bottomLeft;
    const { sideLength } = chunkFootprint;
    for (let x = bottomLeftX; x < bottomLeftX + sideLength; x++) {
      for (let y = bottomLeftY; y < bottomLeftY + sideLength; y++) {
        if (count % totalWorkers === workerIndex) {
          const hash: BigInteger = planetHashFn(x, y);
          if (hash.lesser(LOCATION_ID_UB.divide(planetRarityBI))) {
            planetLocations.push(
              // NOTE: Ensure to wrap via toWorldLocation to get the same world location
              //       references accross the code
              toWorldLocation({
                coords: { x, y },
                hash: locationIdFromBigInt(hash),
                perlin: perlin({ x, y }, spaceTypePerlinOpts),
                biomebase: perlin({ x, y }, biomebasePerlinOpts),
              }),
            );
          }
        }
        count += 1;
      }
    }
  }
  const chunkCenter = {
    x: chunkFootprint.bottomLeft.x + chunkFootprint.sideLength / 2,
    y: chunkFootprint.bottomLeft.y + chunkFootprint.sideLength / 2,
  };
  const chunkData: Chunk = {
    chunkFootprint,
    planetLocations,
    perlin: perlin(chunkCenter, { ...spaceTypePerlinOpts, floor: false }),
  };
  ctx.postMessage(JSON.stringify([chunkData, jobId]));
};

ctx.addEventListener("message", (e: MessageEvent) => {
  const exploreMessage: MinerWorkerMessage = JSON.parse(
    e.data,
  ) as MinerWorkerMessage;

  exploreChunk(
    exploreMessage.chunkFootprint,
    exploreMessage.workerIndex,
    exploreMessage.totalWorkers,
    exploreMessage.planetRarity,
    exploreMessage.jobId,
    exploreMessage.useMockHash,
    exploreMessage.planetHashKey,
    exploreMessage.spaceTypeKey,
    exploreMessage.biomebaseKey,
    exploreMessage.perlinLengthScale,
    exploreMessage.perlinMirrorX,
    exploreMessage.perlinMirrorY,
  );
});
