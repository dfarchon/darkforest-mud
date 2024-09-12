import { useMUD } from "@mud/MUDContext";
import React, { useState } from "react";

type ProofType =
  | "InitProof"
  | "MoveProof"
  | "BiomebaseProof"
  | "RevealProof"
  | "WhitelistProof";

export const ProofVerificationForm: React.FC = () => {
  const {
    systemCalls: {
      verifyInitProof,
      verifyMoveProof,
      verifyBiomebaseProof,
      verifyRevealProof,
      verifyWhitelistProof,
    },
  } = useMUD();

  const [proofType, setProofType] = useState<ProofType>("InitProof");
  const [a, setA] = useState<string[]>(["", ""]);
  const [b, setB] = useState<string[][]>([
    ["", ""],
    ["", ""],
  ]);
  const [c, setC] = useState<string[]>(["", ""]);
  const [input, setInput] = useState<string[]>(new Array(9).fill(""));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const aValues = a.map((val) => BigInt(val));
    const bValues = b.map((arr) => arr.map((val) => BigInt(val)));
    const cValues = c.map((val) => BigInt(val));
    const inputValues = input.map((val) => BigInt(val));

    try {
      let result;
      switch (proofType) {
        case "InitProof":
          result = await verifyInitProof(
            aValues,
            bValues,
            cValues,
            inputValues.slice(0, 9),
          );
          break;
        case "MoveProof": {
          const moveInput = { ...inputValues }; // Adjust this based on actual MoveInput structure
          result = await verifyMoveProof(
            { a: aValues, b: bValues, c: cValues },
            moveInput,
          );
          break;
        }
        case "BiomebaseProof":
          result = await verifyBiomebaseProof(
            aValues,
            bValues,
            cValues,
            inputValues.slice(0, 7),
          );
          break;
        case "RevealProof":
          result = await verifyRevealProof(
            aValues,
            bValues,
            cValues,
            inputValues.slice(0, 9),
          );
          break;
        case "WhitelistProof":
          result = await verifyWhitelistProof(
            aValues,
            bValues,
            cValues,
            inputValues.slice(0, 2),
          );
          break;
        default:
          throw new Error("Invalid proof type selected.");
      }

      console.log(`Verification result for ${proofType}:`, result);
    } catch (error) {
      console.error(`Error verifying ${proofType}:`, error);
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-6 text-center text-2xl font-bold">
        Proof Verification
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700">Proof Type</label>
          <select
            value={proofType}
            onChange={(e) => setProofType(e.target.value as ProofType)}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
          >
            <option value="InitProof">Init Proof</option>
            <option value="MoveProof">Move Proof</option>
            <option value="BiomebaseProof">Biomebase Proof</option>
            <option value="RevealProof">Reveal Proof</option>
            <option value="WhitelistProof">Whitelist Proof</option>
          </select>
        </div>

        {/* Conditionally render fields based on selected proof type */}
        <div>
          <label className="block text-gray-700">A (2 values)</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={a[0]}
              onChange={(e) => setA([e.target.value, a[1]])}
              className="mt-1 block w-1/2 rounded-md border border-gray-300 p-2"
              placeholder="Enter A[0]"
            />
            <input
              type="text"
              value={a[1]}
              onChange={(e) => setA([a[0], e.target.value])}
              className="mt-1 block w-1/2 rounded-md border border-gray-300 p-2"
              placeholder="Enter A[1]"
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
                    setB(newB);
                  }}
                  className="mt-1 block rounded-md border border-gray-300 p-2"
                  placeholder={`Enter B[${i}][${j}]`}
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
              className="mt-1 block w-1/2 rounded-md border border-gray-300 p-2"
              placeholder="Enter C[0]"
            />
            <input
              type="text"
              value={c[1]}
              onChange={(e) => setC([c[0], e.target.value])}
              className="mt-1 block w-1/2 rounded-md border border-gray-300 p-2"
              placeholder="Enter C[1]"
            />
          </div>
        </div>

        {/* Conditional Input Field Rendering */}
        {proofType === "InitProof" || proofType === "RevealProof" ? (
          <div>
            <label className="block text-gray-700">Input (9 values)</label>
            <div className="grid grid-cols-3 gap-2">
              {input.slice(0, 9).map((val, i) => (
                <input
                  key={`input-${i}`}
                  type="text"
                  value={val}
                  onChange={(e) => {
                    const newInput = [...input];
                    newInput[i] = e.target.value;
                    setInput(newInput);
                  }}
                  className="mt-1 block rounded-md border border-gray-300 p-2"
                  placeholder={`Enter Input[${i}]`}
                />
              ))}
            </div>
          </div>
        ) : proofType === "BiomebaseProof" ? (
          <div>
            <label className="block text-gray-700">Input (7 values)</label>
            <div className="grid grid-cols-3 gap-2">
              {input.slice(0, 7).map((val, i) => (
                <input
                  key={`input-${i}`}
                  type="text"
                  value={val}
                  onChange={(e) => {
                    const newInput = [...input];
                    newInput[i] = e.target.value;
                    setInput(newInput);
                  }}
                  className="mt-1 block rounded-md border border-gray-300 p-2"
                  placeholder={`Enter Input[${i}]`}
                />
              ))}
            </div>
          </div>
        ) : proofType === "WhitelistProof" ? (
          <div>
            <label className="block text-gray-700">Input (2 values)</label>
            <div className="grid grid-cols-2 gap-2">
              {input.slice(0, 2).map((val, i) => (
                <input
                  key={`input-${i}`}
                  type="text"
                  value={val}
                  onChange={(e) => {
                    const newInput = [...input];
                    newInput[i] = e.target.value;
                    setInput(newInput);
                  }}
                  className="mt-1 block rounded-md border border-gray-300 p-2"
                  placeholder={`Enter Input[${i}]`}
                />
              ))}
            </div>
          </div>
        ) : (
          proofType === "MoveProof" && (
            <div>
              <label className="block text-gray-700">Move Input</label>
              <div className="grid grid-cols-3 gap-2">
                {input.map((val, i) => (
                  <input
                    key={`move-input-${i}`}
                    type="text"
                    value={val}
                    onChange={(e) => {
                      const newInput = [...input];
                      newInput[i] = e.target.value;
                      setInput(newInput);
                    }}
                    className="mt-1 block rounded-md border border-gray-300 p-2"
                    placeholder={`Enter Move Input[${i}]`}
                  />
                ))}
              </div>
            </div>
          )
        )}

        <button
          type="submit"
          className="block w-full rounded-md bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
        >
          Verify Proof
        </button>
      </form>
    </div>
  );
};
