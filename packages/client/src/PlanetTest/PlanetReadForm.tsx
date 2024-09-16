import { useMUD } from "@mud/MUDContext";
import React, { useState } from "react";

// Define a Planet type based on the Planet structure
type Planet = {
  name: string;

  // Add more fields as per your Planet structure
};

type ReadPlanetType =
  | "readPlanetWithHash"
  | "readPlanetWithHashPerlinDistance"
  | "readPlanetAt";

export const PlanetReadForm: React.FC = () => {
  const {
    systemCalls: {
      readPlanetWithHash,
      readPlanetWithHashPerlinDistance,
      readPlanetAt,
    },
  } = useMUD();

  const [readType, setReadType] =
    useState<ReadPlanetType>("readPlanetWithHash");
  const [planetHash, setPlanetHash] = useState<string>(
    "0x1024e3a1608958b9b33baa3a9ee72d3b23a2d1a7ba9ad22ff36c287d8ad78ce0",
  );
  const [perlin, setPerlin] = useState<string>("0");
  const [distanceSquare, setDistanceSquare] = useState<string>("0");
  const [tickNumber, setTickNumber] = useState<string>("0"); // New state for tick number

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let planet: Planet | undefined;
      switch (readType) {
        case "readPlanetWithHash":
          planet = await readPlanetWithHash(planetHash);
          break;
        case "readPlanetWithHashPerlinDistance":
          planet = await readPlanetWithHashPerlinDistance(
            planetHash,
            BigInt(perlin),
            BigInt(distanceSquare),
          );
          break;
        case "readPlanetAt":
          planet = await readPlanetAt(planetHash, BigInt(tickNumber));
          break;
        default:
          throw new Error("Invalid read type selected.");
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
            <option value="readPlanetAt">Read Planet (by Hash and Tick)</option>
          </select>
        </div>

        {/* Planet Hash input field */}
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

        {/* Conditionally render fields for reading by Perlin and Distance */}
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

        {/* Conditionally render fields for reading by Tick */}
        {readType === "readPlanetAt" && (
          <div>
            <label className="block text-gray-700">Tick Number</label>
            <input
              type="text"
              value={tickNumber}
              onChange={(e) => setTickNumber(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              placeholder="Enter Tick Number"
            />
          </div>
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
