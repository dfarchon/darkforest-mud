import { useEffect, useRef } from "react";

import { ArtifactRenderer } from "@frontend/Renderers/Artifacts/ArtifactRenderer";
import type { ArtifactType, Biome, ArtifactRarity } from "@df/types";

type ArtifactCanvasProps = {
  type: ArtifactType;
  biome: Biome;
  rarity: ArtifactRarity;
};

export function ArtifactCanvas({ type, biome, rarity }: ArtifactCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ArtifactRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const renderer = new ArtifactRenderer(canvas, false); // false = list mode
    renderer.setVisible(true);

    const fakeArtifact = {
      id: Math.random(), // not important
      artifactType: type,
      planetBiome: biome,
      rarity: rarity,
    };

    renderer.setArtifacts([fakeArtifact]);

    rendererRef.current = renderer;

    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [type, biome, rarity]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={64}
      className="h-full w-full rounded object-contain shadow-md"
    />
  );
}
