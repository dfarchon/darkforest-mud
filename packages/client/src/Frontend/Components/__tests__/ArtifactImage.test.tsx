import { ArtifactRarity, ArtifactType, Biome, SpaceshipType } from "@df/types";
import { render, screen } from "@testing-library/react";
import React from "react";

import { ArtifactImage } from "../ArtifactImage";

// Mock artifact data for testing
const createMockArtifact = (
  artifactType: ArtifactType,
  spaceshipType?: SpaceshipType,
) => ({
  id: "test-artifact-id",
  artifactType,
  spaceshipType,
  rarity: ArtifactRarity.Common,
  planetBiome: Biome.OCEAN,
  planetDiscoveredOn: "test-planet-id",
  mintedAtTimestamp: Date.now(),
  discoverer: "0x123456789",
  activations: 0,
  lastActivated: 0,
  lastDeactivated: 0,
  controller: "0x123456789",
  imageType: 0,
  currentOwner: "0x123456789",
  isInititalized: true,
});

describe("ArtifactImage", () => {
  it("should render custom spaceship sprite for Scout spaceship", () => {
    const artifact = createMockArtifact(
      ArtifactType.Spaceship,
      SpaceshipType.Scout,
    );

    render(<ArtifactImage artifact={artifact} size={32} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/sprites/Scouts.png");
    expect(img).toHaveAttribute("alt", "Artifact 3 (1)");
  });

  it("should render custom spaceship sprite for Fighter spaceship", () => {
    const artifact = createMockArtifact(
      ArtifactType.Spaceship,
      SpaceshipType.Fighter,
    );

    render(<ArtifactImage artifact={artifact} size={32} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/sprites/Fighters.png");
    expect(img).toHaveAttribute("alt", "Artifact 3 (2)");
  });

  it("should render custom spaceship sprite for Destroyer spaceship", () => {
    const artifact = createMockArtifact(
      ArtifactType.Spaceship,
      SpaceshipType.Destroyer,
    );

    render(<ArtifactImage artifact={artifact} size={32} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/sprites/Destroyers.png");
    expect(img).toHaveAttribute("alt", "Artifact 3 (3)");
  });

  it("should render custom spaceship sprite for Carrier spaceship", () => {
    const artifact = createMockArtifact(
      ArtifactType.Spaceship,
      SpaceshipType.Carrier,
    );

    render(<ArtifactImage artifact={artifact} size={32} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/sprites/Cruisers.png");
    expect(img).toHaveAttribute("alt", "Artifact 3 (4)");
  });

  it("should fallback to default artifact sprite for non-spaceship artifacts", () => {
    const artifact = createMockArtifact(ArtifactType.Monolith);

    render(<ArtifactImage artifact={artifact} size={32} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/df_ares_artifact_icons/1.png");
    expect(img).toHaveAttribute("alt", "Artifact 1");
  });

  it("should fallback to default artifact sprite for spaceship without spaceshipType", () => {
    const artifact = createMockArtifact(ArtifactType.Spaceship);

    render(<ArtifactImage artifact={artifact} size={32} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/df_ares_artifact_icons/3.png");
    expect(img).toHaveAttribute("alt", "Artifact 3");
  });
});
