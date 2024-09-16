import { useMUD } from "@mud/MUDContext";
import React, { useState } from "react";

type ProofType =
  | "VerifyDelegation"
  | "SpawnProof"
  | "MoveProof"
  | "BiomebaseProof"
  | "RevealProof"
  | "WhitelistProof";

export const ProofVerificationForm: React.FC = () => {
  const {
    systemCalls: {
      verify,
      verifySpawnProof,
      verifyMoveProof,
      verifyBiomebaseProof,
      verifyRevealProof,
      verifyWhitelistProof,
    },
  } = useMUD();

  const [proofType, setProofType] = useState<ProofType>("VerifyDelegation");
  const [a, setA] = useState<string[]>(["", ""]);
  const [b, setB] = useState<string[][]>([
    ["", ""],
    ["", ""],
  ]);
  const [c, setC] = useState<string[]>(["", ""]);
  const [input, setInput] = useState<string[]>(new Array(9).fill(""));

  const [delegator, setDelegator] = useState<string>("");
  const [resourceId, setResourceId] = useState<string>("");
  const [dataBytes, setDataBytes] = useState<string>("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const aValues = a.map((val) => BigInt(val || "0"));
    const bValues = b.map((arr) => arr.map((val) => BigInt(val || "0")));
    const cValues = c.map((val) => BigInt(val || "0"));
    const inputValues = input.map((val) => BigInt(val || "0"));

    try {
      let result;
      switch (proofType) {
        case "VerifyDelegation":
          result = verify(delegator as `0x${string}`, resourceId, dataBytes);
          console.log("VerifyDelegation", delegator, resourceId, dataBytes);
          break;
        case "SpawnProof":
          result = verifySpawnProof(
            {
              A: { X: aValues[0], Y: aValues[1] },
              B: {
                X: [bValues[0][0], bValues[0][1]],
                Y: [bValues[1][0], bValues[1][1]],
              },
              C: { X: cValues[0], Y: cValues[1] },
            },
            {
              planetHash: inputValues[0],
              perlin: inputValues[1],
              universeRadius: inputValues[2],
              mimcHashKey: inputValues[3],
              spaceTypeKey: inputValues[4],
              perlinLengthScale: inputValues[5],
              perlinMirrorX: inputValues[6],
              perlinMirrorY: inputValues[7],
              radiusSquare: inputValues[8],
            },
          );
          console.log("SpawnProof", aValues, bValues, cValues, inputValues);
          break;


        case "MoveProof":
          result = verifyMoveProof(
            {
              A: { X: aValues[0], Y: aValues[1] },
              B: {
                X: [bValues[0][0], bValues[0][1]],
                Y: [bValues[1][0], bValues[1][1]],
              },
              C: { X: cValues[0], Y: cValues[1] },
            },
            {
              fromPlanetHash: inputValues[0],
              toPlanetHash: inputValues[1],
              toPerlin: inputValues[2],
              universeRadius: inputValues[3],
              distance: inputValues[4],
              mimcHashKey: inputValues[5],
              spaceTypeKey: inputValues[6],
              perlinLengthScale: inputValues[7],
              perlinMirrorX: inputValues[8],
              perlinMirrorY: inputValues[9],
              toRadiusSquare: inputValues[10],
            },

          );
          console.log("Move proof", aValues, bValues, cValues, inputValues);
          break;

        case "BiomebaseProof":
          result = verifyBiomebaseProof(
            {
              A: aValues as [bigint, bigint],
              B: bValues as [[bigint, bigint], [bigint, bigint]],
              C: cValues as [bigint, bigint],
            },
            inputValues.slice(0, 7) as [
              bigint,
              bigint,
              bigint,
              bigint,
              bigint,
              bigint,
              bigint,
            ],
          );

          console.log(
            "BiomebaseProof",
            aValues,
            bValues,
            cValues,
            inputValues.slice(0, 7),
          );
          break;

        case "RevealProof":
          result = verifyRevealProof(
            {
              A: { X: aValues[0], Y: aValues[1] },
              B: {
                X: [bValues[0][0], bValues[0][1]],
                Y: [bValues[1][0], bValues[1][1]],
              },
              C: { X: cValues[0], Y: cValues[1] },
            },
            {
              planetHash: inputValues[0],
              perlin: inputValues[1],
              x: inputValues[2],
              y: inputValues[3],
              mimcHashKey: inputValues[4],
              spaceTypeKey: inputValues[5],
              perlinLengthScale: inputValues[6],
              perlinMirrorX: inputValues[7],
              perlinMirrorY: inputValues[8],
            },
          );

          console.log("RevealProof", aValues, bValues, cValues, inputValues);
          break;

        case "WhitelistProof":
          result = verifyWhitelistProof(
            {
              A: aValues as [bigint, bigint],
              B: bValues as [[bigint, bigint], [bigint, bigint]],
              C: cValues as [bigint, bigint],
            },
            inputValues.slice(0, 2) as [bigint, bigint],
          );
          console.log(
            "WhitelistProof",
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
            <option value="VerifyDelegation">Verify Delegation</option>
            <option value="SpawnProof">Spawn Proof</option>
            <option value="MoveProof">Move Proof</option>
            <option value="BiomebaseProof">Biomebase Proof</option>
            <option value="RevealProof">Reveal Proof</option>
            <option value="WhitelistProof">Whitelist Proof</option>
          </select>
        </div>

        {/* A, B, and C fields */}

        {proofType === "VerifyDelegation" ? (
          <div>
            <label className="block text-gray-700">Delegator Address</label>
            <input
              type="text"
              value={delegator}
              onChange={(e) => setDelegator(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              placeholder="Enter Delegator Address"
            />

            <label className="mt-4 block text-gray-700">Resource ID</label>
            <input
              type="text"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              placeholder="Enter Resource ID"
            />

            <label className="mt-4 block text-gray-700">Data Bytes</label>
            <input
              type="text"
              value={dataBytes}
              onChange={(e) => setDataBytes(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              placeholder="Enter Data Bytes"
            />
          </div>
        ) : (
          <>
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
          </>
        )}
        {/* Conditional Input Field Rendering */}
        {(proofType === "SpawnProof" ||
          proofType === "RevealProof" ||
          proofType === "MoveProof") && (
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
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  placeholder={`Input[${i}]`}
                />
              ))}
            </div>
          </div>
        )}

        {(proofType === "WhitelistProof" || proofType === "BiomebaseProof") && (
          <div>
            <label className="block text-gray-700">Input (7 values)</label>
            <div className="grid grid-cols-2 gap-2">
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
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  placeholder={`Input[${i}]`}
                />
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="block w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600"
        >
          Verify
        </button>
      </form>
    </div>
  );
};
