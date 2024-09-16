import React, { useState } from "react";
import { useMUD } from "@mud/MUDContext";

export const CreateMoveForm: React.FC = () => {
  const {
    systemCalls: { move },
  } = useMUD();

  // State for Proof inputs (A, B, C)
  const [proofA, setProofA] = useState<string[]>(["", ""]);
  const [proofB, setProofB] = useState<string[][]>([
    ["", ""],
    ["", ""],
  ]);
  const [proofC, setProofC] = useState<string[]>(["", ""]);

  // State for input array (11 values)
  const [input, setInput] = useState<string[]>(new Array(11).fill(""));

  const [population, setPopulation] = useState<number>(0);
  const [silver, setSilver] = useState<number>(0);
  const [artifact, setArtifact] = useState<number>(0);
  const [isAbandon, setIsAbandon] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert inputs to bigint where necessary
    const proof = {
      A: proofA.map(BigInt) as [bigint, bigint],
      B: proofB.map((pair) => pair.map(BigInt)) as [
        [bigint, bigint],
        [bigint, bigint],
      ],
      C: proofC.map(BigInt) as [bigint, bigint],
    };

    const inputArray = input.map(BigInt) as [
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
    ];

    // Call move function with proof, input, population, silver, and artifact
    move(
      proof,
      inputArray,
      BigInt(population),
      BigInt(silver),
      BigInt(artifact),
      isAbandon,
    );
    console.log(
      "Move Submitted",
      proof,
      inputArray,
      population,
      silver,
      artifact,
    );
  };

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-4 shadow-md">
      <h2 className="mb-4 text-center text-2xl font-semibold">
        Move Function Form
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Proof Inputs */}
        <h3 className="text-lg font-bold">Proof A (2 values)</h3>
        <div className="grid grid-cols-2 gap-2">
          {proofA.map((val, i) => (
            <input
              key={`proofA-${i}`}
              type="text"
              value={val}
              onChange={(e) => {
                const newProof = [...proofA];
                newProof[i] = e.target.value;
                setProofA(newProof);
              }}
              className="rounded-md border p-2"
              placeholder={`A[${i}]`}
            />
          ))}
        </div>

        <h3 className="text-lg font-bold">Proof B (4 values)</h3>
        <div className="grid grid-cols-2 gap-2">
          {proofB.map((pair, i) =>
            pair.map((val, j) => (
              <input
                key={`proofB-${i}-${j}`}
                type="text"
                value={val}
                onChange={(e) => {
                  const newProofB = [...proofB];
                  newProofB[i][j] = e.target.value;
                  setProofB(newProofB);
                }}
                className="rounded-md border p-2"
                placeholder={`B[${i}][${j}]`}
              />
            )),
          )}
        </div>

        <h3 className="text-lg font-bold">Proof C (2 values)</h3>
        <div className="grid grid-cols-2 gap-2">
          {proofC.map((val, i) => (
            <input
              key={`proofC-${i}`}
              type="text"
              value={val}
              onChange={(e) => {
                const newProof = [...proofC];
                newProof[i] = e.target.value;
                setProofC(newProof);
              }}
              className="rounded-md border p-2"
              placeholder={`C[${i}]`}
            />
          ))}
        </div>

        {/* Input Array */}
        <h3 className="text-lg font-bold">Input Array (11 values)</h3>
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
              className="rounded-md border p-2"
              placeholder={`Input[${i}]`}
            />
          ))}
        </div>

        {/* Other Inputs */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-gray-700">Population</label>
            <input
              type="number"
              value={population}
              onChange={(e) => setPopulation(Number(e.target.value))}
              className="rounded-md border p-2"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Silver</label>
            <input
              type="number"
              value={silver}
              onChange={(e) => setSilver(Number(e.target.value))}
              className="rounded-md border p-2"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Artifact</label>
            <input
              type="number"
              value={artifact}
              onChange={(e) => setArtifact(Number(e.target.value))}
              className="rounded-md border p-2"
              required
            />
          </div>
        </div>

        {/* Abandon Checkbox */}
        <div className="flex items-center space-x-4">
          <label className="block text-gray-700">Abandon:</label>
          <input
            type="checkbox"
            checked={isAbandon}
            onChange={(e) => setIsAbandon(e.target.checked)}
          />
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};
