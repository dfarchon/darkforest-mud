import type { Planet, QuasarRendererType, WorldCoords } from "@df/types";
import { RendererType } from "@df/types";

import { EngineUtils } from "../EngineUtils";
import type { Renderer } from "../Renderer";
import type { GameGLManager } from "../WebGL/GameGLManager";

export class QuasarRenderer implements QuasarRendererType {
  manager: GameGLManager;
  renderer: Renderer;

  rendererType = RendererType.Quasar;

  constructor(manager: GameGLManager) {
    this.manager = manager;
    this.renderer = manager.renderer;
  }

  private getAngle(): number {
    return EngineUtils.getNow() * 0.5;
  }

  public queueQuasar(planet: Planet, centerW: WorldCoords, radiusW: number) {
    const { quasarBodyRenderer, quasarRayRenderer } = this.renderer;
    const angle = this.getAngle();

    const z = EngineUtils.getPlanetZIndex(planet);
    quasarRayRenderer.queueQuasarRay(planet, centerW, radiusW, z, false, angle);
    quasarRayRenderer.queueQuasarRay(planet, centerW, radiusW, z, true, angle);
    quasarBodyRenderer.queueQuasarBody(planet, centerW, radiusW, z, angle);
  }

  public flush() {
    // order matters!
    const { quasarBodyRenderer, quasarRayRenderer } = this.renderer;
    quasarRayRenderer.flush();
    quasarBodyRenderer.flush();
    quasarRayRenderer.flush();
  }

  public setUniforms() {
    const { quasarBodyRenderer, quasarRayRenderer } = this.renderer;
    if (quasarRayRenderer.setUniforms) {
      quasarRayRenderer.setUniforms();
    }
    if (quasarRayRenderer.setUniforms) {
      quasarRayRenderer.setUniforms();
    }
    if (quasarBodyRenderer.setUniforms) {
      quasarBodyRenderer.setUniforms();
    }
  }
}
