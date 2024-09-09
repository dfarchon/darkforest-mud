import React, { useState } from "react";
import { useMUD } from "@mud/MUDContext";
import { PlanetType, SpaceType } from "@df/types";

// type PlanetType =
//   | "UNKNOWN"
//   | "PLANET"
//   | "ASTEROID_FIELD"
//   | "FOUNDRY"
//   | "SPACETIME_RIP"
//   | "QUASAR"; // Example planet types
// type SpaceType = "UNKNOWN" | "NEBULA" | "SPACE" | "DEEP_SPACE" | "DEAD_SPACE"; // Example space types

interface CreatePlanetProps {
  onSubmit: (
    planetHash: string,
    owner: string,
    perlin: number,
    level: number,
    planetType: PlanetType,
    spaceType: SpaceType,
    population: number,
    silver: number,
  ) => void;
}

function entityToAddress(entity: string): string {
  return entity.slice(0, 2) + entity.slice(26);
}

export const CreatePlanetForm: React.FC<CreatePlanetProps> = ({ onSubmit }) => {
  const {
    systemCalls: { createPlanet },
    network: { playerEntity },
  } = useMUD();

  const [planetHash, setPlanetHash] = useState<string>(
    "0x29d4c60e4be1baaf93a4ea7d747553119d9aa6103dd7d6a83f70d7ae7e96e963",
  );
  const [owner, setOwner] = useState<string>(entityToAddress(playerEntity));
  const [perlin, setPerlin] = useState<number>(0);
  const [level, setLevel] = useState<number>(2);
  const [planetType, setPlanetType] = useState<PlanetType>(PlanetType.PLANET);
  const [spaceType, setSpaceType] = useState<SpaceType>(SpaceType.DEAD_SPACE);
  const [population, setPopulation] = useState<number>(100000);
  const [silver, setSilver] = useState<number>(50000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPlanet(
      planetHash,
      owner,
      perlin,
      level,
      planetType,
      spaceType,
      population,
      silver,
    );
    onSubmit(
      planetHash,
      owner,
      perlin,
      level,
      planetType,
      spaceType,
      population,
      silver,
    );
  };

  return (
    <div className="mx-auto mt-10 max-w-md rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-6 text-center text-2xl font-bold">Create Planet</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700">Planet Hash</label>
          <input
            type="text"
            value={planetHash}
            onChange={(e) => setPlanetHash(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            placeholder="Enter Planet Hash"
          />
        </div>

        <div>
          <label className="block text-gray-700">Owner Address</label>
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            placeholder="Enter Owner Address"
          />
        </div>

        <div>
          <label className="block text-gray-700">Perlin Noise (uint8)</label>
          <input
            type="number"
            value={perlin}
            onChange={(e) => setPerlin(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            placeholder="Enter Perlin Noise"
          />
        </div>

        <div>
          <label className="block text-gray-700">Level (uint8)</label>
          <input
            type="number"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            placeholder="Enter Level"
          />
        </div>

        <div>
          <label className="block text-gray-700">Planet Type</label>
          <select
            value={planetType}
            onChange={(e) =>
              setPlanetType(Number(e.target.value) as PlanetType)
            }
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
          >
            <option value="PLANET">PLANET</option>
            <option value="FOUNDRY">FOUNDRY</option>
            <option value="SPACETIME_RIP">SPACETIME_RIP</option>
            <option value="QUASAR">QUASAR</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700">Space Type</label>
          <select
            value={spaceType}
            onChange={(e) => setSpaceType(Number(e.target.value) as SpaceType)}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
          >
            <option value="NEBULA">NEBULA</option>
            <option value="SPACE">SPACE</option>
            <option value="DEEP_SPACE">DEEP_SPACE</option>
            <option value="DEAD_SPACE">DEEP_SPACE</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700">Population (uint64)</label>
          <input
            type="number"
            value={population}
            onChange={(e) => setPopulation(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            placeholder="Enter Population"
          />
        </div>

        <div>
          <label className="block text-gray-700">Silver (uint64)</label>
          <input
            type="number"
            value={silver}
            onChange={(e) => setSilver(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            placeholder="Enter Silver"
          />
        </div>

        <button
          type="submit"
          className="block w-full rounded-md bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
        >
          Create Planet
        </button>
      </form>
    </div>
  );
};
