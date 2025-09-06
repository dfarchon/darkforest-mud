import { cloneDeep } from "@backend/Utils/clone-deep";
import { CONTRACT_PRECISION } from "@df/constants";
import { hasOwner, isEmojiFlagMessage } from "@df/gamelogic";
import type {
  Artifact,
  EmojiFlagBody,
  Materials,
  Planet,
  PlanetMessage,
  QueuedArrival,
  Upgrade,
} from "@df/types";
import { ArrivalType, ArtifactType, PlanetType } from "@df/types";

import type { ContractConstants } from "../../_types/darkforest/api/ContractsAPITypes";
import type { GuildUtils } from "./GuildUtils";
// TODO: planet class, cmon, let's go
export const blocksLeftToProspectExpiration = (
  currentBlockNumber: number,
  prospectedBlockNumber?: number,
) => {
  return (prospectedBlockNumber || 0) + 255 - currentBlockNumber;
};

// TODO: Planet. Class.
export const prospectExpired = (
  currentBlockNumber: number,
  prospectedBlockNumber: number,
) => {
  return (
    blocksLeftToProspectExpiration(currentBlockNumber, prospectedBlockNumber) <=
    0
  );
};

export const isFindable = (
  planet: Planet,
  currentBlockNumber?: number,
): boolean => {
  return (
    currentBlockNumber !== undefined &&
    planet.planetType === PlanetType.RUINS &&
    planet.prospectedBlockNumber !== undefined &&
    !planet.hasTriedFindingArtifact &&
    !prospectExpired(currentBlockNumber, planet.prospectedBlockNumber)
  );
};

export const isProspectable = (planet: Planet): boolean => {
  return (
    planet.planetType === PlanetType.RUINS &&
    planet.prospectedBlockNumber === undefined
  );
};

const getSilverOverTick = (
  planet: Planet,
  startTick: number,
  endTick: number,
): number => {
  if (!hasOwner(planet)) {
    return planet.silver;
  }

  if (planet.silver > planet.silverCap) {
    return planet.silverCap;
  }

  let tickElapsed = endTick - Math.max(startTick, planet.addJunkTick);
  if (planet.owner != planet.junkOwner) {
    tickElapsed = 0;
  }

  return Math.max(
    Math.min(
      tickElapsed * planet.silverGrowth + planet.silver,
      planet.silverCap,
    ),
    0,
  );
};

const getEnergyAtTick = (planet: Planet, atTick: number): number => {
  if (planet.energy === 0) {
    return 0;
  }
  if (!hasOwner(planet)) {
    return planet.energy;
  }

  if (planet.planetType === PlanetType.SILVER_BANK) {
    if (planet.energy > planet.energyCap) {
      return planet.energyCap;
    }
  }

  let tickElapsed = atTick - Math.max(planet.lastUpdated, planet.addJunkTick);

  if (planet.owner != planet.junkOwner) {
    tickElapsed = 0;
  }

  const denominator =
    Math.exp((-4 * planet.energyGrowth * tickElapsed) / planet.energyCap) *
      (planet.energyCap / planet.energy - 1) +
    1;

  return planet.energyCap / denominator;
};

export const updatePlanetToTick = (
  planet: Planet,
  planetArtifacts: Artifact[],
  atTick: number,
  contractConstants: ContractConstants,
  setPlanet: (p: Planet) => void = () => {},
): void => {
  if (atTick < planet.lastUpdated) {
    return;
  }

  if (atTick <= planet.addJunkTick) {
    return;
  }

  // if (planet.pausers === 0) {
  planet.silver = getSilverOverTick(planet, planet.lastUpdated, atTick);

  planet.energy = getEnergyAtTick(planet, atTick);
  // }

  // update materials to tick only for SILVER_MINE planets
  if (planet.planetType === PlanetType.SILVER_MINE) {
    planet.materials = planet.materials.map((mat) => ({
      ...mat,
      materialAmount: Number(
        getMaterialAmount(mat, planet.lastUpdated, atTick).toFixed(0),
      ),
    }));
  }

  planet.lastUpdated = atTick;

  // NOTE: please update to tick
  // const photoidActivationTime =
  //   contractConstants.PHOTOID_ACTIVATION_DELAY * 1000;
  // const activePhotoid = planetArtifacts.find(
  //   (a) =>
  //     a.artifactType === ArtifactType.PhotoidCannon &&
  //     isActivated(a) &&
  //     atTimeMillis - a.lastActivated * 1000 >= photoidActivationTime,
  // );

  // if (activePhotoid && !planet.localPhotoidUpgrade) {
  //   planet.localPhotoidUpgrade = activePhotoid.timeDelayedUpgrade;
  //   applyUpgrade(planet, activePhotoid.timeDelayedUpgrade);
  // }

  setPlanet(planet);
};

export const applyUpgrade = (
  planet: Planet,
  upgrade: Upgrade,
  unApply = false,
) => {
  if (unApply) {
    planet.speed /= upgrade.energyCapMultiplier / 100;
    planet.energyGrowth /= upgrade.energyGroMultiplier / 100;
    planet.range /= upgrade.rangeMultiplier / 100;
    planet.speed /= upgrade.speedMultiplier / 100;
    planet.defense /= upgrade.defMultiplier / 100;
  } else {
    planet.speed *= upgrade.energyCapMultiplier / 100;
    planet.energyGrowth *= upgrade.energyGroMultiplier / 100;
    planet.range *= upgrade.rangeMultiplier / 100;
    planet.speed *= upgrade.speedMultiplier / 100;
    planet.defense *= upgrade.defMultiplier / 100;
  }
};

