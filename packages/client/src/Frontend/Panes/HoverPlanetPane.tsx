import React, { useEffect, useState } from "react";

import { snips } from "../Styles/dfstyles";
import {
  useHoverPlanet,
  useSelectedPlanet,
  useUIManager,
} from "../Utils/AppHooks";
import UIEmitter, { UIEmitterEvent } from "../Utils/UIEmitter";
import { PlanetCard } from "../Views/PlanetCard";
import { HoverPane } from "./HoverPane";

/**
 * This is the pane that is rendered when you hover over a planet.
 */
export function HoverPlanetPane() {
  const uiManager = useUIManager();
  const hoverWrapper = useHoverPlanet(uiManager);
  const hovering = hoverWrapper.value;
  const selected = useSelectedPlanet(uiManager).value;

  const [sending, setSending] = useState<boolean>(false);

  // Calculate visibility directly without debounce
  const isVisible =
    !!hovering &&
    !sending &&
    !uiManager.getMouseDownCoords() &&
    (hovering.locationId !== selected?.locationId ||
      !uiManager.getPlanetHoveringInRenderer());

  // Event listeners for sending state
  useEffect(() => {
    const uiEmitter = UIEmitter.getInstance();
    const setSendTrue = () => setSending(true);
    const setSendFalse = () => setSending(false);

    uiEmitter.addListener(UIEmitterEvent.SendCancelled, setSendFalse);
    uiEmitter.addListener(UIEmitterEvent.SendInitiated, setSendTrue);
    uiEmitter.addListener(UIEmitterEvent.SendCompleted, setSendFalse);

    return () => {
      uiEmitter.removeListener(UIEmitterEvent.SendCancelled, setSendFalse);
      uiEmitter.removeListener(UIEmitterEvent.SendInitiated, setSendTrue);
      uiEmitter.removeListener(UIEmitterEvent.SendCompleted, setSendFalse);
    };
  }, []);

  return (
    <HoverPane
      style={
        // eslint-disable-next-line no-nested-ternary
        hovering?.destroyed
          ? snips.destroyedBackground
          : hovering?.frozen
            ? snips.frozenBackground
            : undefined
      }
      visible={isVisible}
      element={<PlanetCard standalone planetWrapper={hoverWrapper} />}
    />
  );
}
