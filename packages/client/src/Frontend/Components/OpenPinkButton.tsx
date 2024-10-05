import type { LocationId } from "@df/types";
import { TooltipName } from "@df/types";
import React, { useCallback, useMemo } from "react";

import { PinkPane } from "../Panes/PinkPane";
import { TooltipTrigger } from "../Panes/Tooltip";
import { usePlanet, useUIManager } from "../Utils/AppHooks";
import { TOGGLE_PINK_PANE } from "../Utils/ShortcutConstants";
import type { ModalHandle } from "../Views/ModalPane";
import { MaybeShortcutButton } from "./MaybeShortcutButton";

export function OpenPinkButton({
  modal,
  planetId,
}: {
  modal: ModalHandle;
  planetId: LocationId | undefined;
}) {
  const uiManager = useUIManager();
  const planetWrapper = usePlanet(uiManager, planetId);
  const planet = planetWrapper.value;

  const pinkZonePassed = useMemo(() => {
    return planet && uiManager.checkPlanetCanPink(planet.locationId);
  }, [planet]);

  const title = "Pink";
  const shortcut = TOGGLE_PINK_PANE;

  const disabled = !pinkZonePassed;

  const open = useCallback(() => {
    const element = () => <PinkPane initialPlanetId={planetId} modal={modal} />;
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
        name={disabled ? TooltipName.PinkDisabled : TooltipName.Pink}
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
