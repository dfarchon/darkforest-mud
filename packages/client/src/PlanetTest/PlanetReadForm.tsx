import { useMUD } from "@mud/MUDContext";
import React, { useState } from "react";

// Define a Planet type based on the Planet structure
type Planet = {
  name: string;
  size: number;
  gravity: number;
  // Add more fields as per your Planet structure
};

type ReadPlanetType = "readPlanetWithHash" | "readPlanetWithHashPerlinDistance";

export const PlanetReadForm: React.FC = () => {
  const {
    systemCalls: { readPlanetWithHash, readPlanetWithHashPerlinDistance },
  } = useMUD();

  const [readType, setReadType] =
    useState<ReadPlanetType>("readPlanetWithHash");
  const [planetHash, setPlanetHash] = useState<string>("");
  const [perlin, setPerlin] = useState<string>(0);
  const [distanceSquare, setDistanceSquare] = useState<string>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let planet: Planet | undefined;
      switch (readType) {
        case "readPlanetWithHash":
          planet = await readPlanetWithHashPerlinDistance(planetHash, 0, 0);
          break;
        case "readPlanetWithHashPerlinDistance":
          planet = await readPlanetWithHashPerlinDistance(
            planetHash,
            BigInt(perlin),
            BigInt(distanceSquare),
          );
          break;
        default:
          throw new Error("Invalid read type selected.");
      }

      if (planet) {
        console.log(`Planet data:`, planet);
      } else {
        console.error("No planet data found");
      }
    } catch (error) {
      console.error(`Error reading planet data:`, error);
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-6 text-center text-2xl font-bold">Read Planet Data</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700">Read Planet Type</label>
          <select
            value={readType}
            onChange={(e) => setReadType(e.target.value as ReadPlanetType)}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
          >
            <option value="readPlanetWithHash">Read Planet (by Hash)</option>
            <option value="readPlanetWithHashPerlinDistance">
              Read Planet (by Hash, Perlin, and Distance)
            </option>
          </select>
        </div>

        {/* Conditionally render the appropriate inputs */}
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

        {readType === "readPlanetWithHashPerlinDistance" && (
          <>
            <div>
              <label className="block text-gray-700">Perlin</label>
              <input
                type="text"
                value={perlin}
                onChange={(e) => setPerlin(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                placeholder="Enter Perlin"
              />
            </div>
            <div>
              <label className="block text-gray-700">Distance Square</label>
              <input
                type="text"
                value={distanceSquare}
                onChange={(e) => setDistanceSquare(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                placeholder="Enter Distance Square"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          className="block w-full rounded-md bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
        >
          Read Planet
        </button>
      </form>
    </div>
  );
};
