import React, { useState } from "react";
import { useMUD } from "@mud/MUDContext";

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

interface CreateMoveProps {
  onSubmit: (
    proof: Proof,
    moveInput: MoveInput,
    population: number,
    silver: number,
    artifact: number,
  ) => void;
}

export const CreateMoveForm: React.FC<CreateMoveProps> = ({ onSubmit }) => {
  // State for Proof inputs
  const [a, setA] = useState<[string, string]>(["", ""]);
  const [b, setB] = useState<[[string, string], [string, string]]>([
    ["", ""],
    ["", ""],
  ]);
  const [c, setC] = useState<[string, string]>(["", ""]);
  const [input, setInput] = useState<string[]>(new Array(9).fill(""));

  // State for MoveInput inputs
  const [fromX, setFromX] = useState<number>(0);
  const [fromY, setFromY] = useState<number>(0);
  const [toX, setToX] = useState<number>(0);
  const [toY, setToY] = useState<number>(0);
  const [isTeleport, setIsTeleport] = useState<boolean>(false);
  const [isAttack, setIsAttack] = useState<boolean>(false);

  // State for other inputs
  const [population, setPopulation] = useState<number>(0);
  const [silver, setSilver] = useState<number>(0);
  const [artifact, setArtifact] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const proof: Proof = { a, b, c, input };
    const moveInput: MoveInput = {
      fromX,
      fromY,
      toX,
      toY,
      isTeleport,
      isAttack,
    };

    // Call the onSubmit prop with the form data
    onSubmit(proof, moveInput, population, silver, artifact);
  };

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-4 shadow-md">
      <h2 className="mb-4 text-center text-2xl font-semibold">
        Move Function Form
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Proof Input */}
        <h3 className="text-lg font-medium">Proof Input</h3>
        <div>
          <label className="block text-gray-700">A (2 values)</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={a[0]}
              onChange={(e) => setA([e.target.value, a[1]])}
              className="w-1/2 rounded-md border border-gray-300 p-2"
              placeholder="Enter A[0]"
              required
            />
            <input
              type="text"
              value={a[1]}
              onChange={(e) => setA([a[0], e.target.value])}
              className="w-1/2 rounded-md border border-gray-300 p-2"
              placeholder="Enter A[1]"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-700">B (2x2 values)</label>
          <div className="grid grid-cols-2 gap-2">
            {b.map((row, i) =>
              row.map((val, j) => (
                <input
                  key={`b-${i}-${j}`}
                  type="text"
                  value={val}
                  onChange={(e) => {
                    const newB = [...b];
                    newB[i][j] = e.target.value;
                    setB(newB as [[string, string], [string, string]]);
                  }}
                  className="rounded-md border border-gray-300 p-2"
                  placeholder={`Enter B[${i}][${j}]`}
                  required
                />
              )),
            )}
          </div>
        </div>
        <div>
          <label className="block text-gray-700">C (2 values)</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={c[0]}
              onChange={(e) => setC([e.target.value, c[1]])}
              className="w-1/2 rounded-md border border-gray-300 p-2"
              placeholder="Enter C[0]"
              required
            />
            <input
              type="text"
              value={c[1]}
              onChange={(e) => setC([c[0], e.target.value])}
              className="w-1/2 rounded-md border border-gray-300 p-2"
              placeholder="Enter C[1]"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-700">Input (9 values)</label>
          <div className="grid grid-cols-3 gap-2">
            {input.map((val, i) => (
              <input
                key={`input-${i}`}
                type="text"
                value={val}
                onChange={(e) => {
                  const newInput = [...input];
                  newInput[i] = e.target.value;
                  setInput(newInput);
                }}
                className="rounded-md border border-gray-300 p-2"
                placeholder={`Input[${i}]`}
                required
              />
            ))}
          </div>
        </div>

        {/* Move Input */}
        <h3 className="text-lg font-medium">Move Input</h3>
        <div className="flex space-x-4">
          <div>
            <label className="block text-gray-700">From X</label>
            <input
              type="number"
              value={fromX}
              onChange={(e) => setFromX(Number(e.target.value))}
              className="rounded-md border border-gray-300 p-2"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">From Y</label>
            <input
              type="number"
              value={fromY}
              onChange={(e) => setFromY(Number(e.target.value))}
              className="rounded-md border border-gray-300 p-2"
              required
            />
          </div>
        </div>
        <div className="flex space-x-4">
          <div>
            <label className="block text-gray-700">To X</label>
            <input
              type="number"
              value={toX}
              onChange={(e) => setToX(Number(e.target.value))}
              className="rounded-md border border-gray-300 p-2"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">To Y</label>
            <input
              type="number"
              value={toY}
              onChange={(e) => setToY(Number(e.target.value))}
              className="rounded-md border border-gray-300 p-2"
              required
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <label className="block text-gray-700">Teleport:</label>
          <input
            type="checkbox"
            checked={isTeleport}
            onChange={(e) => setIsTeleport(e.target.checked)}
          />
          <label className="block text-gray-700">Attack:</label>
          <input
            type="checkbox"
            checked={isAttack}
            onChange={(e) => setIsAttack(e.target.checked)}
          />
        </div>

        {/* Other Inputs */}

        <div className="flex">
          <div>
            <label className="block text-gray-700">Population</label>
            <input
              type="number"
              value={population}
              onChange={(e) => setPopulation(Number(e.target.value))}
              className="w-3/4 rounded-md border border-gray-300 p-2"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Silver</label>
            <input
              type="number"
              value={silver}
              onChange={(e) => setSilver(Number(e.target.value))}
              className="w-3/4 rounded-md border border-gray-300 p-2"
              required
            />
          </div>
          <div>
            <label className="block w-3/4 text-gray-700">Artifact</label>
            <input
              type="number"
              value={artifact}
              onChange={(e) => setArtifact(Number(e.target.value))}
              className="w-3/4 rounded-md border border-gray-300 p-2"
              required
            />
          </div>
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-200"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};
