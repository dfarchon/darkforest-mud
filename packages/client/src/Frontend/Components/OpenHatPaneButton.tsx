import type { LocationId } from "@df/types";
import { TooltipName } from "@df/types";
import React, { useCallback } from "react";

import { HatPane } from "../Panes/HatPane";
import { TooltipTrigger } from "../Panes/Tooltip";
import { TOGGLE_HAT_PANE } from "../Utils/ShortcutConstants";
import type { ModalHandle } from "../Views/ModalPane";
import { MaybeShortcutButton } from "./MaybeShortcutButton";

export function OpenHatPaneButton({
  modal,
  planetId,
}: {
  modal: ModalHandle;
  planetId: LocationId | undefined;
}) {
  const title = "Buy Skin";
  const shortcut = TOGGLE_HAT_PANE;

  const open = useCallback(() => {
    const element = () => <HatPane modal={modal} initialPlanetId={planetId} />;
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
    >
      <TooltipTrigger
        name={TooltipName.BuyHat}
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
