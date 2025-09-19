import React from "react";

import { SelectedVoyagePane } from "../Components/SelectedVoyagePane";
import { useHoverVoyage, useUIManager } from "../Utils/AppHooks";
import { HoverPane } from "./HoverPane";

/**
 * This is the pane that is rendered when you hover over a voyage.
 */
export function VoyageHoverPane() {
  const uiManager = useUIManager();
  const hoverWrapper = useHoverVoyage(uiManager);
  const hoveringVoyage = hoverWrapper.value;

  const isVisible = !!hoveringVoyage && !uiManager.getMouseDownCoords();

  return (
    <HoverPane
      visible={isVisible}
      element={
        hoveringVoyage ? (
          <SelectedVoyagePane
            voyage={hoveringVoyage}
            showCloseButton={false}
            fixedPosition={false}
          />
        ) : null
      }
    />
  );
}
