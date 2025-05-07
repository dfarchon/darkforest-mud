import type { Artifact } from "@df/types";
import { useEffect, useRef } from "react";
import styled from "styled-components";

import { ArtifactRenderer } from "../Renderers/Artifacts/ArtifactRenderer";

export function ArtifactImageMarket({
  artifact,
  size,
  thumb = true, // Not used but kept for API consistency
}: {
  artifact: Artifact | null;
  size: number;
  thumb?: boolean;
}) {
  if (!artifact) return;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<ArtifactRenderer | null>(null);

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
