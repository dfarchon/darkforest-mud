import React, { useEffect, useMemo, useRef, useState } from "react";

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

  // State for debounced values
  const [debouncedState, setDebouncedState] = useState<{
    isVisible: boolean;
    planetData: typeof hoverWrapper | null;
  }>({
    isVisible: false,
    planetData: null,
  });

  // Ref for tracking updates
  const updateRef = useRef({
    timer: null as NodeJS.Timeout | null,
    lastUpdate: 0,
  });

  // Update state with debounce
  useEffect(() => {
    const now = Date.now();

    // Clear existing timer
    if (updateRef.current.timer) {
      clearTimeout(updateRef.current.timer);
    }

    // Calculate new state
    const newVisible =
      !!hovering &&
      !sending &&
      !uiManager.getMouseDownCoords() &&
      (hovering.locationId !== selected?.locationId ||
        !uiManager.getPlanetHoveringInRenderer());

    // Set timer for state update
    updateRef.current.timer = setTimeout(() => {
      setDebouncedState({
        isVisible: newVisible,
        planetData: newVisible ? hoverWrapper : null,
      });
      updateRef.current.lastUpdate = now;
    }, 500); // 500ms debounce

    // Cleanup
    return () => {
      if (updateRef.current.timer) {
        clearTimeout(updateRef.current.timer);
      }
    };
  }, [hovering, selected, sending, uiManager, hoverWrapper]);

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
        debouncedState.planetData?.value?.destroyed
          ? snips.destroyedBackground
          : debouncedState.planetData?.value?.frozen
            ? snips.frozenBackground
            : undefined
      }
      visible={debouncedState.isVisible}
      element={
        <PlanetCard
          standalone
          planetWrapper={debouncedState.planetData || hoverWrapper}
        />
      }
    />
  );
}
