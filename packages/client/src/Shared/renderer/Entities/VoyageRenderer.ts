import { EMPTY_ADDRESS } from "@df/constants";
import { formatNumber, hasOwner } from "@df/gamelogic";
import { getOwnerColorVec } from "@df/procedural";
import type {
  LocationId,
  Planet,
  Player,
  QueuedArrival,
  VoyageRendererType,
} from "@df/types";
import {
  ArtifactType,
  RendererType,
  RenderZIndex,
  TextAlign,
  TextAnchor,
} from "@df/types";

import { engineConsts } from "../EngineConsts";
import type { Renderer } from "../Renderer";
import type { GameGLManager } from "../WebGL/GameGLManager";

const { white, gold } = engineConsts.colors;
const { enemyA, mineA, shipA, supportA } = engineConsts.colors.voyage;

function getIsSupportVoyage(voyage: QueuedArrival, toPlanet: Planet) {
  return false;
  // let supportMove = false;

  // for (let i = 0; i < voyage.members.length; i++) {
  //   if (toPlanet.owner === voyage.members[i]) {
  //     supportMove = true;
  //     break;
  //   }
  // }
  // const result = supportMove && voyage.player !== toPlanet.owner;
  // return result;
}

function getVoyageColor(
  fromPlanet: Planet,
  toPlanet: Planet,
  isMine: boolean,
  isShip: boolean,
  isSupport: boolean,
) {
  if (isMine) {
    return mineA;
  }

  if (isSupport) {
    return supportA;
  }

  const isAttack = hasOwner(toPlanet) && fromPlanet.owner !== toPlanet.owner;

  if (isAttack) {
    if (isShip) {
      return shipA;
    } else {
      return enemyA;
    }
  }

  return getOwnerColorVec(fromPlanet);
}

/* responsible for calling renderers in order to draw voyages */
export class VoyageRenderer implements VoyageRendererType {
  renderer: Renderer;

  rendererType = RendererType.Voyager;
  constructor(gl: GameGLManager) {
    this.renderer = gl.renderer;
  }

  drawFleet(
    voyage: QueuedArrival,
    _player: Player | undefined,
    isMyVoyage: boolean,
    isShipVoyage: boolean,
    isSupportVoyage: boolean,
  ) {
    const {
      currentTick,
      now: nowMs,
      context: gameUIManager,
      circleRenderer: cR,
      textRenderer: tR,
      spriteRenderer: sR,
      planetRenderManager: pRM,
    } = this.renderer;

    const fromLoc = gameUIManager.getLocationOfPlanet(voyage.fromPlanet);
    const fromPlanet = gameUIManager.getPlanetWithId(voyage.fromPlanet);
    const toLoc = gameUIManager.getLocationOfPlanet(voyage.toPlanet);
    const toPlanet = gameUIManager.getPlanetWithId(voyage.toPlanet);

    if (!fromPlanet || !toLoc) {
      // not enough info to draw anything
      return;
    } else if (!fromLoc && fromPlanet && toLoc && toPlanet) {
      // can draw a ring around dest, but don't know source location
      const myMove = voyage.player === gameUIManager.getAccount();
      const shipMove = voyage.player === EMPTY_ADDRESS;
      const supportMove = getIsSupportVoyage(voyage, toPlanet);

      const now = nowMs / 1000;

      const timeLeft = Math.floor(
        gameUIManager.convertTickToMs(voyage.arrivalTick) / 1000 - now,
      );

      const radius = (timeLeft * fromPlanet.speed) / 100;

      const color = getVoyageColor(
        fromPlanet,
        toPlanet,
        myMove,
        shipMove,
        supportMove,
      );

      const text = shipMove ? "Ship" : `${Math.floor(voyage.energyArriving)}`;

      cR.queueCircleWorld(toLoc.coords, radius, color, 0.7, 1, true);
      tR.queueTextWorld(
        `${text} in ${Math.floor(timeLeft)}s`,
        { x: toLoc.coords.x, y: toLoc.coords.y + radius },
        color,
        undefined,
        TextAlign.Center,
        TextAnchor.Bottom,
      );
    } else if (fromLoc && fromPlanet && toLoc && toPlanet) {
      // know source and destination locations

      const departureTime = gameUIManager.convertTickToMs(voyage.departureTick);
      const arrivalTime = gameUIManager.convertTickToMs(voyage.arrivalTick);

      let proportion = (nowMs - departureTime) / (arrivalTime - departureTime);

      proportion = Math.max(proportion, 0.01);
      proportion = Math.min(proportion, 0.99);

      const shipsLocationX =
        (1 - proportion) * fromLoc.coords.x + proportion * toLoc.coords.x;
      const shipsLocationY =
        (1 - proportion) * fromLoc.coords.y + proportion * toLoc.coords.y;
      const shipsLocation = { x: shipsLocationX, y: shipsLocationY };

      const timeLeftSeconds = Math.floor((arrivalTime - nowMs) / 1000);

      const voyageColor = getVoyageColor(
        fromPlanet,
        toPlanet,
        isMyVoyage,
        isShipVoyage,
        isSupportVoyage,
      );

      // alpha calculation
      const viewport = this.renderer.getViewport();
      const dx = fromLoc.coords.x - toLoc.coords.x;
      const dy = fromLoc.coords.y - toLoc.coords.y;
      const distWorld = Math.sqrt(dx ** 2 + dy ** 2);
      const dist = viewport.worldToCanvasDist(distWorld);
      let alpha = 255;
      if (dist < 300) {
        alpha = (dist / 300) * 255;
      }

      voyageColor[3] = alpha;
      const fleetRadius = 4;
      const artifactSizePixels = 20;
      cR.queueCircleWorldCenterOnly(shipsLocation, fleetRadius, voyageColor);
      if (voyage.artifactId) {
        const artifact = gameUIManager.getArtifactWithId(voyage.artifactId);
        if (artifact) {
          // const viewport = this.renderer.getViewport();
          const screenCoords = viewport.worldToCanvasCoords(shipsLocation);
          const distanceFromCenterOfFleet =
            fleetRadius * 1.5 + artifactSizePixels;
          const x = distanceFromCenterOfFleet + screenCoords.x;
          const y = screenCoords.y;

          const k = 40;
          const size = (k * 20.0) / (1.0 * viewport.worldToCanvasDist(20));

          if (artifact.artifactType !== ArtifactType.Avatar) {
            sR.queueArtifact(artifact, { x, y }, artifactSizePixels);
          } else {
            pRM.queueArtifactImage(
              viewport.canvasToWorldCoords({ x, y }),
              size,
              artifact,
            );
          }
        }
      }

      // queue text
      tR.queueTextWorld(
        `${timeLeftSeconds.toString()}s`,
        {
          x: shipsLocationX,
          y: shipsLocationY - 0.5,
        },
        [...white, alpha],
        0,
        TextAlign.Center,
        TextAnchor.Top,
      );
      if (voyage.energyArriving > 0) {
        tR.queueTextWorld(
          `${formatNumber(voyage.energyArriving)}`,
          {
            x: shipsLocationX,
            y: shipsLocationY + 0.5,
          },
          [...white, alpha],
          -0,
          TextAlign.Center,
          TextAnchor.Bottom,
        );
      }
      if (voyage.silverMoved > 0) {
        tR.queueTextWorld(
          `${formatNumber(voyage.silverMoved)}`,
          {
            x: shipsLocationX,
            y: shipsLocationY + 0.5,
          },
          [...gold, alpha],
          -1,
          TextAlign.Center,
          TextAnchor.Bottom,
        );
      }
    }
  }