/**
 * @param previous The previously calculated state of a planet
 * @param current The current calculated state of the planet
 * @param arrival The Arrival that caused the state change
 */
export interface PlanetDiff {
  previous: Planet;
  current: Planet;
  arrival: QueuedArrival;
}

export const arrive = (
  toPlanet: Planet,
  artifactsOnPlanet: Artifact[],
  arrival: QueuedArrival,
  arrivingArtifact: Artifact | undefined,
  contractConstants: ContractConstants,
  guildUtils: GuildUtils,
): PlanetDiff => {
  // this function optimistically simulates an arrival
  if (toPlanet.locationId !== arrival.toPlanet) {
    throw new Error(
      `attempted to apply arrival for wrong toPlanet ${toPlanet.locationId}`,
    );
  }

  // update toPlanet energy and silver right before arrival
  updatePlanetToTick(
    toPlanet,
    artifactsOnPlanet,
    arrival.arrivalTick,
    contractConstants,
  );

  const prevPlanet = cloneDeep(toPlanet);

  // if (toPlanet.destroyed || toPlanet.frozen) {
  //   return { arrival: arrival, previous: toPlanet, current: toPlanet };
  // }

  // apply energy
  const { energyArriving, arrivalTick } = arrival;

  const activeArtifact = artifactsOnPlanet.find(
    (a) => a.lastActivated > a.lastDeactivated,
  );

  const inSameGuild =
    guildUtils.inSameGuildAtTick(arrival.player, toPlanet.owner, arrivalTick) &&
    arrival.player !== toPlanet.owner;

  if (arrival.player !== toPlanet.owner && !inSameGuild) {
    if (
      toPlanet.energy >
      Math.floor(
        (energyArriving * CONTRACT_PRECISION * 100) / toPlanet.defense,
      ) /
        CONTRACT_PRECISION
    ) {
      // attack reduces target planet's garrison but doesn't conquer it
      toPlanet.energy -=
        Math.floor(
          (energyArriving * CONTRACT_PRECISION * 100) / toPlanet.defense,
        ) / CONTRACT_PRECISION;
    } else {
      // conquers planet
      toPlanet.owner = arrival.player;
      toPlanet.energy =
        energyArriving -
        Math.floor(
          (toPlanet.energy * CONTRACT_PRECISION * toPlanet.defense) / 100,
        ) /
          CONTRACT_PRECISION;
    }
  } else {
    // moving between my own planets
    toPlanet.energy += energyArriving;
  }

  if (
    toPlanet.planetType === PlanetType.SILVER_BANK
    //  || toPlanet.pausers !== 0
  ) {
    if (toPlanet.energy > toPlanet.energyCap) {
      toPlanet.energy = toPlanet.energyCap;
    }
  }

  // apply silver
  if (toPlanet.silver + arrival.silverMoved > toPlanet.silverCap) {
    toPlanet.silver = toPlanet.silverCap;
  } else {
    toPlanet.silver += arrival.silverMoved;
  }

  // transfer artifact if necessary
  if (arrival.artifactId) {
    toPlanet.heldArtifactIds.push(arrival.artifactId);
  }

  if (arrivingArtifact) {
    // if (arrivingArtifact.artifactType === ArtifactType.ShipMothership) {
    //   if (toPlanet.energyGroDoublers === 0) {
    //     toPlanet.energyGrowth *= 2;
    //   }
    //   toPlanet.energyGroDoublers++;
    // } else if (arrivingArtifact.artifactType === ArtifactType.ShipWhale) {
    //   if (toPlanet.silverGroDoublers === 0) {
    //     toPlanet.silverGrowth *= 2;
    //   }
    //   toPlanet.silverGroDoublers++;
    // } else if (arrivingArtifact.artifactType === ArtifactType.ShipTitan) {
    //   toPlanet.pausers++;
    // }
    arrivingArtifact.onPlanetId = toPlanet.locationId;
  }
  // materials moved with arrival
  if (arrival.materialsMoved) {
    for (const moved of arrival.materialsMoved) {
      const idx = toPlanet.materials.findIndex(
        (mat) => mat?.materialId === moved?.materialId,
      );
      if (idx !== -1) {
        toPlanet.materials[idx].materialAmount = Math.min(
          Number(toPlanet.materials[idx].materialAmount) +
            Number(moved.materialAmount),
          Number(toPlanet.materials[idx].cap),
        );
      }
    }
  }
  return { arrival, current: toPlanet, previous: prevPlanet };
};

/**
 * @todo ArrivalUtils has become a dumping ground for functions that should just live inside of a
 * `Planet` class.
 */

const getMaterialAmount = (
  material: Materials,
  startTick: number,
  endTick: number,
): number => {
  const ticksPassed = endTick - startTick;

  const growthRate =
    typeof material.growthRate === "bigint"
      ? Number(material.growthRate)
      : material.growthRate;

  const currentAmount =
    typeof material.materialAmount === "bigint"
      ? Number(material.materialAmount)
      : material.materialAmount;

  const cap =
    typeof material.cap === "bigint" ? Number(material.cap) : material.cap;

  if (!material.growth) {
    return Number(currentAmount);
  }

  const grown = ticksPassed * Number(growthRate);

  return Math.min(Number(currentAmount) + grown, Number(cap));
};

export function getEmojiMessage(
  planet: Planet | undefined,
): PlanetMessage<EmojiFlagBody> | undefined {
  return planet?.messages?.find(isEmojiFlagMessage);
}
