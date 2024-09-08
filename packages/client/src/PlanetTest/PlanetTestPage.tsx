import { useMUD } from "@mud/MUDContext";
import { CreatePlanetForm } from "./CreatePlanetFormTest";
import { CreateMoveForm } from "./CreateMoveFormTest";
import { PlayPauseTickButton } from "./PlayPauseTickButton";
import { PlanetType, SpaceType } from "@df/types";
import { PlanetUpgradeForm } from "./PlanetUpgradeFormTest";
import { ProofVerificationForm } from "./ProofVerificationForm";
import { PlanetReadForm } from "./PlanetReadForm";

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
  interface Proof {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
    input: string[];
  }

  interface MoveInput {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    isTeleport: boolean;
    isAttack: boolean;
  }
  const handleMoveSubmit = async (
    proof: Proof,
    moveInput: MoveInput,
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

  const handlePlanetUpgradeSubmit = async (
    planetHash: string,
    rangeUpgrades: number,
    speedUpgrades: number,
    defenseUpgrades: number,
  ) => {
    console.log("Upgrade sent:", {
      planetHash,
      rangeUpgrades,
      speedUpgrades,
      defenseUpgrades,
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-start gap-4">
        <div className="flex">
          <CreatePlanetForm onSubmit={handleCreatePlanet} />
        </div>

        <div className="flex">
          <PlanetReadForm />
        </div>
        <div className="flex">
          <PlanetUpgradeForm onSubmit={handlePlanetUpgradeSubmit} />
        </div>
      </div>

      <div className="flex items-start gap-4 pt-4">
        <div className="flex">
          <ProofVerificationForm />
        </div>{" "}
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
