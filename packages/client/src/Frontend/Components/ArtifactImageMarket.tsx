import type { Artifact } from "@df/types";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

import { ArtifactRenderer } from "../Renderers/Artifacts/ArtifactRenderer";
import sharedRenderer from "./ArtifactRendererManager";

export function ArtifactImageMarket1({
  artifact,
  size,
}: {
  artifact: Artifact;
  size: number;
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(
    sharedRenderer.getDataURL(artifact.id) ?? null,
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!imgSrc) {
      sharedRenderer.renderToDataURL(artifact).then((url) => {
        if (mounted) setImgSrc(url);
      });
    }

    return () => {
      mounted = false;
    };
  }, []);
  console.log(imgSrc);
  return imgSrc ? (
    <img src={imgSrc} width={size} height={size} alt="Artifact Render" />
  ) : (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
      className="animate-pulse rounded bg-gray-800"
    />
  );
}

export function ArtifactImageMarket({
  artifact,
  size,
  // Not used but kept for API consistency
}: {
  artifact: Artifact | null;
  size: number;
}) {
  if (!artifact) return;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<ArtifactRenderer | null>(null);

  useEffect(() => {
    if (!artifact) return;
    const canvas = canvasRef.current;
    if (!canvas || !artifact) return;

    const renderer = new ArtifactRenderer(canvas, false); // use here ArtifactImageMarket not whole Artifact Render
    renderer.setVisible(true);
    renderer.setArtifacts([artifact]);
    rendererRef.current = renderer;
    if (!renderer) return;
    return () => {
      renderer.destroy?.();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!artifact) return;
    const canvas = canvasRef.current;
    if (!canvas || !artifact) return;

    const renderer = new ArtifactRenderer(canvas, false);
    renderer.setVisible(true);
    renderer.setArtifacts([artifact]);
    rendererRef.current = renderer;
    if (!renderer) return;
    return () => {
      renderer.destroy?.();
      rendererRef.current = null;
    };
  }, [artifact]);

  return (
    <StyledCanvas
      className="mx-auto origin-center"
      ref={canvasRef}
      width={size}
      height={size}
    />
  );
}

const StyledCanvas = styled.canvas``;
