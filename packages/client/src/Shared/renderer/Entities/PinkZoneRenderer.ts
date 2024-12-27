import {
  type PinkZone,
  type PinkZoneRendererType,
  RendererType,
  RenderZIndex,
  type RGBAVec,
  TextAlign,
  TextAnchor,
} from "@df/types";

import { engineConsts } from "../EngineConsts";
import type { Renderer, RendererGameContext } from "../Renderer";
import type { GameGLManager } from "../WebGL/GameGLManager";

const { pinkA } = engineConsts.colors;

export class PinkZoneRenderer implements PinkZoneRendererType {
  rendererType = RendererType.PinkZone;
  gl: GameGLManager;
  context: RendererGameContext;
  renderer: Renderer;

  constructor(glManager: GameGLManager) {
    this.gl = glManager;
    this.renderer = glManager.renderer;
    this.context = glManager.renderer.context;
  }

  queuePinkZones(): void {
    const { circleRenderer: cR, lineRenderer: lR } = this.renderer;
    const curTick = this.context.getCurrentTick();
    for (const zone of this.context.getPinkZones()) {
      const launchBase = this.context.getLocationOfPlanet(zone.launchPlanet);
      if (zone.arrivalTick === 0 && launchBase) {
        lR.queueLineWorld(
          launchBase.coords,
          zone.coords,
          pinkA,
          2,
          RenderZIndex.Voyages,
          true,
        );
        cR.queueCircleWorld(zone.coords, zone.radius, pinkA, 2, 1, true);
      } else if (curTick <= zone.arrivalTick && launchBase) {
        lR.queueLineWorld(
          launchBase.coords,
          zone.coords,
          pinkA,
          2,
          RenderZIndex.Voyages,
          false,
        );
        cR.queueCircleWorld(zone.coords, zone.radius, pinkA, 2);
        this.drawBombOnFly(zone);
      } else if (curTick < zone.arrivalTick + 300) {
        cR.queueCircleWorld(zone.coords, zone.radius, [255, 192, 203, 160]);
      }
    }
  }

  drawBombOnFly(zone: PinkZone): void {
    const {
      circleRenderer: cR,
      textRenderer: tR,
      now: nowMs,
      context: gameUIManager,
    } = this.renderer;
    const launchBase = gameUIManager.getLocationOfPlanet(zone.launchPlanet);
    if (!launchBase) {
      return;
    }

    const departureTime = gameUIManager.convertTickToMs(zone.launchTick);
    const arrivalTime = gameUIManager.convertTickToMs(zone.arrivalTick);
    let proportion = (nowMs - departureTime) / (arrivalTime - departureTime);

    proportion = Math.max(proportion, 0.01);
    proportion = Math.min(proportion, 0.99);
    const shipsLocationX =
      (1 - proportion) * launchBase.coords.x + proportion * zone.coords.x;
    const shipsLocationY =
      (1 - proportion) * launchBase.coords.y + proportion * zone.coords.y;
    const shipsLocation = { x: shipsLocationX, y: shipsLocationY };

    const timeLeftSeconds = Math.floor((arrivalTime - nowMs) / 1000);
    const voyageColor = [255, 192, 203, 160] as RGBAVec;

    // alpha calculation
    const viewport = this.renderer.getViewport();
    const dx = launchBase.coords.x - zone.coords.x;
    const dy = launchBase.coords.y - zone.coords.y;
    const distWorld = Math.sqrt(dx ** 2 + dy ** 2);
    const dist = viewport.worldToCanvasDist(distWorld);
    let alpha = 255;
    if (dist < 300) {
      alpha = (dist / 300) * 255;
    }

    voyageColor[3] = alpha;
    const fleetRadius = 4;
    cR.queueCircleWorldCenterOnly(shipsLocation, fleetRadius, voyageColor);
    // queue text
    tR.queueTextWorld(
      `${timeLeftSeconds.toString()}s`,
      {
        x: shipsLocationX,
        y: shipsLocationY - 0.5,
      },
      [255, 192, 203, alpha],
      0,
      TextAlign.Center,
      TextAnchor.Top,
    );
    tR.queueTextWorld(
      `Bomb`,
      {
        x: shipsLocationX,
        y: shipsLocationY + 0.5,
      },
      [255, 192, 203, alpha],
      -0,
      TextAlign.Center,
      TextAnchor.Bottom,
    );
  }

  flush(): void {
    const { circleRenderer: cR } = this.renderer;
    cR.flush();
  }
}
