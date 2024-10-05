import type { Initializers } from "@df/settings";
import React from "react";

import { Spacer } from "../../Components/CoreUI";
import type { DarkForestCheckbox } from "../../Components/Input";
import { Checkbox } from "../../Components/Input";
import type { LobbiesPaneProps } from "./LobbiesUtils";

export function SpaceshipsPane({ config, onUpdate }: LobbiesPaneProps) {
  return (
    <>
      <div>
        Turn on or off whether the game gives each player one of each of these
        spaceships on their home planet.
        <Spacer height={12} />
      </div>
      {(
        [
          "GEAR",
          "MOTHERSHIP",
          "TITAN",
          "CRESCENT",
          "WHALE",
          "PINKSHIP",
        ] as Array<keyof Initializers["SPACESHIPS"]>
      ).map((ship) => (
        <ToggleSpaceship
          config={config}
          onUpdate={onUpdate}
          spaceship={ship}
          key={ship}
        />
      ))}
    </>
  );
}

function ToggleSpaceship({
  config,
  onUpdate,
  spaceship,
}: LobbiesPaneProps & { spaceship: keyof Initializers["SPACESHIPS"] }) {
  return (
    <Checkbox
      label={`enable ${spaceship}`}
      checked={(config.SPACESHIPS.displayValue ?? {})[spaceship]}
      onChange={(e: Event & React.ChangeEvent<DarkForestCheckbox>) => {
        onUpdate({
          type: "SPACESHIPS",
          value: {
            ...config.SPACESHIPS.currentValue,
            [spaceship]: e.target.checked,
          },
        });
      }}
    />
  );
}
