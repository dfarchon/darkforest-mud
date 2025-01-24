import {
  type AIZoneRendererType,
  RendererType,
  RenderZIndex,
  type WorldCoords,
} from "@df/types";

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

    const aiZone = JSON.parse(localStorage.getItem("aiselectedRange"));
    const vissible = localStorage.getItem("iaselectedRangeVissible");

    if (!aiZone || vissible != "1") {
      return;
    }
    if (aiZone.begin != undefined && aiZone.end != undefined) {
      const center: WorldCoords = {
        x: (aiZone.begin.x + aiZone.end.x) / 2,
        y: (aiZone.begin.y + aiZone.end.y) / 2,
      };

      const width = Math.abs(aiZone.end.x - aiZone.begin.x);
      const height = Math.abs(aiZone.end.y - aiZone.begin.y);

      rR.queueRectCenterWorld(
        center,
        width,
        height,
        [212, 212, 212],
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
