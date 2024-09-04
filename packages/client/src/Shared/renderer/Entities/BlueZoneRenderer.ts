import { BlueZoneRendererType, RendererType } from "@df/types";

import { Renderer, RendererGameContext } from "../Renderer";
import { GameGLManager } from "../WebGL/GameGLManager";

export class BlueZoneRenderer implements BlueZoneRendererType {
  rendererType = RendererType.BlueZone;
  gl: GameGLManager;
  context: RendererGameContext;
  renderer: Renderer;

  constructor(glManager: GameGLManager) {
    this.gl = glManager;
    this.renderer = glManager.renderer;
    this.context = glManager.renderer.context;
  }

  queueBlueZones(): void {
    const { circleRenderer: cR } = this.renderer;
    for (const zone of this.context.getBlueZones()) {
      cR.queueCircleWorld(zone.coords, zone.radius, [0, 173, 225, 160]);
    }
  }

  flush(): void {
    const { circleRenderer: cR } = this.renderer;
    cR.flush();
  }
}
