import React from "react";

interface SyncClientStatusRecProps {
  message: string;
  percentage: number;
}

export const SyncClientStatusRec: React.FC<SyncClientStatusRecProps> = ({
  message,
  percentage,
}) => {
  return (
    <div className="flex flex-col items-center rounded-lg bg-gray-800 p-6 shadow-lg">
      <div className="mb-2 text-xl font-semibold">{message}</div>
      <div className="text-lg text-gray-400">({Math.floor(percentage)}%)</div>
      <div className="mt-4 w-full">
        <div className="relative pt-1">
          <div className="mb-2 flex items-center justify-between">
            <div className="inline-block rounded-full bg-green-500 px-2 py-1 text-xs font-semibold text-gray-600">
              Sync
            </div>
          </div>
          <div className="flex flex-1 flex-col">
            <div className="relative pt-1">
              <div
                className="flex items-center justify-between text-xs font-semibold"
                style={{ width: `${percentage}%` }}
              >
                <div
                  className="h-2 rounded bg-green-500"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncClientStatusRec;
