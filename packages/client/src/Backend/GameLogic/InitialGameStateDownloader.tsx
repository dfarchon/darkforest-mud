import type {
  Artifact,
  ArtifactId,
  LocationId,
  Planet,
  Player,
  QueuedArrival,
  RevealedCoords,
  VoyageId,
} from "@df/types";
import React from "react";

import type { ContractConstants } from "../../_types/darkforest/api/ContractsAPITypes";
import { Link } from "../../Frontend/Components/CoreUI";
import type { LoadingBarHandle } from "../../Frontend/Components/TextLoadingBar";
import { DarkForestTips } from "../../Frontend/Views/DarkForestTips";
import type { TerminalHandle } from "../../Frontend/Views/Terminal";
import type PersistentChunkStore from "../Storage/PersistentChunkStore";
import type { ContractsAPI } from "./ContractsAPI";

export interface InitialGameState {
  contractConstants: ContractConstants;
  players: Map<string, Player>;
  worldRadius: number;
  touchedPlanetIds: LocationId[];
  revealedPlanetCoords: RevealedCoords[];
  pendingMoves: QueuedArrival[];
  touchedAndLocatedPlanets: Map<LocationId, Planet>;
  artifacts: Map<ArtifactId, Artifact>;
  revealedCoordsMap: Map<LocationId, RevealedCoords>;
  planetVoyageIdMap: Map<LocationId, VoyageId[]>;
  arrivals: Map<VoyageId, QueuedArrival>;
  paused: boolean;
}

export class InitialGameStateDownloader {
  private terminal: TerminalHandle;

  public constructor(terminal: TerminalHandle) {
    this.terminal = terminal;
  }

  private makeProgressListener(prettyEntityName: string) {
    const ref = React.createRef<LoadingBarHandle>();
    this.terminal.printLoadingBar(prettyEntityName, ref);
    this.terminal.newline();

    return (percent: number) => {
      ref.current?.setFractionCompleted(percent);
    };
  }

  async download(
    contractsAPI: ContractsAPI,
    persistentChunkStore: PersistentChunkStore,
  ): Promise<InitialGameState> {
    /**
     * In development we use the same contract address every time we deploy,
     * so storage is polluted with the IDs of old universes.
     */
    // const isDev = import.meta.env.VITE_NODE_ENV !== "production";
    // const storedTouchedPlanetIds = isDev
    //   ? []
    //   : await persistentChunkStore.getSavedTouchedPlanetIds();
    // const storedRevealedCoords = isDev
    //   ? []
    //   : await persistentChunkStore.getSavedRevealedCoords();

    this.terminal.printElement(<DarkForestTips tips={tips} />);
    this.terminal.newline();

    const planetIdsLoadingBar = this.makeProgressListener("Planet IDs");
    const playersLoadingBar = this.makeProgressListener("Players");
    const revealedPlanetsCoordsLoadingBar = this.makeProgressListener(
      "Revealed Planet Coordinates",
    );

    const pendingMovesLoadingBar = this.makeProgressListener("Pending Moves");
    const planetsLoadingBar = this.makeProgressListener("Planets");
    const artifactsLoadingBar = this.makeProgressListener("Artifacts");

    const contractConstants = contractsAPI.getConstants();
    const worldRadius = contractsAPI.getWorldRadius();

    const players = await contractsAPI.getPlayers(playersLoadingBar);

    const arrivals: Map<VoyageId, QueuedArrival> = new Map();
    const planetVoyageIdMap: Map<LocationId, VoyageId[]> = new Map();

    const minedChunks = Array.from(persistentChunkStore.allChunks());
    const minedPlanetIds = new Set(
      minedChunks.flatMap((c) => c.planetLocations).map((l) => l.hash),
    );

    const touchedPlanetIds = contractsAPI.getTouchedPlanetIds(
      // storedTouchedPlanetIds.length,
      planetIdsLoadingBar,
    );

    const revealedPlanetCoords = contractsAPI.getRevealedPlanetsCoords(
      revealedPlanetsCoordsLoadingBar,
    );

    const revealedCoordsMap = new Map<LocationId, RevealedCoords>(
      revealedPlanetCoords.map((revealedCoords) => [
        revealedCoords.hash,
        revealedCoords,
      ]),
    );

    const planetIdPredicate = (locationId: LocationId) =>
      minedPlanetIds.has(locationId) || revealedCoordsMap.has(locationId);

    const touchedPlanetIdsFiltered = touchedPlanetIds.filter(planetIdPredicate);

    const pendingMoves = contractsAPI.getAllArrivals(
      touchedPlanetIdsFiltered,
      pendingMovesLoadingBar,
    );

    // add origin points of voyages to known planets, because we need to know origin owner to render
    // the shrinking / incoming circle
    for (const arrival of pendingMoves) {
      if (planetIdPredicate(arrival.fromPlanet)) {
        touchedPlanetIdsFiltered.push(arrival.fromPlanet);
      }
    }

    const touchedAndLocatedPlanets = contractsAPI.bulkGetPlanets(
      touchedPlanetIdsFiltered,
      planetsLoadingBar,
    );

    for (const planetId of touchedAndLocatedPlanets.keys()) {
      planetVoyageIdMap.set(planetId, []);
    }

    for (const arrival of pendingMoves) {
      const voyageIds = planetVoyageIdMap.get(arrival.toPlanet);
      if (voyageIds) {
        voyageIds.push(arrival.eventId);
        planetVoyageIdMap.set(arrival.toPlanet, voyageIds);
      }

      arrivals.set(arrival.eventId, arrival);
    }

    const artifactIds = contractsAPI.getTouchedArtifactIds();
    const artifacts = contractsAPI.bulkGetArtifacts(
      artifactIds,
      artifactsLoadingBar,
    );

    const paused = contractsAPI.getIsPaused();

    return {
      contractConstants: contractConstants,
      players: players,
      worldRadius,
      touchedPlanetIds: touchedPlanetIdsFiltered,
      revealedPlanetCoords,
      pendingMoves,
      touchedAndLocatedPlanets,
      artifacts,
      revealedCoordsMap,
      planetVoyageIdMap,
      arrivals,
      paused: paused,
    };
  }
}

