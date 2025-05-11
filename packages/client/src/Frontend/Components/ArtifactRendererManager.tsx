import type { Artifact } from "@df/types";

import { ArtifactRenderer } from "../Renderers/Artifacts/ArtifactRenderer";

class ArtifactRendererManager {
  private canvas: HTMLCanvasElement;
  private cache: Map<string, string> = new Map();
  private artifactMap: Map<string, Artifact> = new Map(); // all rendered artifacts
  private redenderedMap: Map<string, ArtifactRenderer> = new Map(); // all prerendered artifacts
  private size: number;

  public renderer: ArtifactRenderer;

  constructor(size: number) {
    this.size = size;
    this.canvas = document.createElement("canvas");
    this.canvas.width = size;
    this.canvas.height = size;
    this.renderer = new ArtifactRenderer(this.canvas, false);
  }

  async renderToDataURL(artifact: Artifact): Promise<string> {
    const id = artifact.id;
    if (this.cache.has(id)) return this.cache.get(id)!;
    if (!artifact) return "";
    // Save artifact for full redraw later
    this.artifactMap.set(id, artifact);

    // console.log(artifact);
    // Send all accumulated artifacts to renderer
    this.renderer.setArtifacts(Array.from(this.artifactMap.values()));
    this.renderer.renderOnce();

    // await new Promise((resolve) => requestAnimationFrame(resolve));

    const dataURL = this.canvas.toDataURL("image/png");
    this.cache.set(id, dataURL);
    return dataURL;
  }

  async batchRender(artifacts: Artifact[]): Promise<void> {
    for (const artifact of artifacts) {
      await this.renderToDataURL(artifact);
    }
  }

  getDataURL(id: string): string | undefined {
    return this.cache.get(id);
  }

  clearCache() {
    this.cache.clear();
    this.artifactMap.clear();
  }

  getRenderer(): ArtifactRenderer {
    return this.renderer;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getAllArtifacts(): Artifact[] {
    return Array.from(this.artifactMap.values());
  }
}

const sharedRenderer = new ArtifactRendererManager(128);
export default sharedRenderer;
