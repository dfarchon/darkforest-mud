import type { LocationId } from "@df/types";
import { ArtifactType, TooltipName } from "@df/types";
import React, { useCallback } from "react";

import { DropBombPane } from "../Panes/DropBombPane";
import { TooltipTrigger } from "../Panes/Tooltip";
import { useActiveArtifact, usePlanet, useUIManager } from "../Utils/AppHooks";
import { TOGGLE_DROP_BOMB_PANE } from "../Utils/ShortcutConstants";
import type { ModalHandle } from "../Views/ModalPane";
import { MaybeShortcutButton } from "./MaybeShortcutButton";

export function OpenDropBombButton({
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
    activeArtifact && activeArtifact.artifactType === ArtifactType.Bomb;

  const title = "Drop Bomb";
  const shortcut = TOGGLE_DROP_BOMB_PANE;

  const disabled = !activeArtifactCheckPassed;

  const open = useCallback(() => {
    const element = () => (
      <DropBombPane initialPlanetId={planetId} modal={modal} />
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
        name={disabled ? TooltipName.DropBombDisabled : TooltipName.DropBomb}
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