const tips = [
  "Beware of pirates! To capture a planet with pirates, simply send an attack large enough to overcome its current energy.",
  <>
    Navigate the Dark Forest MUD with allies (and enemies) - join the{" "}
    <Link to="https://discord.com/invite/f3FrFA4T25">DFArchon Discord</Link>!
    <br />
    <br />
    Dark Forest MUD is a community-driven development of{" "}
    <Link to="https://zkga.me/">Dark Forest</Link> based on the{" "}
    <Link to="https://mud.dev">MUD</Link> engine.
    <br />
    DFArchon is a dev team focused on fully onchain games.
  </>,
  "There are many different artifact types, each with unique properties... try activating one on a planet!",
  "The top players get special rewards at the end of each Dark Forest MUD round!",
  "There are many different ways to enjoy Dark Forest MUD - as long as you're having fun, you're doing it right.",
  "Be careful when capturing planets - if you attack a player-owned planet, it may look like an act of war!",
  "A planet can have at most one active artifact.",
  "Withdrawing an artifact (via a Spacetime Rip) gives you full control of that artifact as an ERC 721 token. You can deposit artifacts you have withdrawn back into the universe via Spacetime Rips.",
  "You can use plugins to enhance your capabilities by automating repetitive tasks. The top players are probably using plugins (:",
  "Quasars can store lots of energy and silver, at the expense of being able to generate neither.",
  "Never share your private key with anyone else!",
  "Broadcasting a planet reveals its location to ALL other players!",
  "Claiming a planet reveals its location to ALL other players!",
  "You can spend silver to upgrade your planets.",
  "Planets in Nebula are more difficult to capture than planets in Deep Space.",
  "Some of the universe is corrupted, and contains special versions of the artifacts.",
  "You can import and export maps! Be careful importing maps from others, they may contain fabricated map data.",
  <>
    If mining the universe is slow on your computer, you can try the Remote
    Miner plugin. Find that and other plugins on{" "}
    <Link to="https://dfares-plugins.netlify.app/">
      dfares-plugins.netlify.app
    </Link>
    .
  </>,
  "A planet can only have 6 artifacts on it at any given time. Sometimes more if you get lucky. It's the blockchain, after all.",
  'A foundry must be prospected before you can attempt to find an artifact, but make sure to click "Find" before 256 blocks or it will be lost forever.',
  "Defense upgrades make your planets less vulnerable to attack, Range upgrades make your voyages go further and decay less, and Speed upgrades make your voyages go much faster.",
  "Wormhole artifacts reduce the effective distance between 2 planets. Try using them to link 2 planets very far apart!",
  "Upon deactivation, some artifacts must cooldown for a period before they can be activated again.",
  "Photoid Cannon artifacts will debuff your planet on activation, but get a massive stat boost for the first voyage from the planet after that a charging period. Photoid Cannon artifacts are destroyed upon use.",
  "Planetary Shield artifacts will massively boost a planet's defense, but at the cost of energy and energy growth stats. Planetary Shield artifacts are destroyed upon deactivation.",
  "Bloom Filter artifacts instantly set a planet's energy and silver to full, but are destroyed upon activation. Try using them on a Quasar!",
  "Dark Forest MUD exists on the blockchain, so you can play with an entirely different client if you want.",
  <>
    Writing plugins? Check out some documentation{" "}
    <Link to="https://github.com/dfarchon/DFARES-v0.1/blob/main/client/docs/classes/Backend_GameLogic_GameManager.default.md">
      here
    </Link>{" "}
    and{" "}
    <Link to="https://github.com/dfarchon/DFARES-v0.1/blob/main/client/docs/classes/Backend_GameLogic_GameUIManager.default.md">
      here
    </Link>
    .
  </>,
];
