import type { Renderer } from "../Renderer";
import { WebGLManager } from "./WebGLManager";

export class GameGLManager extends WebGLManager {
  renderer: Renderer;
  declare gl: WebGL2RenderingContext; //TODO handle declare

  isHighPerf: boolean;

  constructor(engine: Renderer, glCanvas: HTMLCanvasElement) {
    super(glCanvas, { stencil: true });
    const { gl } = this;

    this.renderer = engine;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  public clear() {
    const color: [number, number, number, number] = this.isHighPerf
      ? [12 / 255, 11 / 255, 30 / 255, 1.0]
      : [0.3, 0.3, 0.35, 1.0];

    const { gl } = this;
    super.clear(
      gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT,
      color,
    );
  }
}
