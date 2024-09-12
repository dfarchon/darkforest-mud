import { useMUD } from "@mud/MUDContext";
import React, { useState } from "react";

interface PlanetUpgradeProps {
  onSubmit: (
    planetHash: string,
    rangeUpgrades: number,
    speedUpgrades: number,
    defenseUpgrades: number,
  ) => void;
}

export const PlanetUpgradeForm: React.FC<PlanetUpgradeProps> = ({
  onSubmit,
}) => {
  const {
    systemCalls: { planetUpgrade },
  } = useMUD();

  const [planetHash, setPlanetHash] = useState<string>(
    "0x29d4c60e4be1baaf93a4ea7d747553119d9aa6103dd7d6a83f70d7ae7e96e963",
  );
  const [rangeUpgrades, setRangeUpgrades] = useState<number>(0);
  const [speedUpgrades, setSpeedUpgrades] = useState<number>(0);
  const [defenseUpgrades, setDefenseUpgrades] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    planetUpgrade(planetHash, rangeUpgrades, speedUpgrades, defenseUpgrades);
    onSubmit(planetHash, rangeUpgrades, speedUpgrades, defenseUpgrades);
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
            <label className="block text-gray-700">Range Upgrades</label>
            <input
              type="number"
              value={rangeUpgrades}
              onChange={(e) => setRangeUpgrades(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              placeholder="Enter Range Upgrades"
            />
          </div>
          <div>
            <label className="block text-gray-700">Speed Upgrades</label>
            <input
              type="number"
              value={speedUpgrades}
              onChange={(e) => setSpeedUpgrades(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              placeholder="Enter Speed Upgrades"
            />
          </div>
          <div>
            <label className="block text-gray-700">Defense Upgrades</label>
            <input
              type="number"
              value={defenseUpgrades}
              onChange={(e) => setDefenseUpgrades(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              placeholder="Enter Defense Upgrades"
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
