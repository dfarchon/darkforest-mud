import React, { useState } from "react";
import { useMUD } from "./MUDContext"; // Assume MUDContext provides the contract instance

interface CreateMoveProps {
  onSubmit: (
    proof: string,
    moveInput: string,
    population: number,

    silver: number,
    artifact: number
  ) => void;
}

export const CreateMoveForm: React.FC<CreateMoveProps> = ({ onSubmit }) => {
  const [proof, setProof] = useState("");
  const [moveInput, setMoveInput] = useState("");
  const [population, setPopulation] = useState(0);
  const [silver, setSilver] = useState(0);
  const [artifact, setArtifact] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Call the provided onSubmit function with the form inputs
    onSubmit(proof, moveInput, population, silver, artifact);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold text-center mb-4">
        Move Function Form
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700">Proof (Hexadecimal):</label>
          <input
            type="text"
            value={proof}
            onChange={(e) => setProof(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700">
            Move Input (Hexadecimal):
          </label>
          <input
            type="text"
            value={moveInput}
            onChange={(e) => setMoveInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700">Population:</label>
          <input
            type="number"
            value={population}
            onChange={(e) => setPopulation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700">Silver:</label>
          <input
            type="number"
            value={silver}
            onChange={(e) => setSilver(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700">Artifact:</label>
          <input
            type="number"
            value={artifact}
            onChange={(e) => setArtifact(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
            required
          />
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-200"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};
