import { type PinkZoneRendererType, RendererType } from "@df/types";

import type { Renderer, RendererGameContext } from "../Renderer";
import type { GameGLManager } from "../WebGL/GameGLManager";

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
    const { circleRenderer: cR } = this.renderer;
    for (const zone of this.context.getPinkZones()) {
      cR.queueCircleWorld(zone.coords, zone.radius, [255, 192, 203, 160]);
    }
  }

  flush(): void {
    const { circleRenderer: cR } = this.renderer;
    cR.flush();
  }
}
