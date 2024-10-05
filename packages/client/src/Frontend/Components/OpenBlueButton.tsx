import type { LocationId } from "@df/types";
import { TooltipName } from "@df/types";
import React, { useCallback, useMemo } from "react";

import { BluePane } from "../Panes/BluePane";
import { TooltipTrigger } from "../Panes/Tooltip";
import { usePlanet, useUIManager } from "../Utils/AppHooks";
import { TOGGLE_BLUE_PANE } from "../Utils/ShortcutConstants";
import type { ModalHandle } from "../Views/ModalPane";
import { MaybeShortcutButton } from "./MaybeShortcutButton";

export function OpenBlueButton({
  modal,
  planetId,
}: {
  modal: ModalHandle;
  planetId: LocationId | undefined;
}) {
  const uiManager = useUIManager();
  const planetWrapper = usePlanet(uiManager, planetId);
  const planet = planetWrapper.value;

  const blueZonePassed = useMemo(() => {
    return planet && uiManager.checkPlanetCanBlue(planet.locationId);
  }, [planet]);

  const title = "Blue";
  const shortcut = TOGGLE_BLUE_PANE;

  const disabled = !blueZonePassed;

  const open = useCallback(() => {
    const element = () => <BluePane initialPlanetId={planetId} modal={modal} />;
    const helpContent = <></>;

    modal.push({
      title,
      element,
      helpContent,
    });
  }, [modal, planetId]);

  return (
    <MaybeShortcutButton
      size="stretch"
      onClick={open}
      onShortcutPressed={open}
      shortcutKey={shortcut}
      shortcutText={shortcut}
      disabled={disabled}
    >
      <TooltipTrigger
        name={disabled ? TooltipName.BlueDisabled : TooltipName.Blue}
        style={{
          display: "block",
          width: "100%",
          textAlign: "center",
        }}
      >
        {title}
      </TooltipTrigger>
    </MaybeShortcutButton>
  );
}
