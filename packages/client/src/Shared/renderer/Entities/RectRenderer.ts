import type {
  CanvasCoords,
  Chunk,
  RectRendererType,
  RGBVec,
  WorldCoords,
} from "@df/types";
import { RendererType, RenderZIndex } from "@df/types";

import { EngineUtils } from "../EngineUtils";
import { RECT_PROGRAM_DEFINITION } from "../Programs/RectProgram";
import type { GameGLManager } from "../WebGL/GameGLManager";
import { GenericRenderer } from "../WebGL/GenericRenderer";

export class RectRenderer
  extends GenericRenderer<typeof RECT_PROGRAM_DEFINITION, GameGLManager>
  implements RectRendererType
{
  quad3Buffer: number[];
  quad2Buffer: number[];

  rendererType = RendererType.Rect;

  constructor(manager: GameGLManager) {
    super(manager, RECT_PROGRAM_DEFINITION);
    this.quad3Buffer = EngineUtils.makeEmptyQuad();
    this.quad2Buffer = EngineUtils.makeQuadVec2(0, 0, 1, 1);
  }

  public queueRect(
    { x, y }: CanvasCoords,
    width: number,
    height: number,
    color: RGBVec = [255, 0, 0],
    stroke = -1,
    zIdx: number = RenderZIndex.DEFAULT,
  ): void {
    const {
      position: posA,
      rectPos: rectPosA,
      color: colorA,
      strokeX: strokeXA,
      strokeY: strokeYA,
    } = this.attribManagers;
    const { x1, y1 } = { x1: x, y1: y };
    const { x2, y2 } = { x2: x + width, y2: y + height };

    EngineUtils.makeQuadBuffered(this.quad3Buffer, x1, y1, x2, y2, zIdx);
    posA.setVertex(this.quad3Buffer, this.verts);
    rectPosA.setVertex(this.quad2Buffer, this.verts);

    for (let i = 0; i < 6; i++) {
      colorA.setVertex(color, this.verts + i);
      strokeXA.setVertex([stroke / width], this.verts + i);
      strokeYA.setVertex([stroke / height], this.verts + i);
    }

    this.verts += 6;
  }

  public queueRectWorld(
    coords: WorldCoords,
    width: number,
    height: number,
    color: RGBVec = [255, 0, 0],
    stroke = -1,
    zIdx: number = RenderZIndex.DEFAULT,
  ): void {
    const viewport = this.manager.renderer.getViewport();
    const canvasCoords = viewport.worldToCanvasCoords(coords);
    const widthC = viewport.worldToCanvasDist(width);
    const heightC = viewport.worldToCanvasDist(height);

    this.queueRect(canvasCoords, widthC, heightC, color, stroke, zIdx);
  }

  public queueRectCenterWorld(
    center: WorldCoords,
    width: number,
    height: number,
    color: RGBVec = [255, 0, 0],
    stroke = -1,
    zIdx: number = RenderZIndex.DEFAULT,
  ) {
    const topLeft: WorldCoords = {
      x: center.x - width / 2,
      y: center.y + height / 2,
    };

    this.queueRectWorld(topLeft, width, height, color, stroke, zIdx);
  }

  public queueChunkBorder(chunk: Chunk): void {
    const {
      chunkFootprint: { bottomLeft, sideLength },
    } = chunk;

    this.queueRectWorld(
      { x: bottomLeft.x, y: bottomLeft.y + sideLength },
      sideLength,
      sideLength,
      [255, 0, 0],
      1,
    );
  }

  public queueChunkBorderWithPadding(chunk: Chunk, padding: number): void {
    const {
      chunkFootprint: { bottomLeft, sideLength },
    } = chunk;

    const adjustedLength = sideLength + 2 * padding;

    this.queueRectWorld(
      { x: bottomLeft.x - padding, y: bottomLeft.y - padding + adjustedLength },
      adjustedLength,
      adjustedLength,
      [16, 48, 64],
    );
  }

  public setUniforms() {
    this.uniformSetters.matrix(this.manager.projectionMatrix);
  }
}