  queueVoyages(): void {
    const { context: gameUIManager, now, currentTick } = this.renderer;
    const voyages = gameUIManager.getAllVoyages();
    for (const voyage of voyages) {
      if (currentTick < voyage.arrivalTick) {
        const isMyVoyage =
          voyage.player === gameUIManager.getAccount() ||
          gameUIManager.getArtifactWithId(voyage.artifactId)?.controller ===
            gameUIManager.getPlayer()?.address;
        const isShipVoyage = voyage.player === EMPTY_ADDRESS;
        const sender = gameUIManager.getPlayer(voyage.player);

        const toPlanet = gameUIManager.getPlanetWithId(voyage.toPlanet);
        const isSupportVoyage = toPlanet
          ? getIsSupportVoyage(voyage, toPlanet)
          : false;

        this.drawVoyagePath(
          voyage.fromPlanet,
          voyage.toPlanet,
          true,
          isMyVoyage,
          isShipVoyage,
          isSupportVoyage,
        );

        this.drawFleet(
          voyage,
          sender,
          isMyVoyage,
          isShipVoyage,
          isSupportVoyage,
        );
      } else {
        // this move arrived, apply it to target planet and remove it
        gameUIManager.updateArrival(voyage.toPlanet, voyage);
      }
    }

    const unconfirmedDepartures = gameUIManager.getUnconfirmedMoves();
    for (const unconfirmedMove of unconfirmedDepartures) {
      this.drawVoyagePath(
        unconfirmedMove.intent.from,
        unconfirmedMove.intent.to,
        false,
        true,
        // This false doesn't matter because we force isMyVoyage to true
        false,
        false, // unconfirmed moves are always white
      );
    }
  }

  private drawVoyagePath(
    from: LocationId,
    to: LocationId,
    confirmed: boolean,
    isMyVoyage: boolean,
    isShipVoyage: boolean,
    isSupportVoyage: boolean,
  ) {
    const { context: gameUIManager } = this.renderer;

    const fromLoc = gameUIManager.getLocationOfPlanet(from);
    const fromPlanet = gameUIManager.getPlanetWithId(from);
    const toLoc = gameUIManager.getLocationOfPlanet(to);
    const toPlanet = gameUIManager.getPlanetWithId(to);

    if (!fromPlanet || !fromLoc || !toLoc || !toPlanet) {
      return;
    }

    const voyageColor = getVoyageColor(
      fromPlanet,
      toPlanet,
      isMyVoyage,
      isShipVoyage,
      isSupportVoyage,
    );

    this.renderer.lineRenderer.queueLineWorld(
      fromLoc.coords,
      toLoc.coords,
      voyageColor,
      confirmed ? 2 : 1,
      RenderZIndex.Voyages,
      confirmed ? false : true,
    );
  }

  // eslint-disable-next-line
  flush() {}
}
