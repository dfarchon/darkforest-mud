import { useMUD } from "@mud/MUDContext";
import React, { useState } from "react";

interface PlanetUpgradeProps {
  onSubmit: (planetHash: string, branch: number) => void;
}

export const PlanetUpgradeBranchForm: React.FC<PlanetUpgradeProps> = ({
  onSubmit,
}) => {
  const {
    systemCalls: { planetUpgradeBranch },
  } = useMUD();

  const [planetHash, setPlanetHash] = useState<string>(
    "0x287c5ea0d4d162f78a5246328a252f7eb2effa479fe4a3c5f8035cfd2d5cbd64",
  );
  const [branch, setBranch] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    planetUpgradeBranch(BigInt(planetHash), branch);
    onSubmit(planetHash, branch);
  };

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-6 text-center text-2xl font-bold">Upgrade Planet</h2>
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
        <div className="flex flex-row gap-3">
          <div>
            <label className="block text-gray-700">Branch</label>
            <input
              type="number"
              value={branch}
              onChange={(e) => setBranch(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              placeholder="Enter Branch Upgrades"
              min={0}
              max={2}
            />
          </div>
        </div>
        <button
          type="submit"
          className="block w-full rounded-md bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
        >
          Upgrade Planet
        </button>
      </form>
    </div>
  );
};
