import {
  type CanvasCoords,
  DrawMode,
  type LineRendererType,
  RendererType,
  RenderZIndex,
  type RGBAVec,
  type WorldCoords,
} from "@df/types";

import { LINE_PROGRAM_DEFINITION } from "../Programs/LineProgram";
import type { GameGLManager } from "../WebGL/GameGLManager";
import { GenericRenderer } from "../WebGL/GenericRenderer";

export class LineRenderer
  extends GenericRenderer<typeof LINE_PROGRAM_DEFINITION, GameGLManager>
  implements LineRendererType
{
  rendererType = RendererType.Line;

  constructor(glManager: GameGLManager) {
    super(glManager, LINE_PROGRAM_DEFINITION);
  }

  private getOffset(start: CanvasCoords, end: CanvasCoords): CanvasCoords {
    // calculates normalized perp vector
    const delX = end.x - start.x;
    const delY = end.y - start.y;

    const vX = delY;
    const vY = -delX;

    const norm = Math.sqrt(vX ** 2 + vY ** 2);
    return { x: vX / norm, y: vY / norm };
  }

  public queueLine(
    start: CanvasCoords,
    end: CanvasCoords,
    color: RGBAVec = [255, 0, 0, 255],
    width = 1,
    zIdx: number = RenderZIndex.DEFAULT,
    dashed = false,
  ): void {
    const { position: posA, color: colorA, dist: distA } = this.attribManagers;

    const { x: x1, y: y1 } = start;
    const { x: x2, y: y2 } = end;

    let dist = 0;
    if (dashed) {
      dist = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    }

    const { x: dX, y: dY } = this.getOffset(start, end);

    // Calculate half-width for centered line
    const halfWidth = width / 2;
    // note that width actually scales 2x - it goes 1, 3, 5, etc
    for (let i = -halfWidth; i <= halfWidth; i++) {
      posA.setVertex(
        // prettier-ignore
        [
          x1 + dX * i, y1 + dY * i, zIdx,
          x2 + dX * i, y2 + dY * i, zIdx,
        ],
        this.verts,
      );

      colorA.setVertex(
        [color[0], color[1], color[2], color[0], color[1], color[2]],
        this.verts,
      );
      distA.setVertex([0, dist], this.verts);
      this.verts += 2;
    }
  }

  public queueLineWorld(
    start: WorldCoords,
    end: WorldCoords,
    color: RGBAVec = [255, 0, 0, 255],
    width = 1,
    zIdx: number = RenderZIndex.DEFAULT,
    dashed = false,
  ) {
    const viewport = this.manager.renderer.getViewport();
    const startC = viewport.worldToCanvasCoords(start);
    const endC = viewport.worldToCanvasCoords(end);
    this.queueLine(startC, endC, color, width, zIdx, dashed);
  }

  public setUniforms(): void {
    this.uniformSetters.matrix(this.manager.projectionMatrix);
  }

  public flush(): void {
    super.flush(DrawMode.Lines);
  }
}
