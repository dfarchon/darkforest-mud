import { useMUD } from "@mud/MUDContext";
import { CreatePlanetForm } from "./CreatePlanetFormTest";
import { CreateMoveForm } from "./CreateMoveFormTest";
import { PlayPauseTickButton } from "./PlayPauseTickButton";
import { PlanetType, SpaceType } from "@df/types";

export const PlanetTestPage = () => {
  // Function to handle planet creation
  const handleCreatePlanet = (
    planetHash: string,
    owner: string,
    perlin: number,
    level: number,
    planetType: PlanetType,
    spaceType: SpaceType,
    population: number,
    silver: number,
  ) => {
    console.log("Planet Created:", {
      planetHash,
      owner,
      perlin,
      level,
      planetType,
      spaceType,
      population,
      silver,
    });

    // Here you can call the df__createPlanet function (smart contract interaction) using MUD's system call
    // df__createPlanet(planetHash, owner, perlin, level, planetType, spaceType, population, silver);
  };

  const handleMoveSubmit = async (
    proof: string,
    moveInput: string,
    population: number,
    silver: number,
    artifact: number,
  ) => {
    console.log("Move sent:", {
      proof,
      moveInput,
      population,
      silver,
      artifact,
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-start gap-4">
        <div className="flex">
          <CreatePlanetForm onSubmit={handleCreatePlanet} />
        </div>
        <div className="flex">
          <CreateMoveForm onSubmit={handleMoveSubmit} />
        </div>
      </div>
      <div className="mt-6">
        <PlayPauseTickButton />
      </div>
    </div>
  );
};
