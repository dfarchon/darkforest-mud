import {
  type PinkZone,
  type AIZoneRendererType,
  RendererType,
  RenderZIndex,
  type RGBAVec,
  TextAlign,
  TextAnchor,
  type WorldCoords,
} from "@df/types";

import { engineConsts } from "../EngineConsts";
import type { Renderer, RendererGameContext } from "../Renderer";
import type { GameGLManager } from "../WebGL/GameGLManager";

export class AIZoneRenderer implements AIZoneRendererType {
  rendererType = RendererType.AIZone;
  gl: GameGLManager;
  context: RendererGameContext;
  renderer: Renderer;

  constructor(glManager: GameGLManager) {
    this.gl = glManager;
    this.renderer = glManager.renderer;
    this.context = glManager.renderer.context;
  }

  queueAIZones(): void {
    const { rectRenderer: rR } = this.renderer;

    const AIZones = this.context.getAIZones();

    for (const zone of AIZones) {
      const center: WorldCoords = {
        x: (zone.beginCoords.x + zone.endCoords.x) / 2,
        y: (zone.beginCoords.y + zone.endCoords.y) / 2,
      };

      const width = Math.abs(zone.endCoords.x - zone.beginCoords.x);
      const height = Math.abs(zone.endCoords.y - zone.beginCoords.y);

      rR.queueRectCenterWorld(
        center,
        width,
        height,
        [255, 192, 203],
        2,
        RenderZIndex.Voyages,
      );
    }
  }

  flush(): void {
    const { rectRenderer: rR } = this.renderer;
    rR.flush();
  }
}
