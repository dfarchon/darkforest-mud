import type { LocationId } from "@df/types";
import { ArtifactType, TooltipName } from "@df/types";
import React, { useCallback } from "react";

import { KardashevPane } from "../Panes/KardashevPane";
import { TooltipTrigger } from "../Panes/Tooltip";
import { useActiveArtifact, usePlanet, useUIManager } from "../Utils/AppHooks";
import { TOGGLE_KARDASHEV_PANE } from "../Utils/ShortcutConstants";
import type { ModalHandle } from "../Views/ModalPane";
import { MaybeShortcutButton } from "./MaybeShortcutButton";

export function OpenKardashevButton({
  modal,
  planetId,
}: {
  modal: ModalHandle;
  planetId: LocationId | undefined;
}) {
  const uiManager = useUIManager();
  const planetWrapper = usePlanet(uiManager, planetId);
  const activeArtifact = useActiveArtifact(planetWrapper, uiManager);
  const activeArtifactCheckPassed =
    activeArtifact && activeArtifact.artifactType === ArtifactType.Kardashev;

  const title = "Kardashev";
  const shortcut = TOGGLE_KARDASHEV_PANE;

  const disabled = !activeArtifactCheckPassed;

  const open = useCallback(() => {
    const element = () => (
      <KardashevPane initialPlanetId={planetId} modal={modal} />
    );
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
        name={disabled ? TooltipName.KardashevDisabled : TooltipName.Kardashev}
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
