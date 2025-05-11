// SharedArtifactRenderer.ts
import { ArtifactRenderer } from "@frontend/Renderers/Artifacts/ArtifactRenderer";

let sharedRenderer: ArtifactRenderer | null = null;

export function getSharedArtifactRenderer(
  canvas: HTMLCanvasElement,
): ArtifactRenderer {
  if (!sharedRenderer) {
    sharedRenderer = new ArtifactRenderer(canvas, false);
    sharedRenderer.setVisible(true);
  }
  return sharedRenderer;
}
