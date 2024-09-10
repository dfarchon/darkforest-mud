import type { ArtifactId, LinkRendererType, LocationId } from "@df/types";
import { ArtifactType, RendererType, RenderZIndex } from "@df/types";

import { engineConsts } from "../EngineConsts";
import type { Renderer } from "../Renderer";
import type { GameGLManager } from "../WebGL/GameGLManager";
const { purpleA, blueA, pinkA, sensaichaA } = engineConsts.colors;

export class LinkRenderer implements LinkRendererType {
  renderer: Renderer;

  rendererType = RendererType.Link;

  constructor(gl: GameGLManager) {
    this.renderer = gl.renderer;
  }

  queueLinks() {
    const { context: gameUIManager } = this.renderer;

    for (const unconfirmedLink of gameUIManager.getUnconfirmedLinkActivations()) {
      if (unconfirmedLink.intent.linkTo) {
        this.drawVoyagePath(
          unconfirmedLink.intent.locationId,
          unconfirmedLink.intent.linkTo,
          unconfirmedLink.intent.artifactId,
          false,
        );
      }
    }

    for (const link of gameUIManager.getLinks()) {
      this.drawVoyagePath(link.from, link.to, link.artifactId, true);
    }
  }

  private drawVoyagePath(
    from: LocationId,
    to: LocationId,
    artifactId: ArtifactId,
    confirmed: boolean,
  ) {
    const { context: gameUIManager } = this.renderer;

    const fromLoc = gameUIManager.getLocationOfPlanet(from);
    const fromPlanet = gameUIManager.getPlanetWithId(from);
    const toLoc = gameUIManager.getLocationOfPlanet(to);
    const toPlanet = gameUIManager.getPlanetWithId(to);

    if (!fromPlanet || !fromLoc || !toLoc || !toPlanet) {
      return;
    }

    const artifact = gameUIManager.getArtifactWithId(artifactId);

    if (!artifact) {
      return;
    }

    let lineColor = purpleA;

    if (artifact.artifactType === ArtifactType.IceLink) {
      lineColor = blueA;
    }

    if (artifact.artifactType === ArtifactType.FireLink) {
      lineColor = pinkA;
    }

    if (artifact.artifactType === ArtifactType.BlackDomain) {
      lineColor = sensaichaA;
    }

    this.renderer.lineRenderer.queueLineWorld(
      fromLoc.coords,
      toLoc.coords,
      lineColor,
      confirmed ? 2 : 1,
      RenderZIndex.Voyages,
      confirmed ? false : true,
    );
  }

  // eslint-disable-next-line
  flush() {}
}
