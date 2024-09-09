import { isLocatable } from "@df/gamelogic";
import { isUnconfirmedMoveTx } from "@df/serde";
import {
  ArtifactType,
  Planet,
  RendererType,
  RenderZIndex,
  RGBVec,
  UIRendererType,
  WorldCoords,
} from "@df/types";
import { engineConsts } from "./EngineConsts";
import { Renderer } from "./Renderer";
import { GameGLManager } from "./WebGL/GameGLManager";

const { orangeA, red, redA, white, whiteA, purpleA, blueA, pinkA, sensaichaA } =
  engineConsts.colors;

export class UIRenderer implements UIRendererType {
  renderer: Renderer;

  rendererType = RendererType.UI;

  constructor(gl: GameGLManager) {
    this.renderer = gl.renderer;
  }

  queueBorders() {
    const { circleRenderer, context: gameUIManager } = this.renderer;
    const radius = gameUIManager.getWorldRadius();
    whiteA[3] = 255;
    circleRenderer.queueCircleWorld({ x: 0, y: 0 }, radius, whiteA, 2);
    const innerRadius = gameUIManager.getInnerRadius();
    circleRenderer.queueCircleWorld({ x: 0, y: 0 }, innerRadius, whiteA, 2);
  }

  queueMousePath() {
    const {
      context: uiManager,
      lineRenderer: lR,
      textRenderer: tR,
      // @ts-expect-error `cr` variable seems to be unused, double check and remove if redundant
      circleRenderer: cR,
    } = this.renderer;
    const mouseDownPlanet = uiManager.getMouseDownPlanet();
    const loc = mouseDownPlanet
      ? uiManager.getLocationOfPlanet(mouseDownPlanet.locationId)
      : undefined;

    const to: WorldCoords | undefined = uiManager.getHoveringOverCoords();
    const from: WorldCoords | undefined = loc?.coords;
    const toPlanet = uiManager.getPlanetWithCoords(to);

    if (mouseDownPlanet && from && to) {
      if (uiManager.getIsChoosingTargetPlanet()) {
        const artifactType = uiManager.getLinkSourceArtifactType();

        let showText = `Wormhole Target`;
        let lineColor = purpleA;

        if (artifactType === ArtifactType.IceLink) {
          showText = "IceLink Target";
          lineColor = blueA;
        } else if (artifactType === ArtifactType.FireLink) {
          showText = "FireLink Target";
          lineColor = pinkA;
        } else if (artifactType === ArtifactType.BlackDomain) {
          showText = "BlackDomain Target";
          lineColor = sensaichaA;
        } else if (artifactType === ArtifactType.Kardashev) {
          showText = "Kardashev Target";
          lineColor = redA;
        } else if (artifactType === ArtifactType.Bomb) {
          showText = "Bomb Target";
          lineColor = purpleA;
        }

        lR.queueLineWorld(from, to, lineColor, 2, RenderZIndex.Voyages);
        tR.queueTextWorld(showText, { x: to.x, y: to.y }, lineColor);
      } else {
        const myPlanet = uiManager.getPlanetWithCoords(from);
        if (myPlanet && isLocatable(myPlanet) && to !== from) {
          lR.queueLineWorld(
            from,
            to,
            uiManager.isAbandoning() ? orangeA : whiteA,
            2,
            RenderZIndex.Voyages,
          );

          let effectiveEnergy = myPlanet.energy;

          for (const unconfirmedMove of myPlanet.transactions?.getTransactions(
            isUnconfirmedMoveTx,
          ) ?? []) {
            effectiveEnergy -= unconfirmedMove.intent.forces;
          }

          const energy =
            (uiManager.getForcesSending(myPlanet.locationId) / 100) *
            effectiveEnergy;
          const distance = uiManager.getDistCoords(from, to);

          const myAtk: number = uiManager.getEnergyArrivingForMove(
            myPlanet.locationId,
            toPlanet?.locationId,
            distance,
            energy,
          );

          if (
            !uiManager.getHoveringOverPlanet() &&
            !uiManager.isSendingShip(myPlanet.locationId)
          ) {
            const color = myAtk > 0 ? whiteA : redA;
            color[3] = 255;
            tR.queueTextWorld(
              `Energy: ${Math.round(myAtk)}`,
              { x: to.x, y: to.y },
              color,
            );
          }
        }
      }
    }
  }

  private queueRectAtPlanet(
    planet: Planet,
    coords: WorldCoords,
    color: RGBVec,
  ) {
    const { context: uiManager, rectRenderer } = this.renderer;
    const sideLength =
      2.3 * uiManager.getRadiusOfPlanetLevel(planet.planetLevel);

    rectRenderer.queueRectCenterWorld(coords, sideLength, sideLength, color, 2);
  }

  queueSelectedRect() {
    const { context: uiManager } = this.renderer;
    const selectedCoords = uiManager.getSelectedCoords();
    const selectedPlanet = uiManager.getSelectedPlanet();
    if (!selectedPlanet || !selectedCoords) return;

    redA[3] = 255;
    this.queueRectAtPlanet(selectedPlanet, selectedCoords, red);
  }

  queueHoveringRect() {
    const { context: uiManager, rectRenderer } = this.renderer;

    const hoverCoords = uiManager.getHoveringOverCoords();
    const hoverPlanet = uiManager.getHoveringOverPlanet();
    if (!hoverCoords) return;
    if (!hoverPlanet) {
      rectRenderer.queueRectCenterWorld(hoverCoords, 1, 1, white, 2);
    } else {
      this.queueRectAtPlanet(hoverPlanet, hoverCoords, white);
    }
  }

  drawMiner() {
    const { overlay2dRenderer } = this.renderer;
    overlay2dRenderer.drawMiner();
  }

  queueSelectedRangeRing() {
    const selectedPlanet = this.renderer.context.getSelectedPlanet();
    const hoverPlanet = this.renderer.context.getHoveringOverPlanet();
    selectedPlanet &&
      (!hoverPlanet || hoverPlanet?.locationId === selectedPlanet.locationId) &&
      this.renderer.planetRenderManager.queueRangeRings(selectedPlanet);
  }

  // eslint-disable-next-line
  flush(): void { }
}
