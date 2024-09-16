import { useMUD } from "@mud/MUDContext";
import React, { useState } from "react";

export const RevealPlanetForm: React.FC = () => {
  const {
    systemCalls: { revealLocation },
  } = useMUD();

  const [a, setA] = useState<string[]>(["", ""]);
  const [b, setB] = useState<string[][]>([
    ["", ""],
    ["", ""],
  ]);
  const [c, setC] = useState<string[]>(["", ""]);
  const [input, setInput] = useState({
    planetHash: "",
    perlin: "",
    x: "",
    y: "",
    mimcHashKey: "",
    spaceTypeKey: "",
    perlinLengthScale: "",
    perlinMirrorX: "",
    perlinMirrorY: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const aValues = a.map((val) => BigInt(val || "0"));
    const bValues = b.map((arr) => arr.map((val) => BigInt(val || "0")));
    const cValues = c.map((val) => BigInt(val || "0"));

    try {
      const revealInput = {
        planetHash: BigInt(input.planetHash),
        perlin: BigInt(input.perlin),
        x: BigInt(input.x),
        y: BigInt(input.y),
        mimcHashKey: BigInt(input.mimcHashKey),
        spaceTypeKey: BigInt(input.spaceTypeKey),
        perlinLengthScale: BigInt(input.perlinLengthScale),
        perlinMirrorX: BigInt(input.perlinMirrorX),
        perlinMirrorY: BigInt(input.perlinMirrorY),
      };

      revealLocation(
        {
          A: { X: aValues[0], Y: aValues[1] },
          B: {
            X: [bValues[0][0], bValues[0][1]],
            Y: [bValues[1][0], bValues[1][1]],
          },
          C: { X: cValues[0], Y: cValues[1] },
        },
        revealInput,
      );
      console.log("Location revealing", aValues, bValues, cValues, revealInput);
    } catch (error) {
      console.error("Error revealing location:", error);
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-6 text-center text-2xl font-bold">
        Reveal Planet Location
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-bold">Proof A (2 values)</h3>
        <div className="grid grid-cols-2 gap-2">
          {a.map((val, i) => (
            <input
              key={`proofA-${i}`}
              type="text"
              value={val}
              onChange={(e) => {
                const newProof = [...a];
                newProof[i] = e.target.value;
                setA(newProof);
              }}
              className="rounded-md border p-2"
              placeholder={`A[${i}]`}
            />
          ))}
        </div>
        <h3 className="text-lg font-bold">Proof B (4 values)</h3>
        <div className="grid grid-cols-2 gap-2">
          {b.map((pair, i) =>
            pair.map((val, j) => (
              <input
                key={`proofB-${i}-${j}`}
                type="text"
                value={val}
                onChange={(e) => {
                  const newProofB = [...b];
                  newProofB[i][j] = e.target.value;
                  setB(newProofB);
                }}
                className="rounded-md border p-2"
                placeholder={`B[${i}][${j}]`}
              />
            )),
          )}
        </div>

        <h3 className="text-lg font-bold">Proof C (2 values)</h3>
        <div className="grid grid-cols-2 gap-2">
          {c.map((val, i) => (
            <input
              key={`proofC-${i}`}
              type="text"
              value={val}
              onChange={(e) => {
                const newProof = [...c];
                newProof[i] = e.target.value;
                setC(newProof);
              }}
              className="rounded-md border p-2"
              placeholder={`C[${i}]`}
            />
          ))}
        </div>

        {/* Input Array */}

        <div>
          <label className="block text-gray-700">Reveal Input</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(input).map((key) => (
              <input
                key={key}
                type="text"
                value={(input as unknown as string)[Number(key)]}
                onChange={(e) => setInput({ ...input, [key]: e.target.value })}
                className="mt-1 block rounded-md border border-gray-300 p-2"
                placeholder={`Enter ${key}`}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="block w-full rounded-md bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
        >
          Reveal Location
        </button>
      </form>
    </div>
  );
};
